const express = require('express');
const MessageController = require('../../../controllers/MessageController');
const auth = require('../../../middleware/auth');
const validation = require('../../../middleware/validation');
const rateLimiter = require('../../../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management endpoints
 */

/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     summary: Get messages for authenticated user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of messages per page
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, read, failed, cancelled]
 *         description: Filter by message status
 *       - in: query
 *         name: message_type
 *         schema:
 *           type: string
 *           enum: [text, image, video, audio, document, location, contact]
 *         description: Filter by message type
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', 
    rateLimiter.general,
    auth,
    validation.validatePagination,
    MessageController.getMessages
);

/**
 * @swagger
 * /api/v1/messages/{messageId}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *       404:
 *         description: Message not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:messageId', 
    rateLimiter.general,
    auth,
    validation.validateId('messageId'),
    MessageController.getMessage
);

/**
 * @swagger
 * /api/v1/messages/send:
 *   post:
 *     summary: Send single message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - to
 *               - message_type
 *               - content
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: Device ID to send from
 *               to:
 *                 type: string
 *                 pattern: '^\\+?[1-9]\\d{1,14}$'
 *                 description: Recipient phone number
 *               message_type:
 *                 type: string
 *                 enum: [text, image, video, audio, document, location, contact]
 *                 description: Type of message
 *               content:
 *                 type: object
 *                 description: Message content
 *               schedule_at:
 *                 type: string
 *                 format: date-time
 *                 description: Schedule message for later
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *                 default: normal
 *                 description: Message priority
 *     responses:
 *       201:
 *         description: Message queued successfully
 *       400:
 *         description: Validation error or device not connected
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send', 
    rateLimiter.sendMessage,
    auth,
    validation.validateSendMessage,
    MessageController.sendMessage
);

/**
 * @swagger
 * /api/v1/messages/bulk:
 *   post:
 *     summary: Send bulk messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - recipients
 *               - message_type
 *               - content
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: Device ID to send from
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^\\+?[1-9]\\d{1,14}$'
 *                 description: Array of recipient phone numbers
 *               message_type:
 *                 type: string
 *                 enum: [text, image, video, audio, document, location, contact]
 *                 description: Type of message
 *               content:
 *                 type: object
 *                 description: Message content
 *               schedule_at:
 *                 type: string
 *                 format: date-time
 *                 description: Schedule messages for later
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *                 default: normal
 *                 description: Message priority
 *     responses:
 *       201:
 *         description: Bulk messages queued successfully
 *       400:
 *         description: Validation error or device not connected
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/bulk', 
    rateLimiter.sendBulkMessage,
    auth,
    MessageController.sendBulkMessages
);

/**
 * @swagger
 * /api/v1/messages/{messageId}/cancel:
 *   post:
 *     summary: Cancel scheduled message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message cancelled successfully
 *       400:
 *         description: Cannot cancel message
 *       404:
 *         description: Message not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:messageId/cancel', 
    rateLimiter.general,
    auth,
    validation.validateId('messageId'),
    MessageController.cancelMessage
);

/**
 * @swagger
 * /api/v1/messages/{messageId}/retry:
 *   post:
 *     summary: Retry failed message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message retry queued successfully
 *       400:
 *         description: Cannot retry message or device not connected
 *       404:
 *         description: Message not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:messageId/retry', 
    rateLimiter.general,
    auth,
    validation.validateId('messageId'),
    MessageController.retryMessage
);

/**
 * @swagger
 * /api/v1/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 30d
 *         description: Statistics period
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *     responses:
 *       200:
 *         description: Message statistics retrieved successfully
 *       404:
 *         description: Device not found (if device_id provided)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', 
    rateLimiter.analytics,
    auth,
    MessageController.getMessageStats
);

module.exports = router;