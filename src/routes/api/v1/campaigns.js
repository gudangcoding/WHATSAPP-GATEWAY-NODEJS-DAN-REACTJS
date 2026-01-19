const express = require('express');
const { body, query, param } = require('express-validator');
const CampaignController = require('../../../controllers/CampaignController');
const auth = require('../../../middleware/auth');

const router = express.Router();
const campaignController = new CampaignController();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
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
 *         description:
 *           type: string
 *         message_type:
 *           type: string
 *           enum: [text, image, video, document, audio, location, contact, list]
 *         message_content:
 *           type: object
 *           description: Message content based on message type
 *         media_url:
 *           type: string
 *         media_type:
 *           type: string
 *           enum: [image, video, document, audio]
 *         target_type:
 *           type: string
 *           enum: [contacts, groups, numbers, mixed, filtered]
 *         target_filters:
 *           type: object
 *           description: Filters for target selection
 *         schedule_type:
 *           type: string
 *           enum: [immediate, scheduled, recurring]
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *         recurring_pattern:
 *           type: object
 *           description: Recurring schedule pattern
 *         delay_min:
 *           type: integer
 *           description: Minimum delay between messages (seconds)
 *         delay_max:
 *           type: integer
 *           description: Maximum delay between messages (seconds)
 *         randomize_delay:
 *           type: boolean
 *           description: Whether to randomize delays
 *         ai_variation:
 *           type: boolean
 *           description: Whether to use AI message variations
 *         status:
 *           type: string
 *           enum: [draft, scheduled, running, paused, completed, cancelled, failed]
 *         total_targets:
 *           type: integer
 *         sent_count:
 *           type: integer
 *         delivered_count:
 *           type: integer
 *         read_count:
 *           type: integer
 *         failed_count:
 *           type: integer
 *         started_at:
 *           type: string
 *           format: date-time
 *         completed_at:
 *           type: string
 *           format: date-time
 *         cancelled_at:
 *           type: string
 *           format: date-time
 *         failed_at:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     CampaignTarget:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         campaign_id:
 *           type: integer
 *         target_number:
 *           type: string
 *         target_name:
 *           type: string
 *         target_type:
 *           type: string
 *           enum: [contact, group, number]
 *         status:
 *           type: string
 *           enum: [queued, sending, sent, delivered, read, failed, skipped]
 *         message_id:
 *           type: string
 *         job_id:
 *           type: string
 *         sending_at:
 *           type: string
 *           format: date-time
 *         sent_at:
 *           type: string
 *           format: date-time
 *         delivered_at:
 *           type: string
 *           format: date-time
 *         read_at:
 *           type: string
 *           format: date-time
 *         failed_at:
 *           type: string
 *           format: date-time
 *         error_message:
 *           type: string
 *         retry_count:
 *           type: integer
 *         max_retries:
 *           type: integer
 *         metadata:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/campaigns:
 *   post:
 *     summary: Create campaign
 *     tags: [Campaigns]
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
 *               - message_type
 *               - message_content
 *               - target_type
 *             properties:
 *               device_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               message_type:
 *                 type: string
 *                 enum: [text, image, video, document, audio, location, contact, list]
 *               message_content:
 *                 type: object
 *                 description: Message content based on message type
 *               media_url:
 *                 type: string
 *               media_type:
 *                 type: string
 *                 enum: [image, video, document, audio]
 *               target_type:
 *                 type: string
 *                 enum: [contacts, groups, numbers, mixed, filtered]
 *               target_filters:
 *                 type: object
 *               schedule_type:
 *                 type: string
 *                 enum: [immediate, scheduled, recurring]
 *                 default: immediate
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               recurring_pattern:
 *                 type: object
 *               delay_min:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               delay_max:
 *                 type: integer
 *                 minimum: 1
 *                 default: 5
 *               randomize_delay:
 *                 type: boolean
 *                 default: true
 *               ai_variation:
 *                 type: boolean
 *                 default: false
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled]
 *                 default: draft
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Campaign'
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
  body('description').optional().isString(),
  body('message_type').isIn(['text', 'image', 'video', 'document', 'audio', 'location', 'contact', 'list'])
    .withMessage('Invalid message type'),
  body('message_content').notEmpty().withMessage('Message content is required'),
  body('media_url').optional().isURL().withMessage('Invalid media URL'),
  body('media_type').optional().isIn(['image', 'video', 'document', 'audio']),
  body('target_type').isIn(['contacts', 'groups', 'numbers', 'mixed', 'filtered'])
    .withMessage('Invalid target type'),
  body('target_filters').optional().isObject(),
  body('schedule_type').optional().isIn(['immediate', 'scheduled', 'recurring']),
  body('scheduled_at').optional().isISO8601().withMessage('Invalid scheduled time format'),
  body('recurring_pattern').optional().isObject(),
  body('delay_min').optional().isInt({ min: 1 }).withMessage('Minimum delay must be positive'),
  body('delay_max').optional().isInt({ min: 1 }).withMessage('Maximum delay must be positive'),
  body('randomize_delay').optional().isBoolean(),
  body('ai_variation').optional().isBoolean(),
  body('status').optional().isIn(['draft', 'scheduled']),
  body('metadata').optional().isObject()
], campaignController.createCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns:
 *   get:
 *     summary: Get campaigns
 *     tags: [Campaigns]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, running, paused, completed, cancelled, failed]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
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
 *                     $ref: '#/components/schemas/Campaign'
 *                 pagination:
 *                   type: object
 *                 filters:
 *                   type: object
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('device_id').optional().isInt(),
  query('status').optional().isIn(['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'failed']),
  query('search').optional().isString()
], campaignController.getCampaigns.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Campaign'
 */
router.get('/:campaignId', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer')
], campaignController.getCampaignById.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
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
 *               description:
 *                 type: string
 *               message_type:
 *                 type: string
 *                 enum: [text, image, video, document, audio, location, contact, list]
 *               message_content:
 *                 type: object
 *               media_url:
 *                 type: string
 *               media_type:
 *                 type: string
 *                 enum: [image, video, document, audio]
 *               target_type:
 *                 type: string
 *                 enum: [contacts, groups, numbers, mixed, filtered]
 *               target_filters:
 *                 type: object
 *               schedule_type:
 *                 type: string
 *                 enum: [immediate, scheduled, recurring]
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               recurring_pattern:
 *                 type: object
 *               delay_min:
 *                 type: integer
 *                 minimum: 1
 *               delay_max:
 *                 type: integer
 *                 minimum: 1
 *               randomize_delay:
 *                 type: boolean
 *               ai_variation:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 */
router.put('/:campaignId', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('description').optional().isString(),
  body('message_type').optional().isIn(['text', 'image', 'video', 'document', 'audio', 'location', 'contact', 'list'])
    .withMessage('Invalid message type'),
  body('message_content').optional().notEmpty().withMessage('Message content cannot be empty'),
  body('media_url').optional().isURL().withMessage('Invalid media URL'),
  body('media_type').optional().isIn(['image', 'video', 'document', 'audio']),
  body('target_type').optional().isIn(['contacts', 'groups', 'numbers', 'mixed', 'filtered'])
    .withMessage('Invalid target type'),
  body('target_filters').optional().isObject(),
  body('schedule_type').optional().isIn(['immediate', 'scheduled', 'recurring']),
  body('scheduled_at').optional().isISO8601().withMessage('Invalid scheduled time format'),
  body('recurring_pattern').optional().isObject(),
  body('delay_min').optional().isInt({ min: 1 }).withMessage('Minimum delay must be positive'),
  body('delay_max').optional().isInt({ min: 1 }).withMessage('Maximum delay must be positive'),
  body('randomize_delay').optional().isBoolean(),
  body('ai_variation').optional().isBoolean(),
  body('metadata').optional().isObject()
], campaignController.updateCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 */
router.delete('/:campaignId', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer')
], campaignController.deleteCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/start:
 *   post:
 *     summary: Start campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign started successfully
 */
router.post('/:campaignId/start', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer')
], campaignController.startCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/stop:
 *   post:
 *     summary: Stop campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign stopped successfully
 */
router.post('/:campaignId/stop', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer')
], campaignController.stopCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/pause:
 *   post:
 *     summary: Pause campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign paused successfully
 */
router.post('/:campaignId/pause', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer')
], campaignController.pauseCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/resume:
 *   post:
 *     summary: Resume campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign resumed successfully
 */
router.post('/:campaignId/resume', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer')
], campaignController.resumeCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/schedule:
 *   post:
 *     summary: Schedule campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
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
 *               - scheduled_at
 *             properties:
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               timezone:
 *                 type: string
 *                 default: UTC
 *     responses:
 *       200:
 *         description: Campaign scheduled successfully
 */
router.post('/:campaignId/schedule', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  body('scheduled_at').isISO8601().withMessage('Invalid scheduled time format'),
  body('timezone').optional().isString()
], campaignController.scheduleCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/duplicate:
 *   post:
 *     summary: Duplicate campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
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
 *                 description: Name for the duplicated campaign
 *     responses:
 *       201:
 *         description: Campaign duplicated successfully
 */
router.post('/:campaignId/duplicate', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters')
], campaignController.duplicateCampaign.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/statistics/{deviceId}:
 *   get:
 *     summary: Get campaign statistics
 *     tags: [Campaigns]
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
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Campaign statistics retrieved successfully
 */
router.get('/statistics/:deviceId', [
  param('deviceId').isInt().withMessage('Device ID must be an integer'),
  query('timeframe').optional().isIn(['24h', '7d', '30d', '90d'])
], campaignController.getCampaignStatistics.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/targets:
 *   get:
 *     summary: Get campaign targets
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [queued, sending, sent, delivered, read, failed, skipped]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign targets retrieved successfully
 */
router.get('/:campaignId/targets', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('status').optional().isIn(['queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped']),
  query('search').optional().isString()
], campaignController.getCampaignTargets.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/templates:
 *   get:
 *     summary: Get campaign templates
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campaign templates retrieved successfully
 */
router.get('/templates', campaignController.getCampaignTemplates.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/from-template:
 *   post:
 *     summary: Create campaign from template
 *     tags: [Campaigns]
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
 *                 enum: [product_announcement, promotional_offer, event_invitation, order_confirmation, survey_feedback, appointment_reminder]
 *               device_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               customizations:
 *                 type: object
 *                 description: Customizations to apply to the template
 *     responses:
 *       201:
 *         description: Campaign created from template successfully
 */
router.post('/from-template', [
  body('template_id').isIn(['product_announcement', 'promotional_offer', 'event_invitation', 'order_confirmation', 'survey_feedback', 'appointment_reminder'])
    .withMessage('Invalid template ID'),
  body('device_id').isInt().withMessage('Device ID must be an integer'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('customizations').optional().isObject()
], campaignController.createFromTemplate.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/preview-targets:
 *   post:
 *     summary: Preview campaign targets
 *     tags: [Campaigns]
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
 *               - target_type
 *             properties:
 *               device_id:
 *                 type: integer
 *               target_type:
 *                 type: string
 *                 enum: [contacts, groups, numbers, mixed, filtered]
 *               target_filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Target preview retrieved successfully
 */
router.post('/preview-targets', [
  body('device_id').isInt().withMessage('Device ID must be an integer'),
  body('target_type').isIn(['contacts', 'groups', 'numbers', 'mixed', 'filtered'])
    .withMessage('Invalid target type'),
  body('target_filters').optional().isObject()
], campaignController.previewCampaignTargets.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/export:
 *   get:
 *     summary: Export campaign results
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
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
 *         description: Campaign results exported successfully
 */
router.get('/:campaignId/export', [
  param('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  query('format').optional().isIn(['json', 'csv'])
], campaignController.exportCampaignResults.bind(campaignController));

/**
 * @swagger
 * /api/v1/campaigns/dashboard/{deviceId}:
 *   get:
 *     summary: Get campaign dashboard
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign dashboard retrieved successfully
 */
router.get('/dashboard/:deviceId', [
  param('deviceId').isInt().withMessage('Device ID must be an integer')
], campaignController.getCampaignDashboard.bind(campaignController));

module.exports = router;