import apiClient from './apiClient';

/**
 * Device API Service
 */
export const deviceAPI = {
  /**
   * Get all devices for current user
   */
  async getDevices(params = {}) {
    return apiClient.get('/devices', { params });
  },

  /**
   * Get device by ID
   */
  async getDevice(deviceId) {
    return apiClient.get(`/devices/${deviceId}`);
  },

  /**
   * Create new device
   */
  async createDevice(deviceData) {
    return apiClient.post('/devices', deviceData);
  },

  /**
   * Update device
   */
  async updateDevice(deviceId, deviceData) {
    return apiClient.put(`/devices/${deviceId}`, deviceData);
  },

  /**
   * Delete device
   */
  async deleteDevice(deviceId) {
    return apiClient.delete(`/devices/${deviceId}`);
  },

  /**
   * Start device (connect to WhatsApp)
   */
  async startDevice(deviceId) {
    return apiClient.post(`/devices/${deviceId}/start`);
  },

  /**
   * Stop device (disconnect from WhatsApp)
   */
  async stopDevice(deviceId) {
    return apiClient.post(`/devices/${deviceId}/stop`);
  },

  /**
   * Restart device
   */
  async restartDevice(deviceId) {
    return apiClient.post(`/devices/${deviceId}/restart`);
  },

  /**
   * Get device QR code for pairing
   */
  async getQRCode(deviceId) {
    return apiClient.get(`/devices/${deviceId}/qr`);
  },

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId) {
    return apiClient.get(`/devices/${deviceId}/status`);
  },

  /**
   * Get device logs
   */
  async getDeviceLogs(deviceId, params = {}) {
    return apiClient.get(`/devices/${deviceId}/logs`, { params });
  },

  /**
   * Get device statistics
   */
  async getDeviceStats(deviceId, params = {}) {
    return apiClient.get(`/devices/${deviceId}/stats`, { params });
  },

  /**
   * Test device connection
   */
  async testDevice(deviceId) {
    return apiClient.post(`/devices/${deviceId}/test`);
  },

  /**
   * Get device sessions
   */
  async getDeviceSessions(deviceId, params = {}) {
    return apiClient.get(`/devices/${deviceId}/sessions`, { params });
  },

  /**
   * Clear device session
   */
  async clearDeviceSession(deviceId) {
    return apiClient.delete(`/devices/${deviceId}/session`);
  }
};

export default deviceAPI;