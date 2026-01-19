const SessionRepository = require('../repositories/SessionRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const SessionManager = require('../core/SessionManager');
const logger = require('../utils/logger');

class SessionController {
    constructor() {
        this.sessionRepository = new SessionRepository();
        this.deviceRepository = new DeviceRepository();
        this.sessionManager = SessionManager;
    }

    /**
     * Get all sessions for authenticated user
     */
    async getSessions(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, device_id } = req.query;

            let sessions;
            let total;

            if (device_id) {
                // Get sessions for specific device
                const device = await this.deviceRepository.findById(device_id);
                if (!device || device.user_id !== userId) {
                    return res.status(404).json({
                        success: false,
                        message: 'Device not found',
                        error: 'Device does not exist or access denied',
                        code: 'DEVICE_NOT_FOUND',
                        timestamp: new Date().toISOString()
                    });
                }

                sessions = await this.sessionRepository.findByFilters(
                    { device_id }, 
                    { page, limit, orderBy: 'created_at', orderDirection: 'DESC' }
                );
                total = await this.sessionRepository.countByFilters({ device_id });
            } else {
                // Get all sessions for user's devices
                const userDevices = await this.deviceRepository.findByUserId(userId);
                const deviceIds = userDevices.map(device => device.id);

                if (deviceIds.length === 0) {
                    return res.json({
                        success: true,
                        message: 'Sessions retrieved successfully',
                        data: [],
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            total: 0,
                            pages: 0
                        }
                    });
                }

                sessions = await this.sessionRepository.findByFilters(
                    { device_id: deviceIds }, 
                    { page, limit, orderBy: 'created_at', orderDirection: 'DESC' }
                );
                total = await this.sessionRepository.countByFilters({ device_id: deviceIds });
            }

            res.json({
                success: true,
                message: 'Sessions retrieved successfully',
                data: sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('SessionController: Error getting sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get sessions',
                error: error.message,
                code: 'GET_SESSIONS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get session by ID
     */
    async getSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    error: 'Session does not exist',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user owns the device
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to access this session',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Session retrieved successfully',
                data: session
            });

        } catch (error) {
            logger.error('SessionController: Error getting session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get session',
                error: error.message,
                code: 'GET_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Create new session
     */
    async createSession(req, res) {
        try {
            const userId = req.user.id;
            const { device_id, name, settings = {} } = req.body;

            // Verify device ownership
            const device = await this.deviceRepository.findById(device_id);
            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found',
                    error: 'Device does not exist or access denied',
                    code: 'DEVICE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if device already has an active session
            const existingSession = await this.sessionRepository.findByFilters({
                device_id,
                status: 'active'
            });

            if (existingSession.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Device already has an active session',
                    error: 'Only one active session per device is allowed',
                    code: 'SESSION_EXISTS',
                    timestamp: new Date().toISOString()
                });
            }

            const sessionData = {
                device_id,
                name: name || `Session for ${device.name}`,
                status: 'inactive',
                settings: JSON.stringify(settings),
                created_at: new Date(),
                updated_at: new Date()
            };

            const session = await this.sessionRepository.create(sessionData);

            logger.info(`SessionController: Session created successfully - ID: ${session.id}, Device: ${device_id}`);

            res.status(201).json({
                success: true,
                message: 'Session created successfully',
                data: session
            });

        } catch (error) {
            logger.error('SessionController: Error creating session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create session',
                error: error.message,
                code: 'CREATE_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Update session
     */
    async updateSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;
            const { name, settings } = req.body;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    error: 'Session does not exist',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to update this session',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            const updateData = {
                updated_at: new Date()
            };

            if (name) updateData.name = name;
            if (settings) updateData.settings = JSON.stringify(settings);

            const updatedSession = await this.sessionRepository.update(sessionId, updateData);

            logger.info(`SessionController: Session updated successfully - ID: ${sessionId}`);

            res.json({
                success: true,
                message: 'Session updated successfully',
                data: updatedSession
            });

        } catch (error) {
            logger.error('SessionController: Error updating session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update session',
                error: error.message,
                code: 'UPDATE_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete session
     */
    async deleteSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    error: 'Session does not exist',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to delete this session',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            // Stop session if active
            if (session.status === 'active') {
                await this.sessionManager.stopSession(sessionId);
            }

            await this.sessionRepository.delete(sessionId);

            logger.info(`SessionController: Session deleted successfully - ID: ${sessionId}`);

            res.json({
                success: true,
                message: 'Session deleted successfully'
            });

        } catch (error) {
            logger.error('SessionController: Error deleting session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete session',
                error: error.message,
                code: 'DELETE_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Start session
     */
    async startSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    error: 'Session does not exist',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to start this session',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            if (session.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Session already active',
                    error: 'Session is already running',
                    code: 'SESSION_ALREADY_ACTIVE',
                    timestamp: new Date().toISOString()
                });
            }

            // Start session
            await this.sessionManager.startSession(sessionId);

            logger.info(`SessionController: Session started successfully - ID: ${sessionId}`);

            res.json({
                success: true,
                message: 'Session started successfully',
                data: {
                    session_id: sessionId,
                    status: 'starting'
                }
            });

        } catch (error) {
            logger.error('SessionController: Error starting session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start session',
                error: error.message,
                code: 'START_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Stop session
     */
    async stopSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    error: 'Session does not exist',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to stop this session',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            if (session.status === 'inactive') {
                return res.status(400).json({
                    success: false,
                    message: 'Session already inactive',
                    error: 'Session is not running',
                    code: 'SESSION_ALREADY_INACTIVE',
                    timestamp: new Date().toISOString()
                });
            }

            // Stop session
            await this.sessionManager.stopSession(sessionId);

            logger.info(`SessionController: Session stopped successfully - ID: ${sessionId}`);

            res.json({
                success: true,
                message: 'Session stopped successfully',
                data: {
                    session_id: sessionId,
                    status: 'stopping'
                }
            });

        } catch (error) {
            logger.error('SessionController: Error stopping session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to stop session',
                error: error.message,
                code: 'STOP_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get session status
     */
    async getSessionStatus(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    error: 'Session does not exist',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(session.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to access this session',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            // Get real-time status
            const realTimeStatus = await this.sessionManager.getSessionStatus(sessionId);

            res.json({
                success: true,
                message: 'Session status retrieved successfully',
                data: {
                    session_id: sessionId,
                    status: session.status,
                    real_time_status: realTimeStatus,
                    started_at: session.started_at,
                    stopped_at: session.stopped_at,
                    last_activity_at: session.last_activity_at
                }
            });

        } catch (error) {
            logger.error('SessionController: Error getting session status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get session status',
                error: error.message,
                code: 'GET_SESSION_STATUS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStats(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d', device_id } = req.query;

            let stats;

            if (device_id) {
                // Verify device ownership
                const device = await this.deviceRepository.findById(device_id);
                if (!device || device.user_id !== userId) {
                    return res.status(404).json({
                        success: false,
                        message: 'Device not found',
                        error: 'Device does not exist or access denied',
                        code: 'DEVICE_NOT_FOUND',
                        timestamp: new Date().toISOString()
                    });
                }

                stats = await this.sessionRepository.getSessionStats(period);
            } else {
                // Get stats for all user's devices
                const userDevices = await this.deviceRepository.findByUserId(userId);
                const deviceIds = userDevices.map(device => device.id);
                
                stats = await this.sessionRepository.getSessionStats(period);
            }

            res.json({
                success: true,
                message: 'Session statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            logger.error('SessionController: Error getting session stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get session statistics',
                error: error.message,
                code: 'GET_SESSION_STATS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new SessionController();