import { io } from 'socket.io-client';
import { APP_CONFIG } from '../config/app.config';
import { getStoredToken } from '../utils/storage/localStorage';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
    this.connectionPromise = null;
  }

  /**
   * Initialize socket connection
   */
  async connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const token = getStoredToken();
      
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      // Create socket instance
      this.socket = io(APP_CONFIG.socket.url, {
        ...APP_CONFIG.socket.options,
        auth: {
          token: token
        },
        query: {
          client: 'web'
        }
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('🔌 Socket connected:', this.socket.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Re-register all event listeners
        this.reregisterEventListeners();
        
        resolve(this.socket);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server disconnected, manual reconnection needed
          this.socket.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (error.message === 'Authentication error') {
          toast.error('Authentication failed. Please login again.');
          window.dispatchEvent(new CustomEvent('auth:error'));
          reject(error);
          return;
        }
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          toast.error('Connection failed. Please check your internet connection.');
          reject(error);
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
        toast.success('Connection restored');
      });

      this.socket.on('reconnect_failed', () => {
        console.error('🔌 Socket reconnection failed');
        toast.error('Failed to reconnect. Please refresh the page.');
      });

      // Global error handler
      this.socket.on('error', (error) => {
        console.error('🔌 Socket error:', error);
        toast.error(error.message || 'Socket error occurred');
      });

      // Authentication events
      this.socket.on('auth:success', (data) => {
        console.log('🔐 Socket authentication successful:', data);
      });

      this.socket.on('auth:error', (error) => {
        console.error('🔐 Socket authentication error:', error);
        toast.error('Authentication failed');
        window.dispatchEvent(new CustomEvent('auth:error'));
      });
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
      this.eventListeners.clear();
      console.log('🔌 Socket disconnected manually');
    }
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Emit event to server
   */
  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('🔌 Socket not connected, cannot emit:', event);
      return false;
    }

    this.socket.emit(event, data, callback);
    return true;
  }

  /**
   * Listen to socket events
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Listen to event once
   */
  once(event, callback) {
    if (!this.socket?.connected) {
      console.warn('🔌 Socket not connected, cannot listen once:', event);
      return;
    }

    this.socket.once(event, callback);
  }

  /**
   * Re-register all event listeners after reconnection
   */
  reregisterEventListeners() {
    if (!this.socket) return;

    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }

  /**
   * Join a room
   */
  joinRoom(room) {
    return this.emit('join:room', { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room) {
    return this.emit('leave:room', { room });
  }

  /**
   * Device-specific methods
   */
  subscribeToDevice(deviceId) {
    return this.emit('device:subscribe', { deviceId });
  }

  unsubscribeFromDevice(deviceId) {
    return this.emit('device:unsubscribe', { deviceId });
  }

  /**
   * Campaign-specific methods
   */
  subscribeToCampaign(campaignId) {
    return this.emit('campaign:subscribe', { campaignId });
  }

  unsubscribeFromCampaign(campaignId) {
    return this.emit('campaign:unsubscribe', { campaignId });
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

// Socket event constants
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Device events
  DEVICE_STATUS: 'device:status',
  DEVICE_QR: 'device:qr',
  DEVICE_READY: 'device:ready',
  DEVICE_DISCONNECTED: 'device:disconnected',
  DEVICE_MESSAGE: 'device:message',
  
  // Message events
  MESSAGE_SENT: 'message:sent',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_FAILED: 'message:failed',
  MESSAGE_RECEIVED: 'message:received',
  
  // Campaign events
  CAMPAIGN_STARTED: 'campaign:started',
  CAMPAIGN_PROGRESS: 'campaign:progress',
  CAMPAIGN_COMPLETED: 'campaign:completed',
  CAMPAIGN_PAUSED: 'campaign:paused',
  CAMPAIGN_STOPPED: 'campaign:stopped',
  CAMPAIGN_ERROR: 'campaign:error',
  
  // Auto reply events
  AUTO_REPLY_TRIGGERED: 'auto_reply:triggered',
  
  // System events
  SYSTEM_NOTIFICATION: 'system:notification',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  
  // User events
  USER_QUOTA_WARNING: 'user:quota_warning',
  USER_QUOTA_EXCEEDED: 'user:quota_exceeded'
};

export default socketService;