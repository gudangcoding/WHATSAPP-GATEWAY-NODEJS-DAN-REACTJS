const DeviceRepository = require('../repositories/DeviceRepository');
const SessionManager = require('../core/SessionManager');
const logger = require('../utils/logger');

class DeviceService {
    constructor() {
        this.deviceRepository = new DeviceRepository();
        this.sessionManager = SessionManager;
    }

    /**
     * Initialize device connection
     */
    async initializeDevice(deviceId) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            // Update device status to connecting
            await this.deviceRepository.updateStatus(deviceId, 'connecting');

            // Initialize WhatsApp session
            const result = await this.sessionManager.initializeSession(deviceId, device.phone_number);

            logger.info(`DeviceService: Device initialization started - ID: ${deviceId}`);
            return result;

        } catch (error) {
            logger.error(`DeviceService: Error initializing device ${deviceId}:`, error);
            
            // Update device status to error
            await this.deviceRepository.updateStatus(deviceId, 'error', {
                error_message: error.message,
                error_timestamp: new Date()
            });

            throw error;
        }
    }

    /**
     * Connect device to WhatsApp
     */
    async connectDevice(deviceId) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            if (device.status === 'connected') {
                return { success: true, message: 'Device already connected' };
            }

            // Start connection process
            await this.sessionManager.connectDevice(deviceId);

            logger.info(`DeviceService: Device connection initiated - ID: ${deviceId}`);
            return { success: true, message: 'Connection initiated' };

        } catch (error) {
            logger.error(`DeviceService: Error connecting device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Disconnect device from WhatsApp
     */
    async disconnectDevice(deviceId) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            if (device.status === 'disconnected') {
                return { success: true, message: 'Device already disconnected' };
            }

            // Disconnect from WhatsApp
            await this.sessionManager.disconnectDevice(deviceId);

            // Update device status
            await this.deviceRepository.updateStatus(deviceId, 'disconnected');

            logger.info(`DeviceService: Device disconnected successfully - ID: ${deviceId}`);
            return { success: true, message: 'Device disconnected' };

        } catch (error) {
            logger.error(`DeviceService: Error disconnecting device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Restart device connection
     */
    async restartDevice(deviceId) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            // Disconnect first
            await this.disconnectDevice(deviceId);

            // Wait a moment before reconnecting
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Reconnect
            await this.connectDevice(deviceId);

            logger.info(`DeviceService: Device restart completed - ID: ${deviceId}`);
            return { success: true, message: 'Device restarted' };

        } catch (error) {
            logger.error(`DeviceService: Error restarting device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Get device status with real-time information
     */
    async getDeviceStatus(deviceId) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            // Get real-time status from session manager
            const sessionStatus = await this.sessionManager.getDeviceStatus(deviceId);

            return {
                device_id: deviceId,
                database_status: device.status,
                session_status: sessionStatus,
                last_seen_at: device.last_seen_at,
                connected_at: device.connected_at,
                disconnected_at: device.disconnected_at,
                qr_code: device.qr_code,
                phone_number: device.phone_number
            };

        } catch (error) {
            logger.error(`DeviceService: Error getting device status ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Update device configuration
     */
    async updateDeviceConfig(deviceId, config) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            const currentSettings = device.settings ? JSON.parse(device.settings) : {};
            const updatedSettings = { ...currentSettings, ...config };

            await this.deviceRepository.update(deviceId, {
                settings: JSON.stringify(updatedSettings),
                updated_at: new Date()
            });

            // Apply configuration to active session if connected
            if (device.status === 'connected') {
                await this.sessionManager.updateDeviceConfig(deviceId, updatedSettings);
            }

            logger.info(`DeviceService: Device configuration updated - ID: ${deviceId}`);
            return { success: true, message: 'Configuration updated' };

        } catch (error) {
            logger.error(`DeviceService: Error updating device config ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Handle device QR code update
     */
    async handleQRCodeUpdate(deviceId, qrCode) {
        try {
            await this.deviceRepository.updateStatus(deviceId, 'connecting', {
                qr_code: qrCode,
                qr_generated_at: new Date()
            });

            logger.info(`DeviceService: QR code updated for device - ID: ${deviceId}`);
            return { success: true, qr_code: qrCode };

        } catch (error) {
            logger.error(`DeviceService: Error updating QR code for device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Handle device connection success
     */
    async handleConnectionSuccess(deviceId, connectionInfo) {
        try {
            await this.deviceRepository.updateStatus(deviceId, 'connected', {
                session_data: connectionInfo,
                qr_code: null, // Clear QR code after successful connection
                connected_at: new Date()
            });

            // Reset reconnection attempts
            await this.deviceRepository.resetReconnectionAttempts(deviceId);

            logger.info(`DeviceService: Device connected successfully - ID: ${deviceId}`);
            return { success: true, message: 'Device connected' };

        } catch (error) {
            logger.error(`DeviceService: Error handling connection success for device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Handle device connection failure
     */
    async handleConnectionFailure(deviceId, error) {
        try {
            await this.deviceRepository.updateStatus(deviceId, 'error', {
                error_message: error.message,
                error_timestamp: new Date()
            });

            logger.error(`DeviceService: Device connection failed - ID: ${deviceId}, Error: ${error.message}`);
            return { success: false, error: error.message };

        } catch (updateError) {
            logger.error(`DeviceService: Error handling connection failure for device ${deviceId}:`, updateError);
            throw updateError;
        }
    }

    /**
     * Handle device disconnection
     */
    async handleDisconnection(deviceId, reason) {
        try {
            await this.deviceRepository.updateStatus(deviceId, 'disconnected', {
                disconnection_reason: reason,
                disconnected_at: new Date()
            });

            // Check if auto-reconnect is enabled
            const device = await this.deviceRepository.findById(deviceId);
            if (device && device.auto_reconnect && reason !== 'manual') {
                // Schedule reconnection attempt
                setTimeout(async () => {
                    try {
                        await this.attemptReconnection(deviceId);
                    } catch (reconnectError) {
                        logger.error(`DeviceService: Auto-reconnection failed for device ${deviceId}:`, reconnectError);
                    }
                }, device.reconnect_interval * 1000);
            }

            logger.info(`DeviceService: Device disconnected - ID: ${deviceId}, Reason: ${reason}`);
            return { success: true, message: 'Device disconnected' };

        } catch (error) {
            logger.error(`DeviceService: Error handling disconnection for device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Attempt device reconnection
     */
    async attemptReconnection(deviceId) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            // Check if max reconnection attempts reached
            if (device.reconnect_attempts >= device.max_reconnect_attempts) {
                logger.warn(`DeviceService: Max reconnection attempts reached for device ${deviceId}`);
                return { success: false, message: 'Max reconnection attempts reached' };
            }

            // Update reconnection attempt
            await this.deviceRepository.updateReconnectionAttempt(deviceId);

            // Attempt to reconnect
            await this.connectDevice(deviceId);

            logger.info(`DeviceService: Reconnection attempt initiated for device ${deviceId}`);
            return { success: true, message: 'Reconnection initiated' };

        } catch (error) {
            logger.error(`DeviceService: Error during reconnection attempt for device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Get devices requiring reconnection
     */
    async getDevicesRequiringReconnection() {
        try {
            const devices = await this.deviceRepository.getDevicesRequiringReconnection();
            return devices;

        } catch (error) {
            logger.error('DeviceService: Error getting devices requiring reconnection:', error);
            throw error;
        }
    }

    /**
     * Validate device configuration
     */
    validateDeviceConfig(config) {
        const validConfig = {};

        // Validate auto_reply_enabled
        if (typeof config.auto_reply_enabled === 'boolean') {
            validConfig.auto_reply_enabled = config.auto_reply_enabled;
        }

        // Validate webhook_events
        if (Array.isArray(config.webhook_events)) {
            const validEvents = [
                'message_received', 'message_sent', 'message_delivered', 
                'message_read', 'connection_update', 'qr_code'
            ];
            validConfig.webhook_events = config.webhook_events.filter(event => 
                validEvents.includes(event)
            );
        }

        // Validate message_delay
        if (typeof config.message_delay === 'number' && config.message_delay >= 0 && config.message_delay <= 60000) {
            validConfig.message_delay = config.message_delay;
        }

        // Validate max_retries
        if (typeof config.max_retries === 'number' && config.max_retries >= 0 && config.max_retries <= 10) {
            validConfig.max_retries = config.max_retries;
        }

        // Validate timeout
        if (typeof config.timeout === 'number' && config.timeout >= 5000 && config.timeout <= 300000) {
            validConfig.timeout = config.timeout;
        }

        return validConfig;
    }
}

module.exports = new DeviceService();