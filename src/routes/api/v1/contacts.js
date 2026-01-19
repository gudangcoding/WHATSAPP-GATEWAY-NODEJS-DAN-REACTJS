const express = require('express');
const { body, param, query } = require('express-validator');
const ContactController = require('../../../controllers/ContactController');
const auth = require('../../../middleware/auth');
const rateLimiter = require('../../../middleware/rateLimiter');

const router = express.Router();
const contactController = new ContactController();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter.general);

/**
 * @swagger
 * /api/v1/contacts/scrape:
 *   post:
 *     summary: Start contact scraping
 *     tags: [Contacts]
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
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID to scrape contacts from
 *               sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [private_chats, group_members, contact_list, broadcast_lists]
 *                 default: [private_chats, group_members]
 *               options:
 *                 type: object
 *                 properties:
 *                   min_quality_score:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                   enrich_data:
 *                     type: boolean
 *                     default: false
 *                   include_inactive:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: Scraping started successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/scrape', [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  body('sources')
    .optional()
    .isArray()
    .withMessage('Sources must be an array'),
  body('sources.*')
    .optional()
    .isIn(['private_chats', 'group_members', 'contact_list', 'broadcast_lists'])
    .withMessage('Invalid source type'),
  body('options.min_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Quality score must be between 0 and 100'),
  body('options.enrich_data')
    .optional()
    .isBoolean()
    .withMessage('Enrich data must be boolean'),
  body('options.include_inactive')
    .optional()
    .isBoolean()
    .withMessage('Include inactive must be boolean')
], contactController.startScraping.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/scrape/status/{jobId}:
 *   get:
 *     summary: Get scraping job status
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scraping job ID
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/scrape/status/:jobId', [
  param('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
], contactController.getScrapingStatus.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts:
 *   get:
 *     summary: Get contacts with filtering and pagination
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
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
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or phone number
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [private_chat, group_member, contact_list, broadcast]
 *         description: Filter by contact source
 *       - in: query
 *         name: min_quality_score
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum quality score
 *       - in: query
 *         name: max_quality_score
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum quality score
 *       - in: query
 *         name: business_only
 *         schema:
 *           type: boolean
 *         description: Show only business contacts
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, name, quality_score]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: order_direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', [
  query('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('min_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Min quality score must be between 0 and 100'),
  query('max_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Max quality score must be between 0 and 100'),
  query('business_only')
    .optional()
    .isBoolean()
    .withMessage('Business only must be boolean'),
  query('order_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'name', 'quality_score'])
    .withMessage('Invalid order by field'),
  query('order_direction')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order direction must be ASC or DESC')
], contactController.getContacts.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/statistics/{deviceId}:
 *   get:
 *     summary: Get contact statistics
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/statistics/:deviceId', [
  param('deviceId')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer')
], contactController.getContactStatistics.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/groups:
 *   get:
 *     summary: Get groups with filtering and pagination
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
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
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by group name
 *       - in: query
 *         name: admin_only
 *         schema:
 *           type: boolean
 *         description: Show only admin groups
 *       - in: query
 *         name: min_members
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum member count
 *       - in: query
 *         name: max_members
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum member count
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/groups', [
  query('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('admin_only')
    .optional()
    .isBoolean()
    .withMessage('Admin only must be boolean'),
  query('min_members')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Min members must be a positive integer'),
  query('max_members')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max members must be a positive integer')
], contactController.getGroups.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/groups/statistics/{deviceId}:
 *   get:
 *     summary: Get group statistics
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Group statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/groups/statistics/:deviceId', [
  param('deviceId')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer')
], contactController.getGroupStatistics.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/enrich:
 *   post:
 *     summary: Enrich contacts with additional data
 *     tags: [Contacts]
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
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID
 *               contact_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Specific contact IDs to enrich (empty for all)
 *     responses:
 *       200:
 *         description: Enrichment started successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/enrich', [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  body('contact_ids')
    .optional()
    .isArray()
    .withMessage('Contact IDs must be an array'),
  body('contact_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each contact ID must be a positive integer')
], contactController.enrichContacts.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/cleanup-duplicates:
 *   post:
 *     summary: Cleanup duplicate contacts
 *     tags: [Contacts]
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
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID
 *     responses:
 *       200:
 *         description: Cleanup started successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cleanup-duplicates', [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer')
], contactController.cleanupDuplicates.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/export/{deviceId}:
 *   get:
 *     summary: Export contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [private_chat, group_member, contact_list, broadcast]
 *         description: Filter by contact source
 *       - in: query
 *         name: min_quality_score
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum quality score
 *     responses:
 *       200:
 *         description: Contacts exported successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/export/:deviceId', [
  param('deviceId')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('source')
    .optional()
    .isIn(['private_chat', 'group_member', 'contact_list', 'broadcast'])
    .withMessage('Invalid source type'),
  query('min_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Min quality score must be between 0 and 100')
], contactController.exportContacts.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/groups/export/{deviceId}:
 *   get:
 *     summary: Export groups
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Groups exported successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/groups/export/:deviceId', [
  param('deviceId')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv')
], contactController.exportGroups.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/targeting:
 *   post:
 *     summary: Get contacts for campaign targeting
 *     tags: [Contacts]
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
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID
 *               targeting_options:
 *                 type: object
 *                 properties:
 *                   sources:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [private_chat, group_member, contact_list, broadcast]
 *                   min_quality_score:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                   max_quality_score:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                   include_business:
 *                     type: boolean
 *                     default: true
 *                   exclude_numbers:
 *                     type: array
 *                     items:
 *                       type: string
 *                   limit:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10000
 *                     default: 1000
 *     responses:
 *       200:
 *         description: Contacts for targeting retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/targeting', [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  body('targeting_options.sources')
    .optional()
    .isArray()
    .withMessage('Sources must be an array'),
  body('targeting_options.sources.*')
    .optional()
    .isIn(['private_chat', 'group_member', 'contact_list', 'broadcast'])
    .withMessage('Invalid source type'),
  body('targeting_options.min_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Min quality score must be between 0 and 100'),
  body('targeting_options.max_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Max quality score must be between 0 and 100'),
  body('targeting_options.include_business')
    .optional()
    .isBoolean()
    .withMessage('Include business must be boolean'),
  body('targeting_options.exclude_numbers')
    .optional()
    .isArray()
    .withMessage('Exclude numbers must be an array'),
  body('targeting_options.limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000')
], contactController.getContactsForCampaign.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/groups/targeting:
 *   post:
 *     summary: Get groups for campaign targeting
 *     tags: [Contacts]
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
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID
 *               targeting_options:
 *                 type: object
 *                 properties:
 *                   min_members:
 *                     type: integer
 *                     minimum: 1
 *                     default: 1
 *                   max_members:
 *                     type: integer
 *                     minimum: 1
 *                     default: 1000
 *                   admin_only:
 *                     type: boolean
 *                     default: false
 *                   exclude_group_ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                   limit:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 1000
 *                     default: 50
 *     responses:
 *       200:
 *         description: Groups for targeting retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/groups/targeting', [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  body('targeting_options.min_members')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Min members must be a positive integer'),
  body('targeting_options.max_members')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max members must be a positive integer'),
  body('targeting_options.admin_only')
    .optional()
    .isBoolean()
    .withMessage('Admin only must be boolean'),
  body('targeting_options.exclude_group_ids')
    .optional()
    .isArray()
    .withMessage('Exclude group IDs must be an array'),
  body('targeting_options.limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
], contactController.getGroupsForCampaign.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/schedule-scraping:
 *   post:
 *     summary: Schedule automatic contact scraping
 *     tags: [Contacts]
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
 *               - schedule
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID
 *               schedule:
 *                 type: string
 *                 description: Cron pattern for scheduling
 *                 example: "0 2 * * *"
 *               options:
 *                 type: object
 *                 properties:
 *                   sources:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [private_chats, group_members, contact_list, broadcast_lists]
 *                   min_quality_score:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                   enrich_data:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: Auto scraping scheduled successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/schedule-scraping', [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  body('schedule')
    .notEmpty()
    .withMessage('Schedule (cron pattern) is required'),
  body('options.sources')
    .optional()
    .isArray()
    .withMessage('Sources must be an array'),
  body('options.sources.*')
    .optional()
    .isIn(['private_chats', 'group_members', 'contact_list', 'broadcast_lists'])
    .withMessage('Invalid source type'),
  body('options.min_quality_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Quality score must be between 0 and 100'),
  body('options.enrich_data')
    .optional()
    .isBoolean()
    .withMessage('Enrich data must be boolean')
], contactController.scheduleAutoScraping.bind(contactController));

/**
 * @swagger
 * /api/v1/contacts/{contactId}:
 *   get:
 *     summary: Get contact by ID
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *       - in: query
 *         name: device_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Contact retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *             properties:
 *               device_id:
 *                 type: integer
 *                 description: Device ID
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Contact name
 *               status:
 *                 type: string
 *                 maxLength: 255
 *                 description: Contact status
 *               profile_picture:
 *                 type: string
 *                 description: Profile picture URL
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *       - in: query
 *         name: device_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.get('/:contactId', [
  param('contactId')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
  query('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer')
], contactController.getContactById.bind(contactController));

router.put('/:contactId', [
  param('contactId')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer'),
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('status')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Status must not exceed 255 characters'),
  body('profile_picture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')
], contactController.updateContact.bind(contactController));

router.delete('/:contactId', [
  param('contactId')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
  query('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID must be a positive integer')
], contactController.deleteContact.bind(contactController));

module.exports = router;