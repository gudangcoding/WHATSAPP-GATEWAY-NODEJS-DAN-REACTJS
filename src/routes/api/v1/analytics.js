const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const AnalyticsController = require('../../../controllers/AnalyticsController');

// Dashboard analytics
router.get('/dashboard', auth, AnalyticsController.getDashboardStats);

// Message analytics
router.get('/messages', auth, AnalyticsController.getMessageAnalytics);
router.get('/messages/trends', auth, AnalyticsController.getMessageTrends);
router.get('/messages/performance', auth, AnalyticsController.getMessagePerformance);

// Campaign analytics
router.get('/campaigns', auth, AnalyticsController.getCampaignAnalytics);
router.get('/campaigns/:id/performance', auth, AnalyticsController.getCampaignPerformance);
router.get('/campaigns/comparison', auth, AnalyticsController.compareCampaigns);

// Contact analytics
router.get('/contacts', auth, AnalyticsController.getContactAnalytics);
router.get('/contacts/growth', auth, AnalyticsController.getContactGrowth);
router.get('/contacts/engagement', auth, AnalyticsController.getContactEngagement);

// Device analytics
router.get('/devices', auth, AnalyticsController.getDeviceAnalytics);
router.get('/devices/:deviceId/performance', auth, AnalyticsController.getDevicePerformance);

// Auto-reply analytics
router.get('/auto-reply', auth, AnalyticsController.getAutoReplyAnalytics);
router.get('/auto-reply/effectiveness', auth, AnalyticsController.getAutoReplyEffectiveness);

// AI analytics
router.get('/ai', auth, AnalyticsController.getAIAnalytics);
router.get('/ai/usage', auth, AnalyticsController.getAIUsage);
router.get('/ai/performance', auth, AnalyticsController.getAIPerformance);

// Export analytics
router.post('/export', auth, AnalyticsController.exportAnalytics);

module.exports = router;