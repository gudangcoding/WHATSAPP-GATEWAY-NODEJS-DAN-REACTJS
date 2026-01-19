const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const deviceRoutes = require('./devices');
const sessionRoutes = require('./sessions');
const messageRoutes = require('./messages');
const contactRoutes = require('./contacts');
const autoReplyRoutes = require('./autoReply');
const campaignRoutes = require('./campaigns');
const aiRoutes = require('./ai');
const webhookRoutes = require('./webhooks');
const analyticsRoutes = require('./analytics');
const systemRoutes = require('./system');

// API Documentation endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'WhatsApp Gateway SaaS API v1',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        endpoints: {
            auth: '/api/v1/auth',
            devices: '/api/v1/devices',
            sessions: '/api/v1/sessions',
            messages: '/api/v1/messages',
            contacts: '/api/v1/contacts',
            autoReply: '/api/v1/auto-reply',
            campaigns: '/api/v1/campaigns',
            ai: '/api/v1/ai',
            webhooks: '/api/v1/webhooks',
            analytics: '/api/v1/analytics',
            system: '/api/v1/system'
        },
        features: [
            'Multi-user & Multi-device support',
            'Session persistence & auto-reconnect',
            'Real-time QR code management',
            'All message types support',
            'Contact scraping & management',
            'Auto-reply engine with rules',
            'Campaign & blast messaging',
            'AI integration (9 features)',
            'Webhook notifications',
            'Analytics & reporting',
            'System monitoring'
        ]
    });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/sessions', sessionRoutes);
router.use('/messages', messageRoutes);
router.use('/contacts', contactRoutes);
router.use('/auto-reply', autoReplyRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/ai', aiRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/system', systemRoutes);

module.exports = router;