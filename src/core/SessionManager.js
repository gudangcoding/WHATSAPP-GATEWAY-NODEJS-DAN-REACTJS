const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/encryption');
const SessionRepository = require('../repositories/SessionRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const MessageRepository = require('../repositories/MessageRepository');
const SocketManager = require('./SocketManager');

class SessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map(); // deviceId -> session instance
    this.reconnectTimers = new Map(); // deviceId -> timer
    this.sessionRepository = new SessionRepository();
    this.deviceRepository = new DeviceRepository();
    this.messageRepository = new MessageRepository();
    this.socketManager = SocketManager.getInstance();
    
    // Configuration
    this.config = {
      maxReconnectAttempts: 5,
      reconnectInterval: 5000,
      sessionTimeout: 300000, // 5 minutes
      qrTimeout: 60000, // 1 minute
      authStateEncryption: true
    };
    
    this.init();
  }

  async init() {
    logger.info('SessionManager: Initializing...');
    
    // Load active sessions from database
    await this.loadActiveSessions();
    
    // Setup cleanup intervals
    this.setupCleanupIntervals();
    
    logger.info('SessionManager: Initialized successfully');
  }

  /**
   * Load active sessions from database and restore them
   */
  async loadActiveSessions() {
    try {
      const activeSessions = await this.sessionRepository.getActiveSessions();
      
      for (const sessionData of activeSessions) {
        const device = await this.deviceRepository.findById(sessionData.device_id);
        if (device && device.is_active) {
          logger.info(`SessionManager: Restoring session for device ${device.id} (${device.name})`);
          await this.startSession(device.id, { autoReconnect: true });
        }
      }
    } catch (error) {
      logger.error('SessionManager: Error loading active sessions:', error);
    }
  }

  /**
   * Start WhatsApp session for a device
   */
  async startSession(deviceId, options = {}) {
    try {
      // Check if session already exists
      if (this.sessions.has(deviceId)) {
        logger.warn(`SessionManager: Session already exists for device ${deviceId}`);
        return { success: false, message: 'Session already active' };
      }

      const device = await this.deviceRepository.findById(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      if (!device.is_active) {
        throw new Error(`Device ${deviceId} is not active`);
      }

      // Update device status
      await this.deviceRepository.updateStatus(deviceId, 'connecting');

      // Create session directory
      const sessionDir = path.join(process.cwd(), 'storage', 'sessions', `device_${deviceId}`);
      await fs.mkdir(sessionDir, { recursive: true });

      // Load or create auth state
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      // Get latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info(`SessionManager: Using Baileys version ${version}, isLatest: ${isLatest}`);

      // Create WhatsApp socket
      const socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: logger.child({ deviceId }),
        browser: ['WhatsApp Gateway', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        ...options.socketOptions
      });

      // Store session
      const sessionInstance = {
        socket,
        deviceId,
        device,
        saveCreds,
        status: 'starting',
        startedAt: new Date(),
        lastActivity: new Date(),
        reconnectAttempts: 0,
        qrGenerated: false
      };

      this.sessions.set(deviceId, sessionInstance);

      // Setup event handlers
      this.setupSocketEvents(sessionInstance);

      // Update session in database
      await this.sessionRepository.createOrUpdate({
        device_id: deviceId,
        session_id: `session_${deviceId}_${Date.now()}`,
        status: 'starting',
        last_activity: new Date(),
        reconnect_attempts: 0
      });

      logger.info(`SessionManager: Session started for device ${deviceId}`);
      
      return { success: true, message: 'Session started successfully' };

    } catch (error) {
      logger.error(`SessionManager: Error starting session for device ${deviceId}:`, error);
      
      // Update device status to error
      await this.deviceRepository.updateStatus(deviceId, 'error');
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Stop WhatsApp session for a device
   */
  async stopSession(deviceId, reason = 'manual') {
    try {
      const sessionInstance = this.sessions.get(deviceId);
      if (!sessionInstance) {
        return { success: false, message: 'Session not found' };
      }

      logger.info(`SessionManager: Stopping session for device ${deviceId}, reason: ${reason}`);

      // Clear reconnect timer
      if (this.reconnectTimers.has(deviceId)) {
        clearTimeout(this.reconnectTimers.get(deviceId));
        this.reconnectTimers.delete(deviceId);
      }

      // Close socket connection
      if (sessionInstance.socket) {
        sessionInstance.socket.end();
      }

      // Remove from active sessions
      this.sessions.delete(deviceId);

      // Update database
      await this.sessionRepository.updateStatus(deviceId, 'inactive');
      await this.deviceRepository.updateStatus(deviceId, 'disconnected');

      // Emit event
      this.emit('sessionStopped', { deviceId, reason });
      this.socketManager.emitToDevice(deviceId, 'device:disconnected', { reason });

      logger.info(`SessionManager: Session stopped for device ${deviceId}`);
      
      return { success: true, message: 'Session stopped successfully' };

    } catch (error) {
      logger.error(`SessionManager: Error stopping session for device ${deviceId}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Restart WhatsApp session for a device
   */
  async restartSession(deviceId) {
    logger.info(`SessionManager: Restarting session for device ${deviceId}`);
    
    await this.stopSession(deviceId, 'restart');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    return await this.startSession(deviceId);
  }

  /**
   * Setup socket event handlers
   */
  setupSocketEvents(sessionInstance) {
    const { socket, deviceId, device, saveCreds } = sessionInstance;

    // Connection updates
    socket.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(sessionInstance, update);
    });

    // Credentials update
    socket.ev.on('creds.update', async () => {
      await saveCreds();
      await this.saveAuthState(sessionInstance);
    });

    // Messages
    socket.ev.on('messages.upsert', async (messageUpdate) => {
      await this.handleIncomingMessages(sessionInstance, messageUpdate);
    });

    // Message updates (delivery, read receipts)
    socket.ev.on('messages.update', async (updates) => {
      await this.handleMessageUpdates(sessionInstance, updates);
    });

    // Presence updates
    socket.ev.on('presence.update', async (presence) => {
      logger.debug(`SessionManager: Presence update for device ${deviceId}:`, presence);
    });

    // Contacts update
    socket.ev.on('contacts.update', async (contacts) => {
      await this.handleContactsUpdate(sessionInstance, contacts);
    });

    // Groups update
    socket.ev.on('groups.update', async (groups) => {
      await this.handleGroupsUpdate(sessionInstance, groups);
    });
  }

  /**
   * Handle connection updates
   */
  async handleConnectionUpdate(sessionInstance, update) {
    const { deviceId, device } = sessionInstance;
    const { connection, lastDisconnect, qr } = update;

    logger.info(`SessionManager: Connection update for device ${deviceId}:`, { connection, qr: !!qr });

    try {
      if (qr) {
        // Generate QR code
        await this.handleQRCode(sessionInstance, qr);
      }

      if (connection === 'close') {
        await this.handleConnectionClose(sessionInstance, lastDisconnect);
      } else if (connection === 'open') {
        await this.handleConnectionOpen(sessionInstance);
      } else if (connection === 'connecting') {
        await this.deviceRepository.updateStatus(deviceId, 'connecting');
        sessionInstance.status = 'connecting';
      }

    } catch (error) {
      logger.error(`SessionManager: Error handling connection update for device ${deviceId}:`, error);
    }
  }

  /**
   * Handle QR code generation
   */
  async handleQRCode(sessionInstance, qr) {
    const { deviceId } = sessionInstance;
    
    try {
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(qr, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Update device with QR code
      await this.deviceRepository.update(deviceId, {
        qr_code: qrDataURL,
        status: 'pairing'
      });

      sessionInstance.qrGenerated = true;
      sessionInstance.status = 'pairing';

      // Emit QR code via Socket.IO
      this.socketManager.emitToDevice(deviceId, 'qr:updated', {
        qr: qrDataURL,
        timestamp: new Date()
      });

      // Emit event
      this.emit('qrGenerated', { deviceId, qr: qrDataURL });

      logger.info(`SessionManager: QR code generated for device ${deviceId}`);

      // Set QR timeout
      setTimeout(async () => {
        if (sessionInstance.status === 'pairing') {
          logger.warn(`SessionManager: QR timeout for device ${deviceId}`);
          await this.stopSession(deviceId, 'qr_timeout');
        }
      }, this.config.qrTimeout);

    } catch (error) {
      logger.error(`SessionManager: Error handling QR code for device ${deviceId}:`, error);
    }
  }

  /**
   * Handle connection open (successful connection)
   */
  async handleConnectionOpen(sessionInstance) {
    const { deviceId, socket } = sessionInstance;
    
    try {
      // Get user info
      const userInfo = socket.user;
      const phoneNumber = userInfo?.id?.split(':')[0];

      // Update device and session
      await this.deviceRepository.update(deviceId, {
        phone_number: phoneNumber,
        status: 'connected',
        qr_code: null,
        last_seen: new Date()
      });

      await this.sessionRepository.updateStatus(deviceId, 'active');

      sessionInstance.status = 'connected';
      sessionInstance.lastActivity = new Date();
      sessionInstance.reconnectAttempts = 0;

      // Clear QR timeout
      if (this.reconnectTimers.has(deviceId)) {
        clearTimeout(this.reconnectTimers.get(deviceId));
        this.reconnectTimers.delete(deviceId);
      }

      // Emit events
      this.emit('sessionConnected', { deviceId, phoneNumber, userInfo });
      this.socketManager.emitToDevice(deviceId, 'device:connected', {
        phoneNumber,
        userInfo,
        timestamp: new Date()
      });

      logger.info(`SessionManager: Device ${deviceId} connected successfully with number ${phoneNumber}`);

    } catch (error) {
      logger.error(`SessionManager: Error handling connection open for device ${deviceId}:`, error);
    }
  }

  /**
   * Handle connection close
   */
  async handleConnectionClose(sessionInstance, lastDisconnect) {
    const { deviceId } = sessionInstance;
    
    try {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const reason = lastDisconnect?.error?.output?.statusCode;

      logger.info(`SessionManager: Connection closed for device ${deviceId}, reason: ${reason}, shouldReconnect: ${shouldReconnect}`);

      if (reason === DisconnectReason.loggedOut) {
        // Device was logged out, stop session
        await this.deviceRepository.updateStatus(deviceId, 'disconnected');
        await this.sessionRepository.updateStatus(deviceId, 'inactive');
        
        this.sessions.delete(deviceId);
        
        this.emit('sessionLoggedOut', { deviceId });
        this.socketManager.emitToDevice(deviceId, 'device:logged_out', { timestamp: new Date() });
        
      } else if (reason === DisconnectReason.banned) {
        // Device was banned
        await this.deviceRepository.updateStatus(deviceId, 'banned');
        await this.sessionRepository.updateStatus(deviceId, 'inactive');
        
        this.sessions.delete(deviceId);
        
        this.emit('sessionBanned', { deviceId });
        this.socketManager.emitToDevice(deviceId, 'device:banned', { timestamp: new Date() });
        
      } else if (shouldReconnect && sessionInstance.reconnectAttempts < this.config.maxReconnectAttempts) {
        // Attempt reconnection
        await this.scheduleReconnect(sessionInstance);
        
      } else {
        // Max reconnect attempts reached or other error
        await this.deviceRepository.updateStatus(deviceId, 'error');
        await this.sessionRepository.updateStatus(deviceId, 'error');
        
        this.sessions.delete(deviceId);
        
        this.emit('sessionError', { deviceId, reason });
        this.socketManager.emitToDevice(deviceId, 'device:error', { reason, timestamp: new Date() });
      }

    } catch (error) {
      logger.error(`SessionManager: Error handling connection close for device ${deviceId}:`, error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  async scheduleReconnect(sessionInstance) {
    const { deviceId } = sessionInstance;
    
    sessionInstance.reconnectAttempts++;
    
    const delay = this.config.reconnectInterval * Math.pow(2, sessionInstance.reconnectAttempts - 1); // Exponential backoff
    
    logger.info(`SessionManager: Scheduling reconnect for device ${deviceId} in ${delay}ms (attempt ${sessionInstance.reconnectAttempts})`);
    
    await this.deviceRepository.updateStatus(deviceId, 'connecting');
    await this.sessionRepository.update(deviceId, {
      reconnect_attempts: sessionInstance.reconnectAttempts
    });
    
    const timer = setTimeout(async () => {
      try {
        logger.info(`SessionManager: Attempting reconnect for device ${deviceId}`);
        
        // Remove old session
        this.sessions.delete(deviceId);
        
        // Start new session
        await this.startSession(deviceId, { autoReconnect: true });
        
      } catch (error) {
        logger.error(`SessionManager: Reconnect failed for device ${deviceId}:`, error);
      }
    }, delay);
    
    this.reconnectTimers.set(deviceId, timer);
  }

  /**
   * Handle incoming messages
   */
  async handleIncomingMessages(sessionInstance, messageUpdate) {
    const { deviceId } = sessionInstance;
    const { messages, type } = messageUpdate;

    if (type !== 'notify') return;

    for (const message of messages) {
      try {
        // Skip if message is from self
        if (message.key.fromMe) continue;

        await this.processIncomingMessage(sessionInstance, message);
        
      } catch (error) {
        logger.error(`SessionManager: Error processing incoming message for device ${deviceId}:`, error);
      }
    }
  }

  /**
   * Process individual incoming message
   */
  async processIncomingMessage(sessionInstance, message) {
    const { deviceId, socket } = sessionInstance;
    
    // Extract message data
    const messageData = {
      device_id: deviceId,
      message_id: message.key.id,
      from_number: message.key.remoteJid?.split('@')[0],
      to_number: socket.user?.id?.split(':')[0],
      type: this.getMessageType(message),
      content: this.getMessageContent(message),
      direction: 'incoming',
      is_group: message.key.remoteJid?.includes('@g.us'),
      group_id: message.key.remoteJid?.includes('@g.us') ? message.key.remoteJid : null,
      metadata: {
        pushName: message.pushName,
        participant: message.key.participant,
        timestamp: message.messageTimestamp
      }
    };

    // Save message to database
    await this.messageRepository.create(messageData);

    // Update last activity
    sessionInstance.lastActivity = new Date();

    // Emit event for auto-reply processing
    this.emit('messageReceived', { deviceId, message: messageData, rawMessage: message });

    logger.debug(`SessionManager: Incoming message processed for device ${deviceId}:`, messageData);
  }

  /**
   * Handle message updates (delivery, read receipts)
   */
  async handleMessageUpdates(sessionInstance, updates) {
    const { deviceId } = sessionInstance;

    for (const update of updates) {
      try {
        const updateData = {};
        
        if (update.update.status) {
          updateData.status = this.mapMessageStatus(update.update.status);
        }
        
        if (update.update.status === 3) { // Delivered
          updateData.delivered_at = new Date();
        } else if (update.update.status === 4) { // Read
          updateData.read_at = new Date();
        }

        if (Object.keys(updateData).length > 0) {
          await this.messageRepository.updateByMessageId(update.key.id, updateData);
        }

      } catch (error) {
        logger.error(`SessionManager: Error handling message update for device ${deviceId}:`, error);
      }
    }
  }

  /**
   * Save encrypted auth state to database
   */
  async saveAuthState(sessionInstance) {
    const { deviceId } = sessionInstance;
    
    try {
      const sessionDir = path.join(process.cwd(), 'storage', 'sessions', `device_${deviceId}`);
      const credsPath = path.join(sessionDir, 'creds.json');
      
      if (await fs.access(credsPath).then(() => true).catch(() => false)) {
        const credsData = await fs.readFile(credsPath, 'utf8');
        
        let authState = credsData;
        let encrypted = false;
        
        if (this.config.authStateEncryption) {
          authState = encrypt(credsData);
          encrypted = true;
        }
        
        await this.sessionRepository.updateAuthState(deviceId, authState, encrypted);
      }
      
    } catch (error) {
      logger.error(`SessionManager: Error saving auth state for device ${deviceId}:`, error);
    }
  }

  /**
   * Get session status for a device
   */
  getSessionStatus(deviceId) {
    const sessionInstance = this.sessions.get(deviceId);
    
    if (!sessionInstance) {
      return { status: 'inactive', connected: false };
    }
    
    return {
      status: sessionInstance.status,
      connected: sessionInstance.status === 'connected',
      startedAt: sessionInstance.startedAt,
      lastActivity: sessionInstance.lastActivity,
      reconnectAttempts: sessionInstance.reconnectAttempts,
      qrGenerated: sessionInstance.qrGenerated
    };
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    const sessions = {};
    
    for (const [deviceId, sessionInstance] of this.sessions) {
      sessions[deviceId] = this.getSessionStatus(deviceId);
    }
    
    return sessions;
  }

  /**
   * Send message through session
   */
  async sendMessage(deviceId, to, message, options = {}) {
    const sessionInstance = this.sessions.get(deviceId);
    
    if (!sessionInstance || sessionInstance.status !== 'connected') {
      throw new Error('Session not connected');
    }
    
    const { socket } = sessionInstance;
    
    try {
      const result = await socket.sendMessage(to, message, options);
      
      // Update last activity
      sessionInstance.lastActivity = new Date();
      
      return result;
      
    } catch (error) {
      logger.error(`SessionManager: Error sending message for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Setup cleanup intervals
   */
  setupCleanupIntervals() {
    // Cleanup inactive sessions every 5 minutes
    setInterval(async () => {
      await this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);

    // Update session activity every minute
    setInterval(async () => {
      await this.updateSessionActivity();
    }, 60 * 1000);
  }

  /**
   * Cleanup inactive sessions
   */
  async cleanupInactiveSessions() {
    const now = new Date();
    
    for (const [deviceId, sessionInstance] of this.sessions) {
      const inactiveTime = now - sessionInstance.lastActivity;
      
      if (inactiveTime > this.config.sessionTimeout) {
        logger.warn(`SessionManager: Cleaning up inactive session for device ${deviceId}`);
        await this.stopSession(deviceId, 'timeout');
      }
    }
  }

  /**
   * Update session activity in database
   */
  async updateSessionActivity() {
    for (const [deviceId, sessionInstance] of this.sessions) {
      try {
        await this.sessionRepository.updateActivity(deviceId, sessionInstance.lastActivity);
      } catch (error) {
        logger.error(`SessionManager: Error updating activity for device ${deviceId}:`, error);
      }
    }
  }

  /**
   * Utility methods
   */
  getMessageType(message) {
    if (message.message?.conversation) return 'text';
    if (message.message?.extendedTextMessage) return 'text';
    if (message.message?.imageMessage) return 'image';
    if (message.message?.videoMessage) return 'video';
    if (message.message?.documentMessage) return 'document';
    if (message.message?.audioMessage) return 'audio';
    if (message.message?.locationMessage) return 'location';
    if (message.message?.contactMessage) return 'contact';
    if (message.message?.listMessage) return 'list';
    if (message.message?.stickerMessage) return 'sticker';
    return 'text';
  }

  getMessageContent(message) {
    if (message.message?.conversation) return message.message.conversation;
    if (message.message?.extendedTextMessage) return message.message.extendedTextMessage.text;
    if (message.message?.imageMessage) return message.message.imageMessage.caption || '';
    if (message.message?.videoMessage) return message.message.videoMessage.caption || '';
    if (message.message?.documentMessage) return message.message.documentMessage.fileName || '';
    return '';
  }

  mapMessageStatus(status) {
    switch (status) {
      case 1: return 'sent';
      case 2: return 'delivered';
      case 3: return 'delivered';
      case 4: return 'read';
      default: return 'pending';
    }
  }

  handleContactsUpdate(sessionInstance, contacts) {
    // Implementation for contact updates
    logger.debug(`SessionManager: Contacts update for device ${sessionInstance.deviceId}:`, contacts.length);
  }

  handleGroupsUpdate(sessionInstance, groups) {
    // Implementation for group updates
    logger.debug(`SessionManager: Groups update for device ${sessionInstance.deviceId}:`, groups.length);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new SessionManager();
    }
    return instance;
  },
  SessionManager
};