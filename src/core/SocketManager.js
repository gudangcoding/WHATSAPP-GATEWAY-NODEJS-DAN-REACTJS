const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const UserRepository = require('../repositories/UserRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const SocketEvents = require('./SocketEvents');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // userId -> Set of socket ids
    this.deviceSubscriptions = new Map(); // deviceId -> Set of socket ids
    this.userRepository = new UserRepository();
    this.deviceRepository = new DeviceRepository();
    this.socketEvents = null;
  }

  /**
   * Initialize Socket.IO server
   */
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    // Initialize socket events handler
    this.socketEvents = new SocketEvents(this);

    logger.info('SocketManager: Initialized successfully');
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await this.userRepository.findById(decoded.userId);
        
        if (!user || !user.is_active) {
          return next(new Error('Invalid or inactive user'));
        }

        socket.userId = user.id;
        socket.user = user;
        
        next();
        
      } catch (error) {
        logger.error('SocketManager: Authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    
    logger.info(`SocketManager: User ${userId} connected with socket ${socket.id}`);

    // Track connected client
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }
    this.connectedClients.get(userId).add(socket.id);

    // Join user room
    socket.join(`user:${userId}`);

    // Setup event handlers
    this.setupSocketEvents(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Send initial data
    this.sendInitialData(socket);
  }

  /**
   * Setup individual socket event handlers
   */
  setupSocketEvents(socket) {
    // Use SocketEvents class for handling events
    this.socketEvents.setupSocketEvents(socket);
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    logger.info(`SocketManager: User ${userId} disconnected socket ${socket.id}`);

    // Remove from connected clients
    if (this.connectedClients.has(userId)) {
      this.connectedClients.get(userId).delete(socket.id);
      
      if (this.connectedClients.get(userId).size === 0) {
        this.connectedClients.delete(userId);
      }
    }

    // Remove from device subscriptions
    for (const [deviceId, socketIds] of this.deviceSubscriptions) {
      socketIds.delete(socket.id);
      
      if (socketIds.size === 0) {
        this.deviceSubscriptions.delete(deviceId);
      }
    }
  }

  /**
   * Send initial data to newly connected socket
   */
  async sendInitialData(socket) {
    try {
      const userId = socket.userId;
      
      // Get user's devices
      const devices = await this.deviceRepository.findByUserId(userId);
      
      // Get session statuses
      const SessionManager = require('./SessionManager').getInstance();
      const deviceStatuses = {};
      
      for (const device of devices) {
        deviceStatuses[device.id] = {
          device: {
            id: device.id,
            name: device.name,
            phone_number: device.phone_number,
            status: device.status,
            last_seen: device.last_seen
          },
          session: SessionManager.getSessionStatus(device.id)
        };
      }

      socket.emit('initial:data', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email
        },
        devices: deviceStatuses,
        timestamp: new Date()
      });
      
    } catch (error) {
      logger.error('SocketManager: Error sending initial data:', error);
    }
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
      logger.debug(`SocketManager: Emitted ${event} to user ${userId}`);
    }
  }

  /**
   * Emit event to specific device subscribers
   */
  emitToDevice(deviceId, event, data) {
    if (this.io) {
      this.io.to(`device:${deviceId}`).emit(event, { deviceId, ...data });
      logger.debug(`SocketManager: Emitted ${event} to device ${deviceId}`);
    }
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      logger.debug(`SocketManager: Emitted ${event} to all clients`);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    let totalSockets = 0;
    for (const socketIds of this.connectedClients.values()) {
      totalSockets += socketIds.size;
    }
    return {
      users: this.connectedClients.size,
      sockets: totalSockets
    };
  }

  /**
   * Get device subscribers count
   */
  getDeviceSubscribersCount(deviceId) {
    return this.deviceSubscriptions.get(deviceId)?.size || 0;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedClients.has(userId) && this.connectedClients.get(userId).size > 0;
  }

  /**
   * Get all connected users
   */
  getConnectedUsers() {
    return Array.from(this.connectedClients.keys());
  }

  /**
   * Broadcast system notification
   */
  broadcastSystemNotification(message, level = 'info') {
    this.emitToAll('system:notification', {
      message,
      level,
      timestamp: new Date()
    });
  }

  /**
   * Send device notification to user
   */
  sendDeviceNotification(userId, deviceId, type, data) {
    this.emitToUser(userId, 'device:notification', {
      deviceId,
      type,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Send message notification
   */
  sendMessageNotification(userId, deviceId, messageData) {
    this.emitToUser(userId, 'message:notification', {
      deviceId,
      message: messageData,
      timestamp: new Date()
    });
  }

  /**
   * Send campaign update
   */
  sendCampaignUpdate(userId, campaignId, status, stats) {
    this.emitToUser(userId, 'campaign:update', {
      campaignId,
      status,
      stats,
      timestamp: new Date()
    });
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    return this.io;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new SocketManager();
    }
    return instance;
  },
  SocketManager
};