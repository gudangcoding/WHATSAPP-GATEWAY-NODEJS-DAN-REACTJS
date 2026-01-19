const DeviceRepository = require('../repositories/DeviceRepository');
const SessionRepository = require('../repositories/SessionRepository');
const SessionManager = require('../core/SessionManager');
const logger = require('../utils/logger');

class DeviceController {
    constructor() {
        this.deviceRepository = new DeviceRepository();
        this.sessionRepository = new SessionRepository();
        this.sessionManager = SessionManager;
    }

    /**
     * Get all devices for authenticated user
     */
    async getDevices(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, search, status } = req.query;

            let devices;
            let total;

            if (search) {
                devices = await this.deviceRepository.searchDevices(search, userId, { page, limit });
                total = await this.deviceRepository.countSearchResults(search, userId);
            } else {
                const filters = { user_id: userId };
                if (status) filters.status = status;
                
                devices = await this.deviceRepository.findByFilters(filters, { page, limit });
                total = await this.deviceRepository.countByFilters(filters);
            }

            res.json({
                success: true,
                message: 'Devices retrieved successfully',
                data: devices,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('DeviceController: Error getting devices:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get devices',
                error: error.message,
                code: 'GET_DEVICES_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get device by ID
     */
    async getDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Device retrieved successfully',
                data: device
            });

        } catch (error) {
            logger.error('DeviceController: Error getting device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get device',
                error: error.message,
                code: 'GET_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Create new device
     */
    async createDevice(req, res) {
        try {
            const userId = req.user.id;
            const { name, phone_number, webhook_url, settings = {} } = req.body;

            // Check if phone number already exists
            const existingDevice = await this.deviceRepository.findByPhoneNumber(phone_number);
            if (existingDevice) {
                return res.status(409).json({
                    success: false,
                    message: 'Phone number already registered',
                    error: 'A device with this phone number already exists',
                    code: 'PHONE_EXISTS',
                    timestamp: new Date().toISOString()
                });
            }

            const deviceData = {
                user_id: userId,
                name,
                phone_number,
                webhook_url: webhook_url || null,
                status: 'disconnected',
                settings: JSON.stringify(settings),
                auto_reconnect: true,
                reconnect_interval: 30,
                max_reconnect_attempts: 5,
                created_at: new Date(),
                updated_at: new Date()
            };

            const device = await this.deviceRepository.create(deviceData);

            logger.info(`DeviceController: Device created successfully - ID: ${device.id}, User: ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Device created successfully',
                data: device
            });

        } catch (error) {
            logger.error('DeviceController: Error creating device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create device',
                error: error.message,
                code: 'CREATE_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Update device
     */
    async updateDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;
            const { name, webhook_url, settings } = req.body;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            const updateData = {
                updated_at: new Date()
            };

            if (name) updateData.name = name;
            if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
            if (settings) updateData.settings = JSON.stringify(settings);

            const updatedDevice = await this.deviceRepository.update(deviceId, updateData);

            logger.info(`DeviceController: Device updated successfully - ID: ${deviceId}`);

            res.json({
                success: true,
                message: 'Device updated successfully',
                data: updatedDevice
            });

        } catch (error) {
            logger.error('DeviceController: Error updating device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update device',
                error: error.message,
                code: 'UPDATE_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete device
     */
    async deleteDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Disconnect device if connected
            if (device.status === 'connected') {
                await this.sessionManager.disconnectDevice(deviceId);
            }

            // Soft delete device
            await this.deviceRepository.softDelete(deviceId);

            logger.info(`DeviceController: Device deleted successfully - ID: ${deviceId}`);

            res.json({
                success: true,
                message: 'Device deleted successfully'
            });

        } catch (error) {
            logger.error('DeviceController: Error deleting device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete device',
                error: error.message,
                code: 'DELETE_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Connect device (start WhatsApp session)
     */
    async connectDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            if (device.status === 'connected') {
                return res.status(400).json({
                    success: false,
                    message: 'Device already connected',
                    error: 'Device is already in connected state',
                    code: 'DEVICE_ALREADY_CONNECTED',
                    timestamp: new Date().toISOString()
                });
            }

            // Start connection process
            await this.sessionManager.connectDevice(deviceId);

            logger.info(`DeviceController: Device connection initiated - ID: ${deviceId}`);

            res.json({
                success: true,
                message: 'Device connection initiated',
                data: {
                    device_id: deviceId,
                    status: 'connecting'
                }
            });

        } catch (error) {
            logger.error('DeviceController: Error connecting device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to connect device',
                error: error.message,
                code: 'CONNECT_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Disconnect device
     */
    async disconnectDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            if (device.status === 'disconnected') {
                return res.status(400).json({
                    success: false,
                    message: 'Device already disconnected',
                    error: 'Device is already in disconnected state',
                    code: 'DEVICE_ALREADY_DISCONNECTED',
                    timestamp: new Date().toISOString()
                });
            }

            // Disconnect device
            await this.sessionManager.disconnectDevice(deviceId);

            logger.info(`DeviceController: Device disconnected successfully - ID: ${deviceId}`);

            res.json({
                success: true,
                message: 'Device disconnected successfully',
                data: {
                    device_id: deviceId,
                    status: 'disconnected'
                }
            });

        } catch (error) {
            logger.error('DeviceController: Error disconnecting device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to disconnect device',
                error: error.message,
                code: 'DISCONNECT_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get device QR code
     */
    async getQRCode(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            if (!device.qr_code) {
                return res.status(404).json({
                    success: false,
                    message: 'QR code not available',
                    error: 'QR code has not been generated yet or device is already connected',
                    code: 'QR_CODE_NOT_AVAILABLE',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'QR code retrieved successfully',
                data: {
                    device_id: deviceId,
                    qr_code: device.qr_code,
                    status: device.status
                }
            });

        } catch (error) {
            logger.error('DeviceController: Error getting QR code:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get QR code',
                error: error.message,
                code: 'GET_QR_CODE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get device status
     */
    async getDeviceStatus(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Get real-time status from session manager
            const sessionStatus = await this.sessionManager.getDeviceStatus(deviceId);

            res.json({
                success: true,
                message: 'Device status retrieved successfully',
                data: {
                    device_id: deviceId,
                    status: device.status,
                    session_status: sessionStatus,
                    last_seen_at: device.last_seen_at,
                    connected_at: device.connected_at,
                    disconnected_at: device.disconnected_at
                }
            });

        } catch (error) {
            logger.error('DeviceController: Error getting device status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get device status',
                error: error.message,
                code: 'GET_DEVICE_STATUS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Restart device connection
     */
    async restartDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            const device = await this.deviceRepository.findById(deviceId);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Restart device (disconnect then connect)
            await this.sessionManager.restartDevice(deviceId);

            logger.info(`DeviceController: Device restart initiated - ID: ${deviceId}`);

            res.json({
                success: true,
                message: 'Device restart initiated',
                data: {
                    device_id: deviceId,
                    status: 'restarting'
                }
            });

        } catch (error) {
            logger.error('DeviceController: Error restarting device:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restart device',
                error: error.message,
                code: 'RESTART_DEVICE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get device statistics
     */
    async getDeviceStats(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d' } = req.query;

            const stats = await this.deviceRepository.getDeviceStats(userId, period);

            res.json({
                success: true,
                message: 'Device statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            logger.error('DeviceController: Error getting device stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get device statistics',
                error: error.message,
                code: 'GET_DEVICE_STATS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new DeviceController();