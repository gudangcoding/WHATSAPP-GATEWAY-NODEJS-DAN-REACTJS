const WebhookRepository = require('../repositories/WebhookRepository');
const WebhookLogRepository = require('../repositories/WebhookLogRepository');
const logger = require('../utils/logger');
const axios = require('axios');

class WebhookController {
    constructor() {
        this.webhookRepository = new WebhookRepository();
        this.webhookLogRepository = new WebhookLogRepository();
    }

    /**
     * Get all webhooks for user
     */
    async getWebhooks(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const userId = req.user.id;

            const filters = { user_id: userId };
            if (status) filters.status = status;

            const webhooks = await this.webhookRepository.findByFilters(filters, {
                page: parseInt(page),
                limit: parseInt(limit),
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });

            const total = await this.webhookRepository.countByFilters(filters);

            res.json({
                success: true,
                data: webhooks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('WebhookController: Error getting webhooks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get webhooks',
                error: error.message
            });
        }
    }

    /**
     * Create new webhook
     */
    async createWebhook(req, res) {
        try {
            const userId = req.user.id;
            const {
                name,
                url,
                events,
                secret,
                headers = {},
                retry_attempts = 3,
                timeout = 30000,
                description
            } = req.body;

            const webhookData = {
                user_id: userId,
                name,
                url,
                events: JSON.stringify(events),
                secret,
                headers: JSON.stringify(headers),
                retry_attempts,
                timeout,
                description,
                status: 'active',
                created_at: new Date(),
                updated_at: new Date()
            };

            const webhook = await this.webhookRepository.create(webhookData);

            logger.info(`WebhookController: Created webhook ${webhook.id} for user ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Webhook created successfully',
                data: webhook
            });

        } catch (error) {
            logger.error('WebhookController: Error creating webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create webhook',
                error: error.message
            });
        }
    }

    /**
     * Get webhook by ID
     */
    async getWebhook(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const webhook = await this.webhookRepository.findById(id);

            if (!webhook || webhook.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            res.json({
                success: true,
                data: webhook
            });

        } catch (error) {
            logger.error('WebhookController: Error getting webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get webhook',
                error: error.message
            });
        }
    }

    /**
     * Update webhook
     */
    async updateWebhook(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const webhook = await this.webhookRepository.findById(id);

            if (!webhook || webhook.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            const updateData = {
                ...req.body,
                updated_at: new Date()
            };

            if (updateData.events) {
                updateData.events = JSON.stringify(updateData.events);
            }

            if (updateData.headers) {
                updateData.headers = JSON.stringify(updateData.headers);
            }

            const updatedWebhook = await this.webhookRepository.update(id, updateData);

            logger.info(`WebhookController: Updated webhook ${id} for user ${userId}`);

            res.json({
                success: true,
                message: 'Webhook updated successfully',
                data: updatedWebhook
            });

        } catch (error) {
            logger.error('WebhookController: Error updating webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update webhook',
                error: error.message
            });
        }
    }

    /**
     * Delete webhook
     */
    async deleteWebhook(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const webhook = await this.webhookRepository.findById(id);

            if (!webhook || webhook.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            await this.webhookRepository.delete(id);

            logger.info(`WebhookController: Deleted webhook ${id} for user ${userId}`);

            res.json({
                success: true,
                message: 'Webhook deleted successfully'
            });

        } catch (error) {
            logger.error('WebhookController: Error deleting webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete webhook',
                error: error.message
            });
        }
    }

    /**
     * Test webhook
     */
    async testWebhook(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const webhook = await this.webhookRepository.findById(id);

            if (!webhook || webhook.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            const testPayload = {
                event: 'webhook.test',
                timestamp: new Date().toISOString(),
                data: {
                    message: 'This is a test webhook call',
                    webhook_id: webhook.id,
                    user_id: userId
                }
            };

            const startTime = Date.now();
            let success = false;
            let error = null;
            let statusCode = null;

            try {
                const headers = JSON.parse(webhook.headers || '{}');
                if (webhook.secret) {
                    headers['X-Webhook-Secret'] = webhook.secret;
                }

                const response = await axios.post(webhook.url, testPayload, {
                    headers,
                    timeout: webhook.timeout || 30000
                });

                success = true;
                statusCode = response.status;

            } catch (err) {
                error = err.message;
                statusCode = err.response?.status || 0;
            }

            const responseTime = Date.now() - startTime;

            // Log the test
            await this.webhookLogRepository.create({
                webhook_id: webhook.id,
                event: 'webhook.test',
                payload: JSON.stringify(testPayload),
                status: success ? 'success' : 'failed',
                status_code: statusCode,
                response_time: responseTime,
                error_message: error,
                created_at: new Date()
            });

            res.json({
                success: true,
                message: 'Webhook test completed',
                result: {
                    success,
                    statusCode,
                    responseTime,
                    error
                }
            });

        } catch (error) {
            logger.error('WebhookController: Error testing webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to test webhook',
                error: error.message
            });
        }
    }

    /**
     * Get webhook logs
     */
    async getWebhookLogs(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20, status } = req.query;
            const userId = req.user.id;

            const webhook = await this.webhookRepository.findById(id);

            if (!webhook || webhook.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            const filters = { webhook_id: id };
            if (status) filters.status = status;

            const logs = await this.webhookLogRepository.findByFilters(filters, {
                page: parseInt(page),
                limit: parseInt(limit),
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });

            const total = await this.webhookLogRepository.countByFilters(filters);

            res.json({
                success: true,
                data: logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('WebhookController: Error getting webhook logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get webhook logs',
                error: error.message
            });
        }
    }

    /**
     * Get webhook statistics
     */
    async getWebhookStats(req, res) {
        try {
            const { id } = req.params;
            const { period = '7d' } = req.query;
            const userId = req.user.id;

            const webhook = await this.webhookRepository.findById(id);

            if (!webhook || webhook.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            const stats = await this.webhookLogRepository.getWebhookStats(id, period);

            res.json({
                success: true,
                data: {
                    webhook_id: id,
                    period,
                    stats
                }
            });

        } catch (error) {
            logger.error('WebhookController: Error getting webhook stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get webhook stats',
                error: error.message
            });
        }
    }
}

module.exports = new WebhookController();