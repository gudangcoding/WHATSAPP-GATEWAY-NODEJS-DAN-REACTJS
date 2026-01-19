const request = require('supertest');
const express = require('express');
const DeviceController = require('../../../src/controllers/DeviceController');
const DeviceRepository = require('../../../src/repositories/DeviceRepository');
const DeviceService = require('../../../src/services/DeviceService');

// Mock dependencies
jest.mock('../../../src/repositories/DeviceRepository');

// Create a simple mock for DeviceService
const mockDeviceService = {
  connectDevice: jest.fn(),
  disconnectDevice: jest.fn(),
  getQRCode: jest.fn(),
  getDeviceStatus: jest.fn(),
  validateDeviceConfig: jest.fn()
};

// Mock the DeviceService module
jest.mock('../../../src/services/DeviceService', () => {
  return jest.fn().mockImplementation(() => mockDeviceService);
});

describe('DeviceController', () => {
  let app;
  let mockDeviceRepository;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req, res, next) => {
      req.user = { id: 1, role: 'user' };
      next();
    });

    // Setup routes
    app.get('/devices', DeviceController.getDevices);
    app.get('/devices/:id', DeviceController.getDevice);
    app.post('/devices', DeviceController.createDevice);
    app.put('/devices/:id', DeviceController.updateDevice);
    app.delete('/devices/:id', DeviceController.deleteDevice);
    app.post('/devices/:id/connect', DeviceController.connectDevice);
    app.post('/devices/:id/disconnect', DeviceController.disconnectDevice);
    app.get('/devices/:id/qr', DeviceController.getQRCode);
    app.get('/devices/:id/status', DeviceController.getDeviceStatus);

    // Reset mocks
    mockDeviceRepository = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserIdAndId: jest.fn(),
      updateStatus: jest.fn()
    };
    DeviceRepository.mockImplementation(() => mockDeviceRepository);

    // Reset DeviceService mocks
    Object.keys(mockDeviceService).forEach(key => {
      mockDeviceService[key].mockReset();
    });
  });

  describe('GET /devices', () => {
    it('should return user devices successfully', async () => {
      const mockDevices = [
        {
          id: 1,
          user_id: 1,
          name: 'Device 1',
          phone_number: '+1234567890',
          status: 'connected',
          created_at: new Date()
        },
        {
          id: 2,
          user_id: 1,
          name: 'Device 2',
          phone_number: '+0987654321',
          status: 'disconnected',
          created_at: new Date()
        }
      ];

      mockDeviceRepository.findByUserId.mockResolvedValue(mockDevices);

      const response = await request(app)
        .get('/devices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Devices retrieved successfully');
      expect(response.body.data.devices).toHaveLength(2);
      expect(response.body.data.devices[0].name).toBe('Device 1');
      expect(mockDeviceRepository.findByUserId).toHaveBeenCalledWith(1, {});
    });

    it('should return empty array when no devices found', async () => {
      mockDeviceRepository.findByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/devices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.devices).toHaveLength(0);
    });

    it('should handle search and filter parameters', async () => {
      mockDeviceRepository.findByUserId.mockResolvedValue([]);

      await request(app)
        .get('/devices?search=test&status=connected&page=1&limit=10')
        .expect(200);

      expect(mockDeviceRepository.findByUserId).toHaveBeenCalledWith(1, {
        search: 'test',
        status: 'connected',
        page: 1,
        limit: 10
      });
    });
  });

  describe('GET /devices/:id', () => {
    it('should return device details successfully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        phone_number: '+1234567890',
        status: 'connected',
        webhook_url: 'https://example.com/webhook',
        created_at: new Date()
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);

      const response = await request(app)
        .get('/devices/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device retrieved successfully');
      expect(response.body.data.device.name).toBe('Test Device');
      expect(mockDeviceRepository.findByUserIdAndId).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 when device not found', async () => {
      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(null);

      const response = await request(app)
        .get('/devices/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 400 for invalid device ID', async () => {
      const response = await request(app)
        .get('/devices/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('POST /devices', () => {
    it('should create device successfully', async () => {
      const deviceData = {
        name: 'New Device',
        phone_number: '+1234567890',
        webhook_url: 'https://example.com/webhook'
      };

      const createdDevice = {
        id: 1,
        user_id: 1,
        ...deviceData,
        status: 'disconnected',
        created_at: new Date()
      };

      mockDeviceService.validateDeviceConfig.mockResolvedValue(true);
      mockDeviceRepository.create.mockResolvedValue(createdDevice);

      const response = await request(app)
        .post('/devices')
        .send(deviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device created successfully');
      expect(response.body.data.device.name).toBe(deviceData.name);
      expect(mockDeviceRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        ...deviceData,
        status: 'disconnected'
      });
    });

    it('should return validation error for missing required fields', async () => {
      const deviceData = {
        name: 'New Device'
        // Missing phone_number
      };

      const response = await request(app)
        .post('/devices')
        .send(deviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return validation error for invalid phone number', async () => {
      const deviceData = {
        name: 'New Device',
        phone_number: 'invalid-phone',
        webhook_url: 'https://example.com/webhook'
      };

      const response = await request(app)
        .post('/devices')
        .send(deviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return validation error for invalid webhook URL', async () => {
      const deviceData = {
        name: 'New Device',
        phone_number: '+1234567890',
        webhook_url: 'invalid-url'
      };

      const response = await request(app)
        .post('/devices')
        .send(deviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('PUT /devices/:id', () => {
    it('should update device successfully', async () => {
      const updateData = {
        name: 'Updated Device',
        webhook_url: 'https://updated.example.com/webhook'
      };

      const existingDevice = {
        id: 1,
        user_id: 1,
        name: 'Old Device',
        phone_number: '+1234567890',
        status: 'connected'
      };

      const updatedDevice = {
        ...existingDevice,
        ...updateData
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(existingDevice);
      mockDeviceService.validateDeviceConfig.mockResolvedValue(true);
      mockDeviceRepository.update.mockResolvedValue(updatedDevice);

      const response = await request(app)
        .put('/devices/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device updated successfully');
      expect(response.body.data.device.name).toBe(updateData.name);
      expect(mockDeviceRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 when device not found', async () => {
      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(null);

      const response = await request(app)
        .put('/devices/999')
        .send({ name: 'Updated Device' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('DELETE /devices/:id', () => {
    it('should delete device successfully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'disconnected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.disconnectDevice.mockResolvedValue();
      mockDeviceRepository.delete.mockResolvedValue();

      const response = await request(app)
        .delete('/devices/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device deleted successfully');
      expect(mockDeviceRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return 404 when device not found', async () => {
      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(null);

      const response = await request(app)
        .delete('/devices/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device not found');
    });

    it('should disconnect device before deletion if connected', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'connected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.disconnectDevice.mockResolvedValue();
      mockDeviceRepository.delete.mockResolvedValue();

      await request(app)
        .delete('/devices/1')
        .expect(200);

      expect(mockDeviceService.disconnectDevice).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /devices/:id/connect', () => {
    it('should connect device successfully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'disconnected'
      };

      const connectionResult = {
        success: true,
        qr_code: 'qr_code_data',
        status: 'connecting'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.connectDevice.mockResolvedValue(connectionResult);

      const response = await request(app)
        .post('/devices/1/connect')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device connection initiated');
      expect(response.body.data.qr_code).toBe('qr_code_data');
      expect(mockDeviceService.connectDevice).toHaveBeenCalledWith(1);
    });

    it('should return 404 when device not found', async () => {
      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(null);

      const response = await request(app)
        .post('/devices/999/connect')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return error when device is already connected', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'connected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);

      const response = await request(app)
        .post('/devices/1/connect')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device is already connected');
    });
  });

  describe('POST /devices/:id/disconnect', () => {
    it('should disconnect device successfully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'connected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.disconnectDevice.mockResolvedValue();

      const response = await request(app)
        .post('/devices/1/disconnect')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device disconnected successfully');
      expect(mockDeviceService.disconnectDevice).toHaveBeenCalledWith(1);
    });

    it('should return error when device is already disconnected', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'disconnected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);

      const response = await request(app)
        .post('/devices/1/disconnect')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device is already disconnected');
    });
  });

  describe('GET /devices/:id/qr', () => {
    it('should return QR code successfully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'connecting'
      };

      const qrData = {
        qr_code: 'qr_code_data',
        expires_at: new Date(Date.now() + 60000)
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.getQRCode.mockResolvedValue(qrData);

      const response = await request(app)
        .get('/devices/1/qr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('QR code retrieved successfully');
      expect(response.body.data.qr_code).toBe('qr_code_data');
    });

    it('should return error when QR code not available', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'connected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.getQRCode.mockResolvedValue(null);

      const response = await request(app)
        .get('/devices/1/qr')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('QR code not available');
    });
  });

  describe('GET /devices/:id/status', () => {
    it('should return device status successfully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'connected'
      };

      const statusData = {
        status: 'connected',
        last_seen: new Date(),
        battery: 85,
        signal_strength: 4
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.getDeviceStatus.mockResolvedValue(statusData);

      const response = await request(app)
        .get('/devices/1/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device status retrieved successfully');
      expect(response.body.data.status).toBe('connected');
      expect(response.body.data.battery).toBe(85);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDeviceRepository.findByUserId.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/devices')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle device service errors gracefully', async () => {
      const mockDevice = {
        id: 1,
        user_id: 1,
        name: 'Test Device',
        status: 'disconnected'
      };

      mockDeviceRepository.findByUserIdAndId.mockResolvedValue(mockDevice);
      mockDeviceService.connectDevice.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .post('/devices/1/connect')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });
});