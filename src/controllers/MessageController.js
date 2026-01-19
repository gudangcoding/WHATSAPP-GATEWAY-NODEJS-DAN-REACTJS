const MessageRepository = require('../repositories/MessageRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const ContactRepository = require('../repositories/ContactRepository');
const MessageService = require('../services/MessageService');
const QueueManager = require('../core/QueueManager');
const logger = require('../utils/logger');

class MessageController {
    constructor() {
        this.messageRepository = new MessageRepository();
        this.deviceRepository = new DeviceRepository();
        this.contactRepository = new ContactRepository();
        this.messageService = new MessageService();
        this.queueManager = QueueManager;
    }

    /**
     * Send single message
     */
    async sendMessage(req, res) {
        try {
            const userId = req.user.id;
            const { device_id, to, message_type, content, schedule_at, priority = 'normal' } = req.body;

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

            // Check device status
            if (device.status !== 'connected') {
                return res.status(400).json({
                    success: false,
                    message: 'Device not connected',
                    error: 'Device must be connected to send messages',
                    code: 'DEVICE_NOT_CONNECTED',
                    timestamp: new Date().toISOString()
                });
            }

            // Create message record
            const messageData = {
                user_id: userId,
                device_id,
                to_number: to,
                message_type,
                content: JSON.stringify(content),
                status: schedule_at ? 'scheduled' : 'pending',
                priority,
                scheduled_at: schedule_at ? new Date(schedule_at) : null,
                created_at: new Date(),
                updated_at: new Date()
            };

            const message = await this.messageRepository.create(messageData);

            // Queue message for sending
            if (schedule_at) {
                // Schedule for later
                await this.queueManager.scheduleJob('message', {
                    messageId: message.id,
                    deviceId: device_id,
                    action: 'send'
                }, new Date(schedule_at));
            } else {
                // Send immediately
                await this.queueManager.addJob('message', {
                    messageId: message.id,
                    deviceId: device_id,
                    action: 'send'
                }, { priority: this.getPriorityValue(priority) });
            }

            logger.info(`MessageController: Message queued successfully - ID: ${message.id}, Device: ${device_id}`);

            res.status(201).json({
                success: true,
                message: 'Message queued successfully',
                data: {
                    message_id: message.id,
                    status: message.status,
                    scheduled_at: message.scheduled_at
                }
            });

        } catch (error) {
            logger.error('MessageController: Error sending message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send message',
                error: error.message,
                code: 'SEND_MESSAGE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Send bulk messages
     */
    async sendBulkMessages(req, res) {
        try {
            const userId = req.user.id;
            const { device_id, recipients, message_type, content, schedule_at, priority = 'normal' } = req.body;

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

            // Check device status
            if (device.status !== 'connected') {
                return res.status(400).json({
                    success: false,
                    message: 'Device not connected',
                    error: 'Device must be connected to send messages',
                    code: 'DEVICE_NOT_CONNECTED',
                    timestamp: new Date().toISOString()
                });
            }

            const messages = [];
            const messageIds = [];

            // Create message records for each recipient
            for (const recipient of recipients) {
                const messageData = {
                    user_id: userId,
                    device_id,
                    to_number: recipient,
                    message_type,
                    content: JSON.stringify(content),
                    status: schedule_at ? 'scheduled' : 'pending',
                    priority,
                    scheduled_at: schedule_at ? new Date(schedule_at) : null,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                const message = await this.messageRepository.create(messageData);
                messages.push(message);
                messageIds.push(message.id);
            }

            // Queue messages for sending
            for (const message of messages) {
                if (schedule_at) {
                    await this.queueManager.scheduleJob('message', {
                        messageId: message.id,
                        deviceId: device_id,
                        action: 'send'
                    }, new Date(schedule_at));
                } else {
                    await this.queueManager.addJob('message', {
                        messageId: message.id,
                        deviceId: device_id,
                        action: 'send'
                    }, { 
                        priority: this.getPriorityValue(priority),
                        delay: Math.random() * 5000 // Random delay to avoid spam detection
                    });
                }
            }

            logger.info(`MessageController: Bulk messages queued successfully - Count: ${messages.length}, Device: ${device_id}`);

            res.status(201).json({
                success: true,
                message: 'Bulk messages queued successfully',
                data: {
                    message_ids: messageIds,
                    count: messages.length,
                    status: schedule_at ? 'scheduled' : 'pending'
                }
            });

        } catch (error) {
            logger.error('MessageController: Error sending bulk messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send bulk messages',
                error: error.message,
                code: 'SEND_BULK_MESSAGES_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get messages
     */
    async getMessages(req, res) {
        try {
            const userId = req.user.id;
            const { 
                page = 1, 
                limit = 10, 
                device_id, 
                status, 
                message_type, 
                search,
                date_from,
                date_to
            } = req.query;

            let messages;
            let total;

            // Build filters
            const filters = {};
            
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
                filters.device_id = device_id;
            } else {
                // Get all user's devices
                const userDevices = await this.deviceRepository.findByUserId(userId);
                const deviceIds = userDevices.map(device => device.id);
                if (deviceIds.length === 0) {
                    return res.json({
                        success: true,
                        message: 'Messages retrieved successfully',
                        data: [],
                        pagination: { page: 1, limit, total: 0, pages: 0 }
                    });
                }
                filters.device_id = deviceIds;
            }

            if (status) filters.status = status;
            if (message_type) filters.message_type = message_type;
            if (date_from) filters.created_at_from = new Date(date_from);
            if (date_to) filters.created_at_to = new Date(date_to);

            if (search) {
                messages = await this.messageRepository.searchMessages(search, filters, { page, limit });
                total = await this.messageRepository.countSearchResults(search, filters);
            } else {
                messages = await this.messageRepository.findByFilters(filters, { 
                    page, 
                    limit, 
                    orderBy: 'created_at', 
                    orderDirection: 'DESC' 
                });
                total = await this.messageRepository.countByFilters(filters);
            }

            res.json({
                success: true,
                message: 'Messages retrieved successfully',
                data: messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('MessageController: Error getting messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages',
                error: error.message,
                code: 'GET_MESSAGES_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get message by ID
     */
    async getMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const message = await this.messageRepository.findById(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                    error: 'Message does not exist',
                    code: 'MESSAGE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(message.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to access this message',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Message retrieved successfully',
                data: message
            });

        } catch (error) {
            logger.error('MessageController: Error getting message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get message',
                error: error.message,
                code: 'GET_MESSAGE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Cancel scheduled message
     */
    async cancelMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const message = await this.messageRepository.findById(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                    error: 'Message does not exist',
                    code: 'MESSAGE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(message.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to cancel this message',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if message can be cancelled
            if (!['pending', 'scheduled'].includes(message.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel message',
                    error: 'Only pending or scheduled messages can be cancelled',
                    code: 'CANNOT_CANCEL_MESSAGE',
                    timestamp: new Date().toISOString()
                });
            }

            // Update message status
            await this.messageRepository.update(messageId, {
                status: 'cancelled',
                cancelled_at: new Date(),
                updated_at: new Date()
            });

            // Remove from queue if scheduled
            if (message.status === 'scheduled') {
                await this.queueManager.removeScheduledJob('message', messageId);
            }

            logger.info(`MessageController: Message cancelled successfully - ID: ${messageId}`);

            res.json({
                success: true,
                message: 'Message cancelled successfully'
            });

        } catch (error) {
            logger.error('MessageController: Error cancelling message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel message',
                error: error.message,
                code: 'CANCEL_MESSAGE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Retry failed message
     */
    async retryMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const message = await this.messageRepository.findById(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                    error: 'Message does not exist',
                    code: 'MESSAGE_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device ownership
            const device = await this.deviceRepository.findById(message.device_id);
            if (!device || device.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'You do not have permission to retry this message',
                    code: 'ACCESS_DENIED',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if message can be retried
            if (message.status !== 'failed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot retry message',
                    error: 'Only failed messages can be retried',
                    code: 'CANNOT_RETRY_MESSAGE',
                    timestamp: new Date().toISOString()
                });
            }

            // Check device status
            if (device.status !== 'connected') {
                return res.status(400).json({
                    success: false,
                    message: 'Device not connected',
                    error: 'Device must be connected to retry messages',
                    code: 'DEVICE_NOT_CONNECTED',
                    timestamp: new Date().toISOString()
                });
            }

            // Update message status and retry
            await this.messageRepository.update(messageId, {
                status: 'pending',
                retry_count: (message.retry_count || 0) + 1,
                updated_at: new Date()
            });

            // Queue for retry
            await this.queueManager.addJob('message', {
                messageId: messageId,
                deviceId: message.device_id,
                action: 'send'
            }, { priority: this.getPriorityValue(message.priority) });

            logger.info(`MessageController: Message retry queued successfully - ID: ${messageId}`);

            res.json({
                success: true,
                message: 'Message retry queued successfully'
            });

        } catch (error) {
            logger.error('MessageController: Error retrying message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retry message',
                error: error.message,
                code: 'RETRY_MESSAGE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get message statistics
     */
    async getMessageStats(req, res) {
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

                stats = await this.messageRepository.getMessageStats(device_id, period);
            } else {
                // Get stats for all user's devices
                const userDevices = await this.deviceRepository.findByUserId(userId);
                const deviceIds = userDevices.map(device => device.id);
                
                if (deviceIds.length === 0) {
                    return res.json({
                        success: true,
                        message: 'Message statistics retrieved successfully',
                        data: {
                            total_messages: 0,
                            sent_messages: 0,
                            failed_messages: 0,
                            pending_messages: 0,
                            success_rate: 0
                        }
                    });
                }

                stats = await this.messageRepository.getMessageStats(deviceIds, period);
            }

            res.json({
                success: true,
                message: 'Message statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            logger.error('MessageController: Error getting message stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get message statistics',
                error: error.message,
                code: 'GET_MESSAGE_STATS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get priority value for queue
     */
    getPriorityValue(priority) {
        const priorityMap = {
            'low': 1,
            'normal': 5,
            'high': 10
        };
        return priorityMap[priority] || 5;
    }
}

module.exports = new MessageController();