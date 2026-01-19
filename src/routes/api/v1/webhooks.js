const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const validation = require('../../../middleware/validation');
const WebhookController = require('../../../controllers/WebhookController');

// Webhook management routes
router.get('/', auth, WebhookController.getWebhooks);
router.post('/', auth, validation.validateWebhook, WebhookController.createWebhook);
router.get('/:id', auth, WebhookController.getWebhook);
router.put('/:id', auth, validation.validateWebhook, WebhookController.updateWebhook);
router.delete('/:id', auth, WebhookController.deleteWebhook);

// Webhook testing
router.post('/:id/test', auth, WebhookController.testWebhook);

// Webhook logs
router.get('/:id/logs', auth, WebhookController.getWebhookLogs);

// Webhook statistics
router.get('/:id/stats', auth, WebhookController.getWebhookStats);

module.exports = router;