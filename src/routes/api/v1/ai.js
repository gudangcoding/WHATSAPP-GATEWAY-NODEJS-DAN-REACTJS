const express = require('express');
const { body, query, param } = require('express-validator');
const AIController = require('../../../controllers/AIController');
const auth = require('../../../middleware/auth');

const router = express.Router();
const aiController = new AIController();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @swagger
 * /api/v1/ai/generate/variation:
 *   post:
 *     summary: Generate text variations
 *     description: Generate multiple variations of a given text using AI
 *     tags: [AI Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalText
 *             properties:
 *               originalText:
 *                 type: string
 *                 description: Original text to generate variations from
 *                 example: "Hello, welcome to our store!"
 *               variationCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 3
 *                 description: Number of variations to generate
 *               style:
 *                 type: string
 *                 enum: 
 *                   - casual
 *                   - professional
 *                   - friendly
 *                   - formal
 *                 default: casual
 *                 description: Writing style for variations
 *               language:
 *                 type: string
 *                 default: id
 *                 description: Target language code
 *               targetAudience:
 *                 type: string
 *                 default: general
 *                 description: Target audience description
 *               messageType:
 *                 type: string
 *                 default: text
 *                 description: Message type context
 *     responses:
 *       200:
 *         description: Text variations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         originalText:
 *                           type: string
 *                         variations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               text:
 *                                 type: string
 *                               qualityScore:
 *                                 type: number
 *                                 format: float
 *                               style:
 *                                 type: string
 *                               language:
 *                                 type: string
 *                         metadata:
 *                           type: object
 *                           properties:
 *                             tokensUsed:
 *                               type: integer
 *                             style:
 *                               type: string
 *                             language:
 *                               type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/ai/analyze/sentiment:
 *   post:
 *     summary: Analyze message sentiment
 *     description: Analyze sentiment and emotional content of messages using AI
 *     tags: [AI Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of messages to analyze
 *                 example: ["I love this product!", "This is terrible service"]
 *               includeKeywords:
 *                 type: boolean
 *                 default: true
 *                 description: Include keyword extraction
 *               includeTopics:
 *                 type: boolean
 *                 default: true
 *                 description: Include topic analysis
 *               language:
 *                 type: string
 *                 default: id
 *                 description: Message language code
 *     responses:
 *       200:
 *         description: Sentiment analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         analysis:
 *                           type: object
 *                           properties:
 *                             individual:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   message:
 *                                     type: string
 *                                   sentiment:
 *                                     type: string
 *                                     enum: [positive, negative, neutral]
 *                                   confidence:
 *                                     type: number
 *                                     format: float
 *                                   emotions:
 *                                     type: array
 *                                     items:
 *                                       type: string
 *                                   keywords:
 *                                     type: array
 *                                     items:
 *                                       type: string
 *                                   topics:
 *                                     type: array
 *                                     items:
 *                                       type: string
 *                                   urgency:
 *                                     type: string
 *                                     enum: [low, medium, high]
 *                                   intent:
 *                                     type: string
 *                             overall:
 *                               type: object
 *                               properties:
 *                                 dominantSentiment:
 *                                   type: string
 *                                 keyTopics:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                             summary:
 *                               type: object
 *                               properties:
 *                                 totalMessages:
 *                                   type: integer
 *                                 averageConfidence:
 *                                   type: number
 *                                   format: float
 *                         tokensUsed:
 *                           type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/ai/usage:
 *   get:
 *     summary: Get AI usage statistics
 *     description: Retrieve AI usage statistics and token consumption
 *     tags: [AI Integration]
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Time period for statistics
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 7d
 *     responses:
 *       200:
 *         description: AI usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         period:
 *                           type: string
 *                         usage:
 *                           type: object
 *                           properties:
 *                             totalRequests:
 *                               type: integer
 *                             totalTokens:
 *                               type: integer
 *                             requestsByType:
 *                               type: object
 *                             averageTokensPerRequest:
 *                               type: number
 *                               format: float
 *                             estimatedCost:
 *                               type: number
 *                               format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *     
 *     AIStatistics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             timeframe:
 *               type: string
 *             total_requests:
 *               type: integer
 *             total_tokens:
 *               type: integer
 *             estimated_cost:
 *               type: number
 *             avg_tokens_per_request:
 *               type: number
 *         performance:
 *           type: object
 *         feature_usage:
 *           type: array
 *           items:
 *             type: object
 *         model_usage:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * /api/v1/ai/message-variations:
 *   post:
 *     summary: Generate message variations using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalMessage
 *             properties:
 *               originalMessage:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               variationCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 3
 *               style:
 *                 type: string
 *                 enum: 
 *                   - casual
 *                   - professional
 *                   - friendly
 *                   - formal
 *                   - persuasive
 *                 default: casual
 *               language:
 *                 type: string
 *                 enum: [id, en, ms]
 *                 default: id
 *               targetAudience:
 *                 type: string
 *                 enum: [general, customers, prospects, vip, youth, professional]
 *                 default: general
 *               messageType:
 *                 type: string
 *                 enum: [text, promotional, informational, transactional]
 *                 default: text
 *     responses:
 *       200:
 *         description: Message variation generation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AIJob'
 *                 message:
 *                   type: string
 */
router.post('/message-variations', [
  body('originalMessage').trim().isLength({ min: 1, max: 1000 }).withMessage('Original message must be 1-1000 characters'),
  body('variationCount').optional().isInt({ min: 1, max: 10 }).withMessage('Variation count must be 1-10'),
  body('style').optional().isIn(['casual', 'professional', 'friendly', 'formal', 'persuasive']),
  body('language').optional().isIn(['id', 'en', 'ms']),
  body('targetAudience').optional().isIn(['general', 'customers', 'prospects', 'vip', 'youth', 'professional']),
  body('messageType').optional().isIn(['text', 'promotional', 'informational', 'transactional'])
], aiController.generateMessageVariations.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/optimize-campaign:
 *   post:
 *     summary: Optimize campaign content using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - messageContent
 *               - targetType
 *             properties:
 *               campaignId:
 *                 type: integer
 *               messageContent:
 *                 type: object
 *               targetType:
 *                 type: string
 *                 enum: [contacts, groups, numbers, mixed, filtered]
 *               targetFilters:
 *                 type: object
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [engagement, conversion, awareness, retention]
 *                 default: [engagement, conversion]
 *               language:
 *                 type: string
 *                 enum: [id, en, ms]
 *                 default: id
 *     responses:
 *       200:
 *         description: Campaign optimization started
 */
router.post('/optimize-campaign', [
  body('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  body('messageContent').notEmpty().withMessage('Message content is required'),
  body('targetType').isIn(['contacts', 'groups', 'numbers', 'mixed', 'filtered']),
  body('targetFilters').optional().isObject(),
  body('goals').optional().isArray(),
  body('language').optional().isIn(['id', 'en', 'ms'])
], aiController.optimizeCampaignContent.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/analyze-audience:
 *   post:
 *     summary: Analyze target audience using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - targetType
 *             properties:
 *               deviceId:
 *                 type: integer
 *               targetType:
 *                 type: string
 *                 enum: [contacts, groups, numbers, mixed, filtered]
 *               targetFilters:
 *                 type: object
 *               analysisType:
 *                 type: string
 *                 enum: [basic, comprehensive, behavioral, demographic]
 *                 default: comprehensive
 *     responses:
 *       200:
 *         description: Target audience analysis started
 */
router.post('/analyze-audience', [
  body('deviceId').isInt().withMessage('Device ID must be an integer'),
  body('targetType').isIn(['contacts', 'groups', 'numbers', 'mixed', 'filtered']),
  body('targetFilters').optional().isObject(),
  body('analysisType').optional().isIn(['basic', 'comprehensive', 'behavioral', 'demographic'])
], aiController.analyzeTargetAudience.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/intelligent-auto-reply:
 *   post:
 *     summary: Generate intelligent auto reply using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - incomingMessage
 *             properties:
 *               deviceId:
 *                 type: integer
 *               incomingMessage:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               messageHistory:
 *                 type: array
 *                 items:
 *                   type: object
 *               contactInfo:
 *                 type: object
 *               businessContext:
 *                 type: string
 *                 maxLength: 500
 *               tone:
 *                 type: string
 *                 enum: [professional, friendly, casual, formal, helpful]
 *                 default: professional
 *               language:
 *                 type: string
 *                 enum: [id, en, ms]
 *                 default: id
 *     responses:
 *       200:
 *         description: Intelligent auto reply generation started
 */
router.post('/intelligent-auto-reply', [
  body('deviceId').isInt().withMessage('Device ID must be an integer'),
  body('incomingMessage').trim().isLength({ min: 1, max: 1000 }).withMessage('Incoming message must be 1-1000 characters'),
  body('messageHistory').optional().isArray(),
  body('contactInfo').optional().isObject(),
  body('businessContext').optional().isLength({ max: 500 }).withMessage('Business context must be max 500 characters'),
  body('tone').optional().isIn(['professional', 'friendly', 'casual', 'formal', 'helpful']),
  body('language').optional().isIn(['id', 'en', 'ms'])
], aiController.generateIntelligentAutoReply.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/analyze-sentiment:
 *   post:
 *     summary: Analyze message sentiment using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 50
 *               includeKeywords:
 *                 type: boolean
 *                 default: true
 *               includeTopics:
 *                 type: boolean
 *                 default: true
 *               language:
 *                 type: string
 *                 enum: [id, en, ms]
 *                 default: id
 *     responses:
 *       200:
 *         description: Message sentiment analysis started
 */
router.post('/analyze-sentiment', [
  body('messages').isArray({ min: 1, max: 50 }).withMessage('Messages must be an array of 1-50 items'),
  body('messages.*').trim().isLength({ min: 1 }).withMessage('Each message must not be empty'),
  body('includeKeywords').optional().isBoolean(),
  body('includeTopics').optional().isBoolean(),
  body('language').optional().isIn(['id', 'en', 'ms'])
], aiController.analyzeMessageSentiment.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/predict-performance:
 *   post:
 *     summary: Predict campaign performance using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - messageContent
 *               - targetCount
 *               - targetType
 *             properties:
 *               campaignId:
 *                 type: integer
 *               messageContent:
 *                 type: object
 *               targetCount:
 *                 type: integer
 *                 minimum: 1
 *               targetType:
 *                 type: string
 *                 enum: [contacts, groups, numbers, mixed, filtered]
 *               historicalData:
 *                 type: array
 *                 items:
 *                   type: object
 *               timeframe:
 *                 type: string
 *                 enum: [1h, 6h, 24h, 7d]
 *                 default: 24h
 *     responses:
 *       200:
 *         description: Campaign performance prediction started
 */
router.post('/predict-performance', [
  body('campaignId').isInt().withMessage('Campaign ID must be an integer'),
  body('messageContent').notEmpty().withMessage('Message content is required'),
  body('targetCount').isInt({ min: 1 }).withMessage('Target count must be a positive integer'),
  body('targetType').isIn(['contacts', 'groups', 'numbers', 'mixed', 'filtered']),
  body('historicalData').optional().isArray(),
  body('timeframe').optional().isIn(['1h', '6h', '24h', '7d'])
], aiController.predictCampaignPerformance.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/optimize-timing:
 *   post:
 *     summary: Optimize message timing using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - targetAudience
 *               - messageType
 *             properties:
 *               deviceId:
 *                 type: integer
 *               targetAudience:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, image, video, document, promotional, transactional]
 *               historicalEngagement:
 *                 type: array
 *                 items:
 *                   type: object
 *               timezone:
 *                 type: string
 *                 default: Asia/Jakarta
 *     responses:
 *       200:
 *         description: Message timing optimization started
 */
router.post('/optimize-timing', [
  body('deviceId').isInt().withMessage('Device ID must be an integer'),
  body('targetAudience').trim().isLength({ min: 1 }).withMessage('Target audience is required'),
  body('messageType').isIn(['text', 'image', 'video', 'document', 'promotional', 'transactional']),
  body('historicalEngagement').optional().isArray(),
  body('timezone').optional().isString()
], aiController.optimizeMessageTiming.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/content-suggestions:
 *   post:
 *     summary: Generate content suggestions using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               industry:
 *                 type: string
 *                 enum: [general, retail, healthcare, education, finance, technology, food, fashion, automotive, real_estate]
 *                 default: general
 *               targetAudience:
 *                 type: string
 *                 enum: [general, customers, prospects, vip, youth, professional, seniors]
 *                 default: general
 *               contentType:
 *                 type: string
 *                 enum: [promotional, educational, announcement, seasonal, event, product_launch]
 *                 default: promotional
 *               language:
 *                 type: string
 *                 enum: [id, en, ms]
 *                 default: id
 *               trends:
 *                 type: array
 *                 items:
 *                   type: string
 *               businessGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [awareness, engagement, conversion, retention, loyalty]
 *     responses:
 *       200:
 *         description: Content suggestions generation started
 */
router.post('/content-suggestions', [
  body('industry').optional().isIn(['general', 'retail', 'healthcare', 'education', 'finance', 'technology', 'food', 'fashion', 'automotive', 'real_estate']),
  body('targetAudience').optional().isIn(['general', 'customers', 'prospects', 'vip', 'youth', 'professional', 'seniors']),
  body('contentType').optional().isIn(['promotional', 'educational', 'announcement', 'seasonal', 'event', 'product_launch']),
  body('language').optional().isIn(['id', 'en', 'ms']),
  body('trends').optional().isArray(),
  body('businessGoals').optional().isArray()
], aiController.generateContentSuggestions.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/translate:
 *   post:
 *     summary: Translate message with context awareness
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - fromLanguage
 *               - toLanguage
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               fromLanguage:
 *                 type: string
 *                 enum: [id, en, ms, zh, ja, ko, th, vi, ar, es, fr, de, pt, ru]
 *               toLanguage:
 *                 type: string
 *                 enum: [id, en, ms, zh, ja, ko, th, vi, ar, es, fr, de, pt, ru]
 *               context:
 *                 type: string
 *                 maxLength: 200
 *               tone:
 *                 type: string
 *                 enum: [neutral, formal, casual, friendly, professional]
 *                 default: neutral
 *               preserveFormatting:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Translation started
 */
router.post('/translate', [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
  body('fromLanguage').isIn(['id', 'en', 'ms', 'zh', 'ja', 'ko', 'th', 'vi', 'ar', 'es', 'fr', 'de', 'pt', 'ru']),
  body('toLanguage').isIn(['id', 'en', 'ms', 'zh', 'ja', 'ko', 'th', 'vi', 'ar', 'es', 'fr', 'de', 'pt', 'ru']),
  body('context').optional().isLength({ max: 200 }).withMessage('Context must be max 200 characters'),
  body('tone').optional().isIn(['neutral', 'formal', 'casual', 'friendly', 'professional']),
  body('preserveFormatting').optional().isBoolean()
], aiController.translateMessage.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/statistics:
 *   get:
 *     summary: Get AI usage statistics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: AI usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AIStatistics'
 */
router.get('/statistics', [
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d', '90d'])
], aiController.getAIStatistics.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/jobs/{jobId}:
 *   get:
 *     summary: Get AI job status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AIJob'
 */
router.get('/jobs/:jobId', [
  param('jobId').notEmpty().withMessage('Job ID is required')
], aiController.getAIJobStatus.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/test-connection:
 *   get:
 *     summary: Test AI service connection
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI connection test result
 */
router.get('/test-connection', aiController.testAIConnection.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/recommendations:
 *   get:
 *     summary: Get AI feature recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignCount
 *         schema:
 *           type: integer
 *       - in: query
 *         name: messageCount
 *         schema:
 *           type: integer
 *       - in: query
 *         name: autoReplyCount
 *         schema:
 *           type: integer
 *       - in: query
 *         name: contactCount
 *         schema:
 *           type: integer
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI feature recommendations retrieved successfully
 */
router.get('/recommendations', [
  query('campaignCount').optional().isInt({ min: 0 }),
  query('messageCount').optional().isInt({ min: 0 }),
  query('autoReplyCount').optional().isInt({ min: 0 }),
  query('contactCount').optional().isInt({ min: 0 }),
  query('industry').optional().isString()
], aiController.getAIRecommendations.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/health:
 *   get:
 *     summary: Get AI service health status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service health status
 */
router.get('/health', aiController.getAIHealth.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/templates:
 *   get:
 *     summary: Get AI templates
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, message_variations, auto_reply, campaign_optimization, content_generation]
 *           default: all
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [id, en, ms]
 *           default: id
 *     responses:
 *       200:
 *         description: AI templates retrieved successfully
 */
router.get('/templates', [
  query('category').optional().isIn(['all', 'message_variations', 'auto_reply', 'campaign_optimization', 'content_generation']),
  query('language').optional().isIn(['id', 'en', 'ms'])
], aiController.getAITemplates.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/templates:
 *   post:
 *     summary: Create AI template
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - template
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 enum: [message_variations, auto_reply, campaign_optimization, content_generation]
 *               template:
 *                 type: object
 *               language:
 *                 type: string
 *                 enum: [id, en, ms]
 *                 default: id
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: AI template created successfully
 */
router.post('/templates', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('category').isIn(['message_variations', 'auto_reply', 'campaign_optimization', 'content_generation']),
  body('template').notEmpty().withMessage('Template is required'),
  body('language').optional().isIn(['id', 'en', 'ms']),
  body('tags').optional().isArray()
], aiController.createAITemplate.bind(aiController));

/**
 * @swagger
 * /api/v1/ai/insights:
 *   get:
 *     summary: Get AI insights dashboard
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 7d
 *     responses:
 *       200:
 *         description: AI insights retrieved successfully
 */
router.get('/insights', [
  query('timeframe').optional().isIn(['24h', '7d', '30d'])
], aiController.getAIInsights.bind(aiController));

module.exports = router;