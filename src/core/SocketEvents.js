const logger = require('../utils/logger');
const SessionRepository = require('../repositories/SessionRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const CampaignRepository = require('../repositories/CampaignRepository');

class SocketEvents {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.sessionRepository = new SessionRepository();
    this.deviceRepository = new DeviceRepository();
    this.campaignRepository = new CampaignRepository();
    
    // Event handlers registry
    this.eventHandlers = new Map();
    this.registerEventHandlers();
  }

  /**
   * Register all event handlers
   */
  registerEventHandlers() {
    // Device management events
    this.eventHandlers.set('device:subscribe', this.handleDeviceSubscribe.bind(this));
    this.eventHandlers.set('device:unsubscribe', this.handleDeviceUnsubscribe.bind(this));
    this.eventHandlers.set('device:status', this.handleDeviceStatus.bind(this));
    this.eventHandlers.set('device:list', this.handleDeviceList.bind(this));
    
    // Session management events
    this.eventHandlers.set('session:start', this.handleSessionStart.bind(this));
    this.eventHandlers.set('session:stop', this.handleSessionStop.bind(this));
    this.eventHandlers.set('session:restart', this.handleSessionRestart.bind(this));
    
    // QR code events
    this.eventHandlers.set('qr:request', this.handleQRRequest.bind(this));
    this.eventHandlers.set('qr:refresh', this.handleQRRefresh.bind(this));
    
    // Message events
    this.eventHandlers.set('message:send', this.handleMessageSend.bind(this));
    this.eventHandlers.set('message:history', this.handleMessageHistory.bind(this));
    
    // Campaign events
    this.eventHandlers.set('campaign:subscribe', this.handleCampaignSubscribe.bind(this));
    this.eventHandlers.set('campaign:status', this.handleCampaignStatus.bind(this));
    
    // System events
    this.eventHandlers.set('system:stats', this.handleSystemStats.bind(this));
    this.eventHandlers.set('ping', this.handlePing.bind(this));
  }

  /**
   * Setup socket event handlers
   */
  setupSocketEvents(socket) {
    // Register all event handlers
    for (const [event, handler] of this.eventHandlers) {
      socket.on(event, async (data, callback) => {
        try {
          await this.executeHandler(socket, event, handler, data, callback);
        } catch (error) {
          logger.error(`SocketEvents: Error handling ${event}:`, error);
          this.sendError(socket, callback, error.message);
        }
      });
    }

    // Handle any unregistered events
    socket.onAny((event, ...args) => {
      if (!this.eventHandlers.has(event)) {
        logger.warn(`SocketEvents: Unhandled event '${event}' from socket ${socket.id}`);
      }
    });
  }

  /**
   * Execute event handler with error handling and logging
   */
  async executeHandler(socket, event, handler, data, callback) {
    const startTime = Date.now();
    
    logger.debug(`SocketEvents: Handling ${event} for user ${socket.userId}`, data);
    
    try {
      const result = await handler(socket, data, callback);
      
      const duration = Date.now() - startTime;
      logger.debug(`SocketEvents: ${event} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`SocketEvents: ${event} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Device subscription handler
   */
  async handleDeviceSubscribe(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    // Subscribe to device updates
    socket.join(`device:${deviceId}`);
    
    // Track subscription
    if (!this.socketManager.deviceSubscriptions.has(deviceId)) {
      this.socketManager.deviceSubscriptions.set(deviceId, new Set());
    }
    this.socketManager.deviceSubscriptions.get(deviceId).add(socket.id);

    // Send current device status
    const SessionManager = require('./SessionManager').getInstance();
    const sessionStatus = SessionManager.getSessionStatus(deviceId);

    const response = {
      deviceId,
      device: {
        id: device.id,
        name: device.name,
        phone_number: device.phone_number,
        status: device.status,
        last_seen: device.last_seen,
        qr_code: device.qr_code
      },
      session: sessionStatus,
      subscribed: true
    };

    this.sendResponse(socket, callback, response);
    socket.emit('device:subscribed', { deviceId });

    logger.info(`SocketEvents: User ${socket.userId} subscribed to device ${deviceId}`);
  }

  /**
   * Device unsubscription handler
   */
  async handleDeviceUnsubscribe(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Unsubscribe from device updates
    socket.leave(`device:${deviceId}`);
    
    // Remove from tracking
    if (this.socketManager.deviceSubscriptions.has(deviceId)) {
      this.socketManager.deviceSubscriptions.get(deviceId).delete(socket.id);
      
      if (this.socketManager.deviceSubscriptions.get(deviceId).size === 0) {
        this.socketManager.deviceSubscriptions.delete(deviceId);
      }
    }

    this.sendResponse(socket, callback, { deviceId, unsubscribed: true });
    socket.emit('device:unsubscribed', { deviceId });

    logger.info(`SocketEvents: User ${socket.userId} unsubscribed from device ${deviceId}`);
  }

  /**
   * Device status handler
   */
  async handleDeviceStatus(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    // Get session status
    const SessionManager = require('./SessionManager').getInstance();
    const sessionStatus = SessionManager.getSessionStatus(deviceId);

    const response = {
      deviceId,
      device: {
        id: device.id,
        name: device.name,
        phone_number: device.phone_number,
        status: device.status,
        last_seen: device.last_seen,
        qr_code: device.qr_code
      },
      session: sessionStatus
    };

    this.sendResponse(socket, callback, response);
  }

  /**
   * Device list handler
   */
  async handleDeviceList(socket, data, callback) {
    try {
      const devices = await this.deviceRepository.findByUserId(socket.userId);
      const SessionManager = require('./SessionManager').getInstance();
      
      const deviceList = devices.map(device => ({
        id: device.id,
        name: device.name,
        phone_number: device.phone_number,
        status: device.status,
        last_seen: device.last_seen,
        is_active: device.is_active,
        session: SessionManager.getSessionStatus(device.id)
      }));

      this.sendResponse(socket, callback, { devices: deviceList });
    } catch (error) {
      this.sendError(socket, callback, 'Failed to fetch devices');
    }
  }

  /**
   * Session start handler
   */
  async handleSessionStart(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    try {
      const SessionManager = require('./SessionManager').getInstance();
      const result = await SessionManager.startSession(deviceId);
      
      this.sendResponse(socket, callback, {
        deviceId,
        success: result.success,
        message: result.message
      });

      if (result.success) {
        socket.emit('session:started', { deviceId, message: result.message });
      }
    } catch (error) {
      this.sendError(socket, callback, `Failed to start session: ${error.message}`);
    }
  }

  /**
   * Session stop handler
   */
  async handleSessionStop(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    try {
      const SessionManager = require('./SessionManager').getInstance();
      const result = await SessionManager.stopSession(deviceId, 'manual');
      
      this.sendResponse(socket, callback, {
        deviceId,
        success: result.success,
        message: result.message
      });

      if (result.success) {
        socket.emit('session:stopped', { deviceId, message: result.message });
      }
    } catch (error) {
      this.sendError(socket, callback, `Failed to stop session: ${error.message}`);
    }
  }

  /**
   * Session restart handler
   */
  async handleSessionRestart(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    try {
      const SessionManager = require('./SessionManager').getInstance();
      const result = await SessionManager.restartSession(deviceId);
      
      this.sendResponse(socket, callback, {
        deviceId,
        success: result.success,
        message: result.message
      });

      if (result.success) {
        socket.emit('session:restarted', { deviceId, message: result.message });
      }
    } catch (error) {
      this.sendError(socket, callback, `Failed to restart session: ${error.message}`);
    }
  }

  /**
   * QR request handler
   */
  async handleQRRequest(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    if (device.qr_code) {
      const response = {
        deviceId,
        qr: device.qr_code,
        timestamp: new Date()
      };
      
      this.sendResponse(socket, callback, response);
      socket.emit('qr:updated', response);
    } else {
      const response = { deviceId, available: false };
      this.sendResponse(socket, callback, response);
      socket.emit('qr:unavailable', { deviceId });
    }
  }

  /**
   * QR refresh handler
   */
  async handleQRRefresh(socket, data, callback) {
    const { deviceId } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    try {
      // Restart session to generate new QR
      const SessionManager = require('./SessionManager').getInstance();
      const result = await SessionManager.restartSession(deviceId);
      
      this.sendResponse(socket, callback, {
        deviceId,
        success: result.success,
        message: 'QR code refresh initiated'
      });
    } catch (error) {
      this.sendError(socket, callback, `Failed to refresh QR: ${error.message}`);
    }
  }

  /**
   * Message send handler
   */
  async handleMessageSend(socket, data, callback) {
    const { deviceId, to, message, type = 'text' } = data;
    
    if (!deviceId || !to || !message) {
      return this.sendError(socket, callback, 'Device ID, recipient, and message are required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    try {
      const QueueManager = require('./QueueManager').getInstance();
      
      // Add message to queue
      const job = await QueueManager.addMessageJob({
        deviceId,
        to,
        message,
        type,
        userId: socket.userId
      });

      this.sendResponse(socket, callback, {
        success: true,
        jobId: job.id,
        message: 'Message queued for sending'
      });
    } catch (error) {
      this.sendError(socket, callback, `Failed to queue message: ${error.message}`);
    }
  }

  /**
   * Message history handler
   */
  async handleMessageHistory(socket, data, callback) {
    const { deviceId, limit = 50, offset = 0 } = data;
    
    if (!deviceId) {
      return this.sendError(socket, callback, 'Device ID is required');
    }

    // Verify device ownership
    const device = await this.deviceRepository.findByIdAndUserId(deviceId, socket.userId);
    if (!device) {
      return this.sendError(socket, callback, 'Device not found or access denied');
    }

    try {
      const MessageRepository = require('../repositories/MessageRepository');
      const messageRepository = new MessageRepository();
      
      const messages = await messageRepository.findByDeviceId(deviceId, {
        limit,
        offset,
        orderBy: 'created_at',
        orderDirection: 'DESC'
      });

      this.sendResponse(socket, callback, {
        deviceId,
        messages,
        limit,
        offset
      });
    } catch (error) {
      this.sendError(socket, callback, `Failed to fetch message history: ${error.message}`);
    }
  }

  /**
   * Campaign subscription handler
   */
  async handleCampaignSubscribe(socket, data, callback) {
    const { campaignId } = data;
    
    if (!campaignId) {
      return this.sendError(socket, callback, 'Campaign ID is required');
    }

    try {
      // Verify campaign ownership
      const campaign = await this.campaignRepository.findByIdAndUserId(campaignId, socket.userId);
      if (!campaign) {
        return this.sendError(socket, callback, 'Campaign not found or access denied');
      }

      // Subscribe to campaign updates
      socket.join(`campaign:${campaignId}`);

      this.sendResponse(socket, callback, {
        campaignId,
        subscribed: true
      });

      socket.emit('campaign:subscribed', { campaignId });
    } catch (error) {
      this.sendError(socket, callback, `Failed to subscribe to campaign: ${error.message}`);
    }
  }

  /**
   * Campaign status handler
   */
  async handleCampaignStatus(socket, data, callback) {
    const { campaignId } = data;
    
    if (!campaignId) {
      return this.sendError(socket, callback, 'Campaign ID is required');
    }

    try {
      // Verify campaign ownership
      const campaign = await this.campaignRepository.findByIdAndUserId(campaignId, socket.userId);
      if (!campaign) {
        return this.sendError(socket, callback, 'Campaign not found or access denied');
      }

      // Get campaign statistics
      const stats = await this.campaignRepository.getStatistics(campaignId);

      this.sendResponse(socket, callback, {
        campaignId,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          created_at: campaign.created_at,
          started_at: campaign.started_at,
          completed_at: campaign.completed_at
        },
        stats
      });
    } catch (error) {
      this.sendError(socket, callback, `Failed to get campaign status: ${error.message}`);
    }
  }

  /**
   * System stats handler
   */
  async handleSystemStats(socket, data, callback) {
    try {
      const SessionManager = require('./SessionManager').getInstance();
      const QueueManager = require('./QueueManager').getInstance();
      
      const sessionStats = SessionManager.getAllSessions();
      const queueStats = await QueueManager.getAllQueueStats();
      const connectionStats = this.socketManager.getConnectedClientsCount();

      this.sendResponse(socket, callback, {
        sessions: {
          total: Object.keys(sessionStats).length,
          connected: Object.values(sessionStats).filter(s => s.connected).length
        },
        queues: queueStats,
        connections: connectionStats,
        timestamp: new Date()
      });
    } catch (error) {
      this.sendError(socket, callback, `Failed to get system stats: ${error.message}`);
    }
  }

  /**
   * Ping handler
   */
  async handlePing(socket, data, callback) {
    const response = {
      pong: true,
      timestamp: new Date(),
      userId: socket.userId,
      socketId: socket.id
    };
    
    this.sendResponse(socket, callback, response);
    socket.emit('pong', response);
  }

  /**
   * Send successful response
   */
  sendResponse(socket, callback, data) {
    if (callback && typeof callback === 'function') {
      callback({ success: true, data });
    }
  }

  /**
   * Send error response
   */
  sendError(socket, callback, message, code = 'ERROR') {
    const error = { success: false, error: { code, message } };
    
    if (callback && typeof callback === 'function') {
      callback(error);
    }
    
    socket.emit('error', error);
  }

  /**
   * Broadcast device event to all subscribers
   */
  broadcastDeviceEvent(deviceId, event, data) {
    this.socketManager.emitToDevice(deviceId, event, data);
  }

  /**
   * Broadcast campaign event to all subscribers
   */
  broadcastCampaignEvent(campaignId, event, data) {
    this.socketManager.getIO().to(`campaign:${campaignId}`).emit(event, {
      campaignId,
      ...data
    });
  }

  /**
   * Broadcast system notification
   */
  broadcastSystemNotification(message, level = 'info') {
    this.socketManager.broadcastSystemNotification(message, level);
  }

  /**
   * Send user notification
   */
  sendUserNotification(userId, type, data) {
    this.socketManager.emitToUser(userId, 'notification', {
      type,
      data,
      timestamp: new Date()
    });
  }
}

module.exports = SocketEvents;