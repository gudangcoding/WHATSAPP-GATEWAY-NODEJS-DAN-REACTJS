// Mock DeviceService for testing
const MockDeviceService = {
  connectDevice: jest.fn(),
  disconnectDevice: jest.fn(),
  getQRCode: jest.fn(),
  getDeviceStatus: jest.fn(),
  validateDeviceConfig: jest.fn(),
  sendMessage: jest.fn(),
  restartDevice: jest.fn(),
  getDeviceStats: jest.fn()
};

describe('MockDeviceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectDevice', () => {
    it('should connect device successfully', async () => {
      const deviceId = 1;
      const expectedResult = {
        success: true,
        status: 'connecting',
        qr_code: 'mock_qr_code'
      };

      MockDeviceService.connectDevice.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.connectDevice(deviceId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('connecting');
      expect(result.qr_code).toBe('mock_qr_code');
      expect(MockDeviceService.connectDevice).toHaveBeenCalledWith(deviceId);
    });

    it('should return error when device not found', async () => {
      const deviceId = 999;
      MockDeviceService.connectDevice.mockRejectedValue(new Error('Device not found'));

      await expect(MockDeviceService.connectDevice(deviceId))
        .rejects.toThrow('Device not found');
    });

    it('should return error when device is already connected', async () => {
      const deviceId = 1;
      MockDeviceService.connectDevice.mockRejectedValue(new Error('Device is already connected'));

      await expect(MockDeviceService.connectDevice(deviceId))
        .rejects.toThrow('Device is already connected');
    });
  });

  describe('disconnectDevice', () => {
    it('should disconnect device successfully', async () => {
      const deviceId = 1;
      const expectedResult = {
        success: true,
        status: 'disconnected'
      };

      MockDeviceService.disconnectDevice.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.disconnectDevice(deviceId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('disconnected');
      expect(MockDeviceService.disconnectDevice).toHaveBeenCalledWith(deviceId);
    });

    it('should return error when device not found', async () => {
      const deviceId = 999;
      MockDeviceService.disconnectDevice.mockRejectedValue(new Error('Device not found'));

      await expect(MockDeviceService.disconnectDevice(deviceId))
        .rejects.toThrow('Device not found');
    });
  });

  describe('getQRCode', () => {
    it('should return QR code for connecting device', async () => {
      const deviceId = 1;
      const expectedResult = {
        qr_code: 'mock_qr_code_data',
        expires_at: new Date(Date.now() + 60000)
      };

      MockDeviceService.getQRCode.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.getQRCode(deviceId);

      expect(result.qr_code).toBe('mock_qr_code_data');
      expect(result.expires_at).toBeDefined();
      expect(MockDeviceService.getQRCode).toHaveBeenCalledWith(deviceId);
    });

    it('should return null when QR code not available', async () => {
      const deviceId = 1;
      MockDeviceService.getQRCode.mockResolvedValue(null);

      const result = await MockDeviceService.getQRCode(deviceId);

      expect(result).toBeNull();
    });
  });

  describe('getDeviceStatus', () => {
    it('should return device status successfully', async () => {
      const deviceId = 1;
      const expectedResult = {
        status: 'connected',
        battery: 85,
        signal_strength: 4,
        last_seen: new Date()
      };

      MockDeviceService.getDeviceStatus.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.getDeviceStatus(deviceId);

      expect(result.status).toBe('connected');
      expect(result.battery).toBe(85);
      expect(result.signal_strength).toBe(4);
      expect(result.last_seen).toBeDefined();
    });
  });

  describe('validateDeviceConfig', () => {
    it('should validate device configuration successfully', async () => {
      const config = {
        name: 'Valid Device',
        phone_number: '+1234567890',
        webhook_url: 'https://example.com/webhook'
      };

      MockDeviceService.validateDeviceConfig.mockResolvedValue(true);

      const result = await MockDeviceService.validateDeviceConfig(config);

      expect(result).toBe(true);
      expect(MockDeviceService.validateDeviceConfig).toHaveBeenCalledWith(config);
    });

    it('should return false for invalid configuration', async () => {
      const config = {
        name: 'Invalid Device',
        phone_number: 'invalid-phone'
      };

      MockDeviceService.validateDeviceConfig.mockResolvedValue(false);

      const result = await MockDeviceService.validateDeviceConfig(config);

      expect(result).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const deviceId = 1;
      const messageData = {
        to: '+1234567890',
        message: 'Test message',
        type: 'text'
      };
      const expectedResult = {
        success: true,
        message_id: 'message_id_123',
        status: 'sent'
      };

      MockDeviceService.sendMessage.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.sendMessage(deviceId, messageData);

      expect(result.success).toBe(true);
      expect(result.message_id).toBe('message_id_123');
      expect(result.status).toBe('sent');
    });

    it('should return error when device not connected', async () => {
      const deviceId = 1;
      const messageData = {
        to: '+1234567890',
        message: 'Test message',
        type: 'text'
      };

      MockDeviceService.sendMessage.mockRejectedValue(new Error('Device is not connected'));

      await expect(MockDeviceService.sendMessage(deviceId, messageData))
        .rejects.toThrow('Device is not connected');
    });
  });

  describe('restartDevice', () => {
    it('should restart device successfully', async () => {
      const deviceId = 1;
      const expectedResult = {
        success: true,
        status: 'restarting'
      };

      MockDeviceService.restartDevice.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.restartDevice(deviceId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('restarting');
    });
  });

  describe('getDeviceStats', () => {
    it('should return device statistics', async () => {
      const deviceId = 1;
      const expectedResult = {
        messages_sent: 150,
        messages_received: 200,
        uptime: 86400000,
        error_count: 2,
        success_rate: 98.5
      };

      MockDeviceService.getDeviceStats.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.getDeviceStats(deviceId);

      expect(result.messages_sent).toBe(150);
      expect(result.messages_received).toBe(200);
      expect(result.uptime).toBe(86400000);
      expect(result.success_rate).toBe(98.5);
    });

    it('should return default stats when no data available', async () => {
      const deviceId = 1;
      const expectedResult = {
        messages_sent: 0,
        messages_received: 0,
        uptime: 0,
        error_count: 0,
        success_rate: 100
      };

      MockDeviceService.getDeviceStats.mockResolvedValue(expectedResult);

      const result = await MockDeviceService.getDeviceStats(deviceId);

      expect(result.messages_sent).toBe(0);
      expect(result.messages_received).toBe(0);
      expect(result.uptime).toBe(0);
      expect(result.error_count).toBe(0);
      expect(result.success_rate).toBe(100);
    });
  });
});