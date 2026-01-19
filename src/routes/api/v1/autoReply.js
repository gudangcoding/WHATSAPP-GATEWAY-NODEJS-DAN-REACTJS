const express = require('express');
const { body, query, param } = require('express-validator');
const AutoReplyController = require('../../../controllers/AutoReplyController');
const auth = require('../../../middleware/auth');

const router = express.Router();
const autoReplyController = new AutoReplyController();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @swagger
 * components:
 *   schemas:
 *     AutoReply:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         device_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         name:
 *           type: string
 *         match_type:
 *           type: string
 *           enum: [exact, contains, starts_with, ends_with, regex]
 *         keywords:
 *           type: string
 *           description: Comma-separated keywords or regex pattern
 *         reply_type:
 *           type: string
 *           enum: [text, image, video, document, audio]
 *         reply_text:
 *           type: string
 *         reply_media_url:
 *           type: string
 *         reply_media_type:
 *           type: string
 *           enum: [image, video, document, audio]
 *         is_active:
 *           type: boolean
 *         priority:
 *           type: integer
 *           description: Lower number = higher priority
 *         cooldown_minutes:
 *           type: integer
 *           description: Minutes to wait before replying again to same number
 *         max_daily_replies:
 *           type: integer
 *           description: Maximum replies per day per number (0 = unlimited)
 *         is_group_enabled:
 *           type: boolean
 *           description: Whether to reply in group chats
 *         time_start:
 *           type: string
 *           format: time
 *           description: Start time for auto replies (HH:MM)
 *         time_end:
 *           type: string
 *           format: time
 *           description: End time for auto replies (HH:MM)
 *         delay_seconds:
 *           type: integer
 *           description: Delay before sending reply
 *         conditions:
 *           type: object
 *           description: Additional conditions for triggering
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     AutoReplyLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         auto_reply_id:
 *           type: integer
 *         device_id:
 *           type: integer
 *         trigger_message_id:
 *           type: integer
 *         from_number:
 *           type: string
 *         trigger_text:
 *           type: string
 *         reply_sent:
 *           type: boolean
 *         reply_job_id:
 *           type: string
 *         executed_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/auto-replies:
 *   post:
 *     summary: Create auto reply rule
 *     tags: [Auto Replies]
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
 *               - name
 *               - match_type
 *               - keywords
 *               - reply_type
 *             properties:
 *               device_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               match_type:
 *                 type: string
 *                 enum: [exact, contains, starts_with, ends_with, regex]
 *               keywords:
 *                 type: string
 *                 description: Comma-separated keywords or regex pattern
 *               reply_type:
 *                 type: string
 *                 enum: [text, image, video, document, audio]
 *               reply_text:
 *                 type: string
 *               reply_media_url:
 *                 type: string
 *               reply_media_type:
 *                 type: string
 *                 enum: [image, video, document, audio]
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               max_daily_replies:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               is_group_enabled:
 *                 type: boolean
 *                 default: false
 *               time_start:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               time_end:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               delay_seconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               conditions:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Auto reply rule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AutoReply'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('device_id').isInt().withMessage('Device ID must be an integer'),
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('match_type').isIn(['exact', 'contains', 'starts_with', 'ends_with', 'regex'])
    .withMessage('Invalid match type'),
  body('keywords').trim().isLength({ min: 1 }).withMessage('Keywords are required'),
  body('reply_type').isIn(['text', 'image', 'video', 'document', 'audio'])
    .withMessage('Invalid reply type'),
  body('reply_text').optional().isString(),
  body('reply_media_url').optional().isURL().withMessage('Invalid media URL'),
  body('reply_media_type').optional().isIn(['image', 'video', 'document', 'audio']),
  body('is_active').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
  body('cooldown_minutes').optional().isInt({ min: 0 }).withMessage('Cooldown must be non-negative'),
  body('max_daily_replies').optional().isInt({ min: 0 }).withMessage('Max daily replies must be non-negative'),
  body('is_group_enabled').optional().isBoolean(),
  body('time_start').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('time_end').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('delay_seconds').optional().isInt({ min: 0 }).withMessage('Delay must be non-negative'),
  body('conditions').optional().isObject(),
  body('metadata').optional().isObject()
], autoReplyController.createAutoReply.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies:
 *   get:
 *     summary: Get auto reply rules
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auto reply rules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AutoReply'
 *                 pagination:
 *                   type: object
 *                 filters:
 *                   type: object
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('device_id').optional().isInt(),
  query('is_active').optional().isBoolean(),
  query('search').optional().isString()
], autoReplyController.getAutoReplies.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/{autoReplyId}:
 *   get:
 *     summary: Get auto reply rule by ID
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoReplyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Auto reply rule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AutoReply'
 */
router.get('/:autoReplyId', [
  param('autoReplyId').isInt().withMessage('Auto reply ID must be an integer')
], autoReplyController.getAutoReplyById.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/{autoReplyId}:
 *   put:
 *     summary: Update auto reply rule
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoReplyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               match_type:
 *                 type: string
 *                 enum: [exact, contains, starts_with, ends_with, regex]
 *               keywords:
 *                 type: string
 *               reply_type:
 *                 type: string
 *                 enum: [text, image, video, document, audio]
 *               reply_text:
 *                 type: string
 *               reply_media_url:
 *                 type: string
 *               reply_media_type:
 *                 type: string
 *                 enum: [image, video, document, audio]
 *               is_active:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *               max_daily_replies:
 *                 type: integer
 *                 minimum: 0
 *               is_group_enabled:
 *                 type: boolean
 *               time_start:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               time_end:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               delay_seconds:
 *                 type: integer
 *                 minimum: 0
 *               conditions:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Auto reply rule updated successfully
 */
router.put('/:autoReplyId', [
  param('autoReplyId').isInt().withMessage('Auto reply ID must be an integer'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('match_type').optional().isIn(['exact', 'contains', 'starts_with', 'ends_with', 'regex'])
    .withMessage('Invalid match type'),
  body('keywords').optional().trim().isLength({ min: 1 }).withMessage('Keywords cannot be empty'),
  body('reply_type').optional().isIn(['text', 'image', 'video', 'document', 'audio'])
    .withMessage('Invalid reply type'),
  body('reply_text').optional().isString(),
  body('reply_media_url').optional().isURL().withMessage('Invalid media URL'),
  body('reply_media_type').optional().isIn(['image', 'video', 'document', 'audio']),
  body('is_active').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
  body('cooldown_minutes').optional().isInt({ min: 0 }).withMessage('Cooldown must be non-negative'),
  body('max_daily_replies').optional().isInt({ min: 0 }).withMessage('Max daily replies must be non-negative'),
  body('is_group_enabled').optional().isBoolean(),
  body('time_start').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('time_end').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('delay_seconds').optional().isInt({ min: 0 }).withMessage('Delay must be non-negative'),
  body('conditions').optional().isObject(),
  body('metadata').optional().isObject()
], autoReplyController.updateAutoReply.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/{autoReplyId}:
 *   delete:
 *     summary: Delete auto reply rule
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoReplyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Auto reply rule deleted successfully
 */
router.delete('/:autoReplyId', [
  param('autoReplyId').isInt().withMessage('Auto reply ID must be an integer')
], autoReplyController.deleteAutoReply.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/{autoReplyId}/toggle:
 *   post:
 *     summary: Toggle auto reply rule status
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoReplyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Auto reply status toggled successfully
 */
router.post('/:autoReplyId/toggle', [
  param('autoReplyId').isInt().withMessage('Auto reply ID must be an integer')
], autoReplyController.toggleAutoReplyStatus.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/priorities:
 *   put:
 *     summary: Update auto reply priorities
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priorities
 *             properties:
 *               priorities:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     priority:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       200:
 *         description: Priorities updated successfully
 */
router.put('/priorities', [
  body('priorities').isArray({ min: 1 }).withMessage('Priorities array is required'),
  body('priorities.*.id').isInt().withMessage('Each priority item must have a valid ID'),
  body('priorities.*.priority').isInt({ min: 1 }).withMessage('Each priority must be a positive integer')
], autoReplyController.updatePriorities.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/{autoReplyId}/duplicate:
 *   post:
 *     summary: Duplicate auto reply rule
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoReplyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the duplicated rule
 *     responses:
 *       201:
 *         description: Auto reply rule duplicated successfully
 */
router.post('/:autoReplyId/duplicate', [
  param('autoReplyId').isInt().withMessage('Auto reply ID must be an integer'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters')
], autoReplyController.duplicateAutoReply.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/{autoReplyId}/test:
 *   post:
 *     summary: Test auto reply rule
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autoReplyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Test message to check against the rule
 *     responses:
 *       200:
 *         description: Test result returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     matched:
 *                       type: boolean
 *                     rule:
 *                       type: object
 *                     testMessage:
 *                       type: string
 *                     testReply:
 *                       type: object
 */
router.post('/:autoReplyId/test', [
  param('autoReplyId').isInt().withMessage('Auto reply ID must be an integer'),
  body('message').trim().isLength({ min: 1 }).withMessage('Test message is required')
], autoReplyController.testAutoReply.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/statistics/{deviceId}:
 *   get:
 *     summary: Get auto reply statistics
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Auto reply statistics retrieved successfully
 */
router.get('/statistics/:deviceId', [
  param('deviceId').isInt().withMessage('Device ID must be an integer'),
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d'])
], autoReplyController.getAutoReplyStatistics.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/logs:
 *   get:
 *     summary: Get auto reply logs
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: auto_reply_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Auto reply logs retrieved successfully
 */
router.get('/logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('device_id').optional().isInt(),
  query('auto_reply_id').optional().isInt()
], autoReplyController.getAutoReplyLogs.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/templates:
 *   get:
 *     summary: Get auto reply templates
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto reply templates retrieved successfully
 */
router.get('/templates', autoReplyController.getAutoReplyTemplates.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/from-template:
 *   post:
 *     summary: Create auto reply from template
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template_id
 *               - device_id
 *             properties:
 *               template_id:
 *                 type: string
 *                 enum: [welcome, business_hours, away_message, price_inquiry, support_ticket]
 *               device_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               customizations:
 *                 type: object
 *                 description: Customizations to apply to the template
 *     responses:
 *       201:
 *         description: Auto reply created from template successfully
 */
router.post('/from-template', [
  body('template_id').isIn(['welcome', 'business_hours', 'away_message', 'price_inquiry', 'support_ticket'])
    .withMessage('Invalid template ID'),
  body('device_id').isInt().withMessage('Device ID must be an integer'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('customizations').optional().isObject()
], autoReplyController.createFromTemplate.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/export/{deviceId}:
 *   get:
 *     summary: Export auto reply rules
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Auto reply rules exported successfully
 */
router.get('/export/:deviceId', [
  param('deviceId').isInt().withMessage('Device ID must be an integer'),
  query('format').optional().isIn(['json', 'csv'])
], autoReplyController.exportAutoReplies.bind(autoReplyController));

/**
 * @swagger
 * /api/v1/auto-replies/import/{deviceId}:
 *   post:
 *     summary: Import auto reply rules
 *     tags: [Auto Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auto_replies
 *             properties:
 *               auto_replies:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AutoReply'
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Auto reply rules imported successfully
 */
router.post('/import/:deviceId', [
  param('deviceId').isInt().withMessage('Device ID must be an integer'),
  body('auto_replies').isArray({ min: 1 }).withMessage('Auto replies array is required'),
  body('overwrite').optional().isBoolean()
], autoReplyController.importAutoReplies.bind(autoReplyController));

module.exports = router;