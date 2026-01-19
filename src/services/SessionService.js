const SessionRepository = require('../repositories/SessionRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const SessionManager = require('../core/SessionManager');
const logger = require('../utils/logger');

class SessionService {
    constructor() {
        this.sessionRepository = new SessionRepository();
        this.deviceRepository = new DeviceRepository();
        this.sessionManager = SessionManager;
    }

    /**
     * Create new session
     */
    async createSession(deviceId, sessionData) {
        try {
            const device = await this.deviceRepository.findById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            // Check if device already has an active session
            const existingSessions = await this.sessionRepository.findByFilters({
                device_id: deviceId,
                status: 'active'
            });

            if (existingSessions.length > 0) {
                throw new Error('Device already has an active session');
            }

            const session = await this.sessionRepository.create({
                device_id: deviceId,
                name: sessionData.name || `Session for ${device.name}`,
                status: 'inactive',
                settings: JSON.stringify(sessionData.settings || {}),
                created_at: new Date(),
                updated_at: new Date()
            });

            logger.info(`SessionService: Session created successfully - ID: ${session.id}, Device: ${deviceId}`);
            return session;

        } catch (error) {
            logger.error(`SessionService: Error creating session for device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Start session
     */
    async startSession(sessionId) {
        try {
            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status === 'active') {
                return { success: true, message: 'Session already active' };
            }

            // Get device information
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device) {
                throw new Error('Device not found');
            }

            // Update session status
            await this.sessionRepository.update(sessionId, {
                status: 'starting',
                started_at: new Date(),
                updated_at: new Date()
            });

            // Start WhatsApp session through SessionManager
            await this.sessionManager.startSession(sessionId, session.device_id);

            logger.info(`SessionService: Session start initiated - ID: ${sessionId}`);
            return { success: true, message: 'Session start initiated' };

        } catch (error) {
            logger.error(`SessionService: Error starting session ${sessionId}:`, error);
            
            // Update session status to error
            await this.sessionRepository.update(sessionId, {
                status: 'error',
                error_message: error.message,
                updated_at: new Date()
            });

            throw error;
        }
    }

    /**
     * Stop session
     */
    async stopSession(sessionId) {
        try {
            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status === 'inactive') {
                return { success: true, message: 'Session already inactive' };
            }

            // Update session status
            await this.sessionRepository.update(sessionId, {
                status: 'stopping',
                updated_at: new Date()
            });

            // Stop WhatsApp session through SessionManager
            await this.sessionManager.stopSession(sessionId);

            // Update final status
            await this.sessionRepository.update(sessionId, {
                status: 'inactive',
                stopped_at: new Date(),
                updated_at: new Date()
            });

            logger.info(`SessionService: Session stopped successfully - ID: ${sessionId}`);
            return { success: true, message: 'Session stopped' };

        } catch (error) {
            logger.error(`SessionService: Error stopping session ${sessionId}:`, error);
            
            // Update session status to error
            await this.sessionRepository.update(sessionId, {
                status: 'error',
                error_message: error.message,
                updated_at: new Date()
            });

            throw error;
        }
    }

    /**
     * Restart session
     */
    async restartSession(sessionId) {
        try {
            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Stop session first
            await this.stopSession(sessionId);

            // Wait a moment before restarting
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Start session again
            await this.startSession(sessionId);

            logger.info(`SessionService: Session restarted successfully - ID: ${sessionId}`);
            return { success: true, message: 'Session restarted' };

        } catch (error) {
            logger.error(`SessionService: Error restarting session ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Get session status with real-time information
     */
    async getSessionStatus(sessionId) {
        try {
            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Get real-time status from session manager
            const realTimeStatus = await this.sessionManager.getSessionStatus(sessionId);

            return {
                session_id: sessionId,
                database_status: session.status,
                real_time_status: realTimeStatus,
                started_at: session.started_at,
                stopped_at: session.stopped_at,
                last_activity_at: session.last_activity_at,
                device_id: session.device_id
            };

        } catch (error) {
            logger.error(`SessionService: Error getting session status ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Update session configuration
     */
    async updateSessionConfig(sessionId, config) {
        try {
            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const currentSettings = session.settings ? JSON.parse(session.settings) : {};
            const updatedSettings = { ...currentSettings, ...config };

            await this.sessionRepository.update(sessionId, {
                settings: JSON.stringify(updatedSettings),
                updated_at: new Date()
            });

            // Apply configuration to active session if running
            if (session.status === 'active') {
                await this.sessionManager.updateSessionConfig(sessionId, updatedSettings);
            }

            logger.info(`SessionService: Session configuration updated - ID: ${sessionId}`);
            return { success: true, message: 'Configuration updated' };

        } catch (error) {
            logger.error(`SessionService: Error updating session config ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Handle session activation
     */
    async handleSessionActivation(sessionId, connectionInfo) {
        try {
            await this.sessionRepository.update(sessionId, {
                status: 'active',
                connection_info: JSON.stringify(connectionInfo),
                activated_at: new Date(),
                last_activity_at: new Date(),
                updated_at: new Date()
            });

            logger.info(`SessionService: Session activated successfully - ID: ${sessionId}`);
            return { success: true, message: 'Session activated' };

        } catch (error) {
            logger.error(`SessionService: Error handling session activation ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Handle session deactivation
     */
    async handleSessionDeactivation(sessionId, reason) {
        try {
            await this.sessionRepository.update(sessionId, {
                status: 'inactive',
                deactivation_reason: reason,
                deactivated_at: new Date(),
                updated_at: new Date()
            });

            logger.info(`SessionService: Session deactivated - ID: ${sessionId}, Reason: ${reason}`);
            return { success: true, message: 'Session deactivated' };

        } catch (error) {
            logger.error(`SessionService: Error handling session deactivation ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Handle session error
     */
    async handleSessionError(sessionId, error) {
        try {
            await this.sessionRepository.update(sessionId, {
                status: 'error',
                error_message: error.message,
                error_timestamp: new Date(),
                updated_at: new Date()
            });

            logger.error(`SessionService: Session error - ID: ${sessionId}, Error: ${error.message}`);
            return { success: false, error: error.message };

        } catch (updateError) {
            logger.error(`SessionService: Error handling session error ${sessionId}:`, updateError);
            throw updateError;
        }
    }

    /**
     * Update session activity
     */
    async updateSessionActivity(sessionId) {
        try {
            await this.sessionRepository.update(sessionId, {
                last_activity_at: new Date(),
                updated_at: new Date()
            });

            return { success: true };

        } catch (error) {
            logger.error(`SessionService: Error updating session activity ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Get sessions by device
     */
    async getSessionsByDevice(deviceId, options = {}) {
        try {
            const sessions = await this.sessionRepository.findByFilters(
                { device_id: deviceId },
                {
                    page: options.page || 1,
                    limit: options.limit || 10,
                    orderBy: 'created_at',
                    orderDirection: 'DESC'
                }
            );

            return sessions;

        } catch (error) {
            logger.error(`SessionService: Error getting sessions for device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Get active sessions
     */
    async getActiveSessions() {
        try {
            const sessions = await this.sessionRepository.findByFilters({
                status: 'active'
            });

            return sessions;

        } catch (error) {
            logger.error('SessionService: Error getting active sessions:', error);
            throw error;
        }
    }

    /**
     * Clean expired sessions
     */
    async cleanExpiredSessions() {
        try {
            const result = await this.sessionRepository.cleanExpiredSessions();
            
            logger.info(`SessionService: Cleaned expired sessions - Count: ${result.affectedRows || 0}`);
            return { success: true, cleaned: result.affectedRows || 0 };

        } catch (error) {
            logger.error('SessionService: Error cleaning expired sessions:', error);
            throw error;
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStatistics(period = '30d') {
        try {
            const stats = await this.sessionRepository.getSessionStats(period);
            return stats;

        } catch (error) {
            logger.error('SessionService: Error getting session statistics:', error);
            throw error;
        }
    }

    /**
     * Validate session configuration
     */
    validateSessionConfig(config) {
        const validConfig = {};

        // Validate session-specific settings
        if (typeof config.auto_save_media === 'boolean') {
            validConfig.auto_save_media = config.auto_save_media;
        }

        if (typeof config.message_history_limit === 'number' && config.message_history_limit >= 0) {
            validConfig.message_history_limit = config.message_history_limit;
        }

        if (typeof config.enable_read_receipts === 'boolean') {
            validConfig.enable_read_receipts = config.enable_read_receipts;
        }

        if (typeof config.enable_typing_indicator === 'boolean') {
            validConfig.enable_typing_indicator = config.enable_typing_indicator;
        }

        if (typeof config.session_timeout === 'number' && config.session_timeout >= 300000) {
            validConfig.session_timeout = config.session_timeout;
        }

        return validConfig;
    }
}

module.exports = new SessionService();