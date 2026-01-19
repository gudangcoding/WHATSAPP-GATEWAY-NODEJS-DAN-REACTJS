const express = require('express');
const router = express.Router();

// Import API versions
const v1Routes = require('./api/v1');

// API version routing
router.use('/api/v1', v1Routes);

// Default API redirect to latest version
router.use('/api', v1Routes);

// Root endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'WhatsApp Gateway SaaS Backend',
        version: '1.0.0',
        api: {
            current: '/api/v1',
            versions: [
                {
                    version: 'v1',
                    path: '/api/v1',
                    status: 'active',
                    documentation: '/api/v1/docs'
                }
            ]
        },
        features: [
            'Multi-user & Multi-device support',
            'Session persistence & auto-reconnect',
            'Real-time QR code management',
            'All message types support (text, image, video, audio, document, location, contact)',
            'Contact scraping & management',
            'Auto-reply engine with intelligent rules',
            'Campaign & blast messaging system',
            'AI integration with 9 core features',
            'Webhook notifications',
            'Real-time analytics & reporting',
            'System monitoring & health checks'
        ],
        technology: {
            backend: 'Node.js + Express.js',
            whatsapp: 'Baileys Library',
            database: 'MySQL',
            cache: 'Redis',
            realtime: 'Socket.IO',
            queue: 'Bull Queue',
            ai: 'OpenAI Integration',
            process_manager: 'PM2'
        },
        status: 'Production Ready'
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

module.exports = router;