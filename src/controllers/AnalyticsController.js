const MessageRepository = require('../repositories/MessageRepository');
const CampaignRepository = require('../repositories/CampaignRepository');
const ContactRepository = require('../repositories/ContactRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const AutoReplyLogRepository = require('../repositories/AutoReplyLogRepository');
const AIHistoryRepository = require('../repositories/AIHistoryRepository');
const logger = require('../utils/logger');

class AnalyticsController {
    constructor() {
        this.messageRepository = new MessageRepository();
        this.campaignRepository = new CampaignRepository();
        this.contactRepository = new ContactRepository();
        this.deviceRepository = new DeviceRepository();
        this.autoReplyLogRepository = new AutoReplyLogRepository();
        this.aiHistoryRepository = new AIHistoryRepository();
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d' } = req.query;

            // Get basic counts
            const totalDevices = await this.deviceRepository.countByFilters({ user_id: userId });
            const totalContacts = await this.contactRepository.countByFilters({ user_id: userId });
            const totalCampaigns = await this.campaignRepository.countByFilters({ user_id: userId });

            // Get message stats
            const messageStats = await this.messageRepository.getMessageStats(userId, period);
            
            // Get campaign stats
            const campaignStats = await this.campaignRepository.getCampaignStats(userId, period);

            // Get device performance
            const devicePerformance = await this.deviceRepository.getDevicePerformance(userId, period);

            // Get recent activities
            const recentMessages = await this.messageRepository.getRecentMessages(userId, 5);
            const recentCampaigns = await this.campaignRepository.getRecentCampaigns(userId, 5);

            res.json({
                success: true,
                data: {
                    overview: {
                        totalDevices,
                        totalContacts,
                        totalCampaigns,
                        totalMessages: messageStats.total || 0,
                        period
                    },
                    messageStats,
                    campaignStats,
                    devicePerformance,
                    recentActivities: {
                        messages: recentMessages,
                        campaigns: recentCampaigns
                    }
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard statistics',
                error: error.message
            });
        }
    }

    /**
     * Get message analytics
     */
    async getMessageAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d', deviceId, messageType } = req.query;

            const filters = { user_id: userId };
            if (deviceId) filters.device_id = deviceId;
            if (messageType) filters.message_type = messageType;

            const analytics = await this.messageRepository.getMessageAnalytics(filters, period);

            res.json({
                success: true,
                data: {
                    period,
                    filters,
                    analytics
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting message analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get message analytics',
                error: error.message
            });
        }
    }

    /**
     * Get message trends
     */
    async getMessageTrends(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d', interval = 'day' } = req.query;

            const trends = await this.messageRepository.getMessageTrends(userId, period, interval);

            res.json({
                success: true,
                data: {
                    period,
                    interval,
                    trends
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting message trends:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get message trends',
                error: error.message
            });
        }
    }

    /**
     * Get message performance
     */
    async getMessagePerformance(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d' } = req.query;

            const performance = await this.messageRepository.getMessagePerformance(userId, period);

            res.json({
                success: true,
                data: {
                    period,
                    performance
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting message performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get message performance',
                error: error.message
            });
        }
    }

    /**
     * Get campaign analytics
     */
    async getCampaignAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d', status } = req.query;

            const filters = { user_id: userId };
            if (status) filters.status = status;

            const analytics = await this.campaignRepository.getCampaignAnalytics(filters, period);

            res.json({
                success: true,
                data: {
                    period,
                    filters,
                    analytics
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting campaign analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get campaign analytics',
                error: error.message
            });
        }
    }

    /**
     * Get campaign performance
     */
    async getCampaignPerformance(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const campaign = await this.campaignRepository.findById(id);

            if (!campaign || campaign.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }

            const performance = await this.campaignRepository.getCampaignPerformance(id);

            res.json({
                success: true,
                data: {
                    campaign_id: id,
                    performance
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting campaign performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get campaign performance',
                error: error.message
            });
        }
    }

    /**
     * Compare campaigns
     */
    async compareCampaigns(req, res) {
        try {
            const userId = req.user.id;
            const { campaignIds } = req.body;

            if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'At least 2 campaign IDs are required for comparison'
                });
            }

            const comparison = await this.campaignRepository.compareCampaigns(campaignIds, userId);

            res.json({
                success: true,
                data: {
                    campaignIds,
                    comparison
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error comparing campaigns:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to compare campaigns',
                error: error.message
            });
        }
    }

    /**
     * Get contact analytics
     */
    async getContactAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d', deviceId } = req.query;

            const filters = { user_id: userId };
            if (deviceId) filters.device_id = deviceId;

            const analytics = await this.contactRepository.getContactAnalytics(filters, period);

            res.json({
                success: true,
                data: {
                    period,
                    filters,
                    analytics
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting contact analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contact analytics',
                error: error.message
            });
        }
    }

    /**
     * Get contact growth
     */
    async getContactGrowth(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d', interval = 'day' } = req.query;

            const growth = await this.contactRepository.getContactGrowth(userId, period, interval);

            res.json({
                success: true,
                data: {
                    period,
                    interval,
                    growth
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting contact growth:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contact growth',
                error: error.message
            });
        }
    }

    /**
     * Get contact engagement
     */
    async getContactEngagement(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d' } = req.query;

            const engagement = await this.contactRepository.getContactEngagement(userId, period);

            res.json({
                success: true,
                data: {
                    period,
                    engagement
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting contact engagement:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get contact engagement',
                error: error.message
            });
        }
    }

    /**
     * Get device analytics
     */
    async getDeviceAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d' } = req.query;

            const analytics = await this.deviceRepository.getDeviceAnalytics(userId, period);

            res.json({
                success: true,
                data: {
                    period,
                    analytics
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting device analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get device analytics',
                error: error.message
            });
        }
    }

    /**
     * Get device performance
     */
    async getDevicePerformance(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;
            const { period = '7d' } = req.query;

            const device = await this.deviceRepository.findById(deviceId);

            if (!device || device.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            const performance = await this.deviceRepository.getDevicePerformanceById(deviceId, period);

            res.json({
                success: true,
                data: {
                    device_id: deviceId,
                    period,
                    performance
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting device performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get device performance',
                error: error.message
            });
        }
    }

    /**
     * Get auto-reply analytics
     */
    async getAutoReplyAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d', deviceId } = req.query;

            const filters = { user_id: userId };
            if (deviceId) filters.device_id = deviceId;

            const analytics = await this.autoReplyLogRepository.getAutoReplyAnalytics(filters, period);

            res.json({
                success: true,
                data: {
                    period,
                    filters,
                    analytics
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting auto-reply analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get auto-reply analytics',
                error: error.message
            });
        }
    }

    /**
     * Get auto-reply effectiveness
     */
    async getAutoReplyEffectiveness(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d' } = req.query;

            const effectiveness = await this.autoReplyLogRepository.getAutoReplyEffectiveness(userId, period);

            res.json({
                success: true,
                data: {
                    period,
                    effectiveness
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting auto-reply effectiveness:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get auto-reply effectiveness',
                error: error.message
            });
        }
    }

    /**
     * Get AI analytics
     */
    async getAIAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d' } = req.query;

            const analytics = await this.aiHistoryRepository.getAIAnalytics(userId, period);

            res.json({
                success: true,
                data: {
                    period,
                    analytics
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting AI analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get AI analytics',
                error: error.message
            });
        }
    }

    /**
     * Get AI usage statistics
     */
    async getAIUsage(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d' } = req.query;

            const usage = await this.aiHistoryRepository.getAIUsage(userId, period);

            res.json({
                success: true,
                data: {
                    period,
                    usage
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting AI usage:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get AI usage',
                error: error.message
            });
        }
    }

    /**
     * Get AI performance metrics
     */
    async getAIPerformance(req, res) {
        try {
            const userId = req.user.id;
            const { period = '7d', aiType } = req.query;

            const filters = { user_id: userId };
            if (aiType) filters.type = aiType;

            const performance = await this.aiHistoryRepository.getAIPerformance(filters, period);

            res.json({
                success: true,
                data: {
                    period,
                    filters,
                    performance
                }
            });

        } catch (error) {
            logger.error('AnalyticsController: Error getting AI performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get AI performance',
                error: error.message
            });
        }
    }

    /**
     * Export analytics data
     */
    async exportAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const { 
                type, 
                period = '30d', 
                format = 'json',
                filters = {}
            } = req.body;

            let data = {};

            switch (type) {
                case 'messages':
                    data = await this.messageRepository.getMessageAnalytics({ user_id: userId, ...filters }, period);
                    break;
                case 'campaigns':
                    data = await this.campaignRepository.getCampaignAnalytics({ user_id: userId, ...filters }, period);
                    break;
                case 'contacts':
                    data = await this.contactRepository.getContactAnalytics({ user_id: userId, ...filters }, period);
                    break;
                case 'devices':
                    data = await this.deviceRepository.getDeviceAnalytics(userId, period);
                    break;
                case 'auto-reply':
                    data = await this.autoReplyLogRepository.getAutoReplyAnalytics({ user_id: userId, ...filters }, period);
                    break;
                case 'ai':
                    data = await this.aiHistoryRepository.getAIAnalytics(userId, period);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid export type'
                    });
            }

            const exportData = {
                type,
                period,
                exported_at: new Date().toISOString(),
                user_id: userId,
                data
            };

            if (format === 'csv') {
                // Convert to CSV format (simplified)
                const csv = this.convertToCSV(exportData);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${type}_analytics_${period}.csv"`);
                res.send(csv);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${type}_analytics_${period}.json"`);
                res.json(exportData);
            }

        } catch (error) {
            logger.error('AnalyticsController: Error exporting analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export analytics',
                error: error.message
            });
        }
    }

    /**
     * Convert data to CSV format (helper method)
     */
    convertToCSV(data) {
        // Simplified CSV conversion
        const headers = Object.keys(data).join(',');
        const values = Object.values(data).map(value => 
            typeof value === 'object' ? JSON.stringify(value) : value
        ).join(',');
        
        return `${headers}\n${values}`;
    }
}

module.exports = new AnalyticsController();