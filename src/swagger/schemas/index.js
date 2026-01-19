/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         name:
 *           type: string
 *           description: User full name
 *           example: John Doe
 *         phone:
 *           type: string
 *           description: User phone number
 *           example: +1234567890
 *         role:
 *           type: string
 *           enum: [admin, user]
 *           description: User role
 *           example: user
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: User status
 *           example: active
 *         email_verified:
 *           type: boolean
 *           description: Email verification status
 *           example: true
 *         two_factor_enabled:
 *           type: boolean
 *           description: Two-factor authentication status
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 * 
 *     Device:
 *       type: object
 *       required:
 *         - name
 *         - phone_number
 *       properties:
 *         id:
 *           type: string
 *           description: Device ID
 *           example: device_123
 *         user_id:
 *           type: integer
 *           description: Owner user ID
 *           example: 1
 *         name:
 *           type: string
 *           description: Device name
 *           example: My WhatsApp Business
 *         phone_number:
 *           type: string
 *           description: WhatsApp phone number
 *           example: +1234567890
 *         status:
 *           type: string
 *           enum: [connected, disconnected, connecting, error]
 *           description: Device connection status
 *           example: connected
 *         qr_code:
 *           type: string
 *           description: QR code for device pairing
 *           example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
 *         last_seen:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *         webhook_url:
 *           type: string
 *           format: uri
 *           description: Webhook URL for notifications
 *           example: https://example.com/webhook
 *         settings:
 *           type: object
 *           description: Device configuration settings
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Device creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Device last update timestamp
 * 
 *     Session:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Session ID
 *           example: session_123
 *         device_id:
 *           type: string
 *           description: Associated device ID
 *           example: device_123
 *         status:
 *           type: string
 *           enum: [active, inactive, paused, error]
 *           description: Session status
 *           example: active
 *         connection_state:
 *           type: string
 *           enum: [open, connecting, close]
 *           description: WhatsApp connection state
 *           example: open
 *         qr_code:
 *           type: string
 *           description: Current QR code
 *         session_data:
 *           type: object
 *           description: Session authentication data
 *         last_activity:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Session creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Session last update timestamp
 * 
 *     Message:
 *       type: object
 *       required:
 *         - device_id
 *         - to
 *         - message_type
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           description: Message ID
 *           example: msg_123
 *         device_id:
 *           type: string
 *           description: Sender device ID
 *           example: device_123
 *         to:
 *           type: string
 *           description: Recipient phone number
 *           example: +1234567890
 *         from:
 *           type: string
 *           description: Sender phone number
 *           example: +0987654321
 *         message_type:
 *           type: string
 *           enum: [text, image, video, audio, document, location, contact]
 *           description: Type of message
 *           example: text
 *         content:
 *           type: object
 *           description: Message content based on type
 *           example:
 *             text: "Hello, World!"
 *         media_url:
 *           type: string
 *           format: uri
 *           description: Media file URL (for media messages)
 *         status:
 *           type: string
 *           enum: [pending, sent, delivered, read, failed]
 *           description: Message delivery status
 *           example: sent
 *         direction:
 *           type: string
 *           enum: [inbound, outbound]
 *           description: Message direction
 *           example: outbound
 *         whatsapp_message_id:
 *           type: string
 *           description: WhatsApp message ID
 *         error_message:
 *           type: string
 *           description: Error message if failed
 *         sent_at:
 *           type: string
 *           format: date-time
 *           description: Message sent timestamp
 *         delivered_at:
 *           type: string
 *           format: date-time
 *           description: Message delivered timestamp
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: Message read timestamp
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Message creation timestamp
 * 
 *     Contact:
 *       type: object
 *       required:
 *         - device_id
 *         - phone_number
 *       properties:
 *         id:
 *           type: integer
 *           description: Contact ID
 *           example: 1
 *         device_id:
 *           type: string
 *           description: Associated device ID
 *           example: device_123
 *         phone_number:
 *           type: string
 *           description: Contact phone number
 *           example: +1234567890
 *         name:
 *           type: string
 *           description: Contact name
 *           example: John Doe
 *         profile_picture:
 *           type: string
 *           format: uri
 *           description: Profile picture URL
 *         status:
 *           type: string
 *           description: WhatsApp status message
 *         is_business:
 *           type: boolean
 *           description: Business account indicator
 *           example: false
 *         is_group:
 *           type: boolean
 *           description: Group chat indicator
 *           example: false
 *         quality_score:
 *           type: number
 *           format: float
 *           description: Contact quality score (0-1)
 *           example: 0.85
 *         last_activity_at:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *         metadata:
 *           type: object
 *           description: Additional contact metadata
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Contact creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Contact last update timestamp
 * 
 *     AutoReplyRule:
 *       type: object
 *       required:
 *         - device_id
 *         - name
 *         - trigger_type
 *         - trigger_value
 *         - reply_message
 *       properties:
 *         id:
 *           type: integer
 *           description: Rule ID
 *           example: 1
 *         device_id:
 *           type: string
 *           description: Associated device ID
 *           example: device_123
 *         name:
 *           type: string
 *           description: Rule name
 *           example: Welcome Message
 *         trigger_type:
 *           type: string
 *           enum: [keyword, exact_match, contains, regex, time_based, contact_group]
 *           description: Trigger condition type
 *           example: keyword
 *         trigger_value:
 *           type: string
 *           description: Trigger condition value
 *           example: hello
 *         reply_message:
 *           type: string
 *           description: Auto-reply message content
 *           example: Hello! Thank you for contacting us.
 *         conditions:
 *           type: object
 *           description: Additional rule conditions
 *         actions:
 *           type: object
 *           description: Actions to perform
 *         priority:
 *           type: integer
 *           description: Rule priority (higher = more priority)
 *           example: 1
 *         is_active:
 *           type: boolean
 *           description: Rule active status
 *           example: true
 *         usage_count:
 *           type: integer
 *           description: Number of times rule was triggered
 *           example: 25
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Rule creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Rule last update timestamp
 * 
 *     Campaign:
 *       type: object
 *       required:
 *         - device_id
 *         - name
 *         - message_content
 *         - target_type
 *       properties:
 *         id:
 *           type: integer
 *           description: Campaign ID
 *           example: 1
 *         device_id:
 *           type: string
 *           description: Associated device ID
 *           example: device_123
 *         name:
 *           type: string
 *           description: Campaign name
 *           example: Product Launch Campaign
 *         description:
 *           type: string
 *           description: Campaign description
 *         message_content:
 *           type: object
 *           description: Message content and settings
 *         target_type:
 *           type: string
 *           enum: [all_contacts, contact_groups, custom_list, filtered_contacts]
 *           description: Target audience type
 *           example: contact_groups
 *         target_filters:
 *           type: object
 *           description: Target filtering criteria
 *         schedule_type:
 *           type: string
 *           enum: [immediate, scheduled, recurring]
 *           description: Campaign scheduling type
 *           example: scheduled
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *           description: Scheduled execution time
 *         status:
 *           type: string
 *           enum: [draft, scheduled, running, paused, completed, cancelled, failed]
 *           description: Campaign status
 *           example: draft
 *         progress:
 *           type: object
 *           description: Campaign execution progress
 *         statistics:
 *           type: object
 *           description: Campaign performance statistics
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Campaign creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Campaign last update timestamp
 * 
 *     Webhook:
 *       type: object
 *       required:
 *         - name
 *         - url
 *         - events
 *       properties:
 *         id:
 *           type: integer
 *           description: Webhook ID
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: Owner user ID
 *           example: 1
 *         name:
 *           type: string
 *           description: Webhook name
 *           example: Message Notifications
 *         url:
 *           type: string
 *           format: uri
 *           description: Webhook endpoint URL
 *           example: https://example.com/webhook
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: Events to listen for
 *           example: ["message.received", "message.sent"]
 *         secret:
 *           type: string
 *           description: Webhook secret for verification
 *         headers:
 *           type: object
 *           description: Custom headers to send
 *         retry_attempts:
 *           type: integer
 *           description: Number of retry attempts
 *           example: 3
 *         timeout:
 *           type: integer
 *           description: Request timeout in milliseconds
 *           example: 30000
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Webhook status
 *           example: active
 *         last_triggered_at:
 *           type: string
 *           format: date-time
 *           description: Last trigger timestamp
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Webhook creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Webhook last update timestamp
 * 
 *     AIRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [
 *             generate_variation,
 *             optimize_campaign_content,
 *             analyze_target_audience,
 *             generate_intelligent_auto_reply,
 *             analyze_message_sentiment,
 *             predict_campaign_performance,
 *             optimize_message_timing,
 *             generate_content_suggestions,
 *             translate_contextual,
 *             paraphrase_message,
 *             extract_keywords,
 *             generate_campaign_content
 *           ]
 *           description: AI operation type
 *           example: generate_variation
 *         originalText:
 *           type: string
 *           description: Original text for variation generation
 *           example: Hello, welcome to our store!
 *         variationCount:
 *           type: integer
 *           description: Number of variations to generate
 *           example: 3
 *         style:
 *           type: string
 *           enum: 
 *             - casual
 *             - professional
 *             - friendly
 *             - formal
 *           description: Writing style
 *           example: professional
 *         language:
 *           type: string
 *           description: Target language code
 *           example: id
 *         targetAudience:
 *           type: string
 *           description: Target audience description
 *           example: young professionals
 *         messageType:
 *           type: string
 *           description: Message type context
 *           example: promotional
 * 
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *           example: password123
 *         remember_me:
 *           type: boolean
 *           description: Remember login session
 *           example: false
 * 
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: User password (minimum 8 characters)
 *           example: password123
 *         name:
 *           type: string
 *           description: User full name
 *           example: John Doe
 *         phone:
 *           type: string
 *           description: User phone number
 *           example: +1234567890
 * 
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - device_id
 *         - to
 *         - message_type
 *         - content
 *       properties:
 *         device_id:
 *           type: string
 *           description: Sender device ID
 *           example: device_123
 *         to:
 *           type: string
 *           description: Recipient phone number
 *           example: +1234567890
 *         message_type:
 *           type: string
 *           enum: [text, image, video, audio, document, location, contact]
 *           description: Type of message
 *           example: text
 *         content:
 *           type: object
 *           description: Message content based on type
 *           example:
 *             text: "Hello, World!"
 *         schedule_at:
 *           type: string
 *           format: date-time
 *           description: Schedule message for later sending
 *         priority:
 *           type: string
 *           enum: [low, normal, high]
 *           description: Message priority
 *           example: normal
 */

module.exports = {};