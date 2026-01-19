const logger = require('../utils/logger');
const MessageRepository = require('../repositories/MessageRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const SocketManager = require('../core/SocketManager');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');

class MessageJob {
  constructor() {
    this.messageRepository = new MessageRepository();
    this.deviceRepository = new DeviceRepository();
    this.socketManager = SocketManager.getInstance();
    
    // Supported message types
    this.supportedTypes = [
      'text', 'image', 'video', 'document', 'audio', 
      'location', 'contact', 'list', 'sticker'
    ];
    
    // Media types that require processing
    this.mediaTypes = ['image', 'video', 'document', 'audio', 'sticker'];
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      mediaTimeout: 30000,
      maxFileSize: {
        image: 5 * 1024 * 1024,    // 5MB
        video: 16 * 1024 * 1024,   // 16MB
        document: 100 * 1024 * 1024, // 100MB
        audio: 16 * 1024 * 1024,   // 16MB
        sticker: 1 * 1024 * 1024   // 1MB
      }
    };
  }

  /**
   * Process message sending job
   */
  async process(data, job) {
    const { type, deviceId, userId } = data;
    
    logger.info(`MessageJob: Processing ${type} for device ${deviceId}`);
    
    try {
      switch (type) {
        case 'send_message':
          return await this.processSendMessage(data, job);
        case 'send_bulk':
          return await this.processSendBulk(data, job);
        case 'send_scheduled':
          return await this.processSendScheduled(data, job);
        case 'send_template':
          return await this.processSendTemplate(data, job);
        default:
          throw new Error(`Unknown message job type: ${type}`);
      }
    } catch (error) {
      logger.error(`MessageJob: Error processing ${type}:`, error);
      
      // Emit error event
      if (deviceId) {
        this.socketManager.emitToDevice(deviceId, 'message:error', {
          type: type,
          error: error.message,
          timestamp: new Date()
        });
      }
      
      throw error;
    }
  }

  /**
   * Process single message sending
   */
  async processSendMessage(data, job) {
    const { 
      deviceId, 
      to, 
      messageType, 
      content, 
      userId, 
      options = {},
      priority = 0
    } = data;
    
    // Validate message data
    const validation = await this.validateMessage({ 
      to, 
      type: messageType, 
      content 
    });
    
    if (!validation.isValid) {
      throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Get SessionManager instance
    const SessionManager = require('../core/SessionManager').getInstance();
    
    // Check if session is connected
    const sessionStatus = SessionManager.getSessionStatus(deviceId);
    if (!sessionStatus.connected) {
      throw new Error('Device session is not connected');
    }

    // Create message status tracker
    const statusTracker = new MessageStatusTracker(deviceId, userId);
    
    // Prepare message data for database
    const messageData = {
      device_id: deviceId,
      user_id: userId,
      to_number: this.extractPhoneNumber(to),
      type: messageType,
      content: this.serializeContent(content),
      direction: 'outgoing',
      is_group: to.includes('@g.us'),
      group_id: to.includes('@g.us') ? to : null,
      status: 'pending',
      priority: priority,
      metadata: {
        options: options,
        job_id: job.id
      }
    };

    // Save message to database
    const savedMessage = await this.messageRepository.create(messageData);
    statusTracker.setMessageId(savedMessage.id);
    
    // Emit queued event
    this.socketManager.emitToDevice(deviceId, 'message:queued', {
      messageId: savedMessage.id,
      jobId: job.id,
      to: this.extractPhoneNumber(to),
      type: messageType,
      timestamp: new Date()
    });

    try {
      // Update status to processing
      await statusTracker.updateStatus('processing');
      
      // Process media if needed
      let processedContent = content;
      if (this.mediaTypes.includes(messageType)) {
        processedContent = await this.processMediaContent(messageType, content);
      }
      
      // Format message for Baileys
      const baileyMessage = await this.formatMessageForBaileys(messageType, processedContent);
      
      // Send message through SessionManager
      const result = await SessionManager.sendMessage(deviceId, to, baileyMessage, options);
      
      // Update message with Baileys message ID and sent status
      await this.messageRepository.update(savedMessage.id, {
        message_id: result.key.id,
        status: 'sent',
        sent_at: new Date()
      });
      
      // Update status tracker
      await statusTracker.updateStatus('sent', {
        baileyMessageId: result.key.id,
        timestamp: new Date()
      });

      logger.info(`MessageJob: Message sent successfully for device ${deviceId}`);
      
      return {
        success: true,
        messageId: savedMessage.id,
        baileyMessageId: result.key.id,
        type: messageType,
        to: this.extractPhoneNumber(to)
      };

    } catch (error) {
      // Update message status to failed
      await this.messageRepository.update(savedMessage.id, {
        status: 'failed',
        failed_at: new Date(),
        error_message: error.message
      });

      // Update status tracker
      await statusTracker.updateStatus('failed', {
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Validate message data
   */
  async validateMessage(messageData) {
    const errors = [];
    const { to, type, content } = messageData;
    
    // Validate recipient
    if (!to || !this.isValidWhatsAppId(to)) {
      errors.push('Invalid recipient WhatsApp ID');
    }
    
    // Validate message type
    if (!this.supportedTypes.includes(type)) {
      errors.push(`Unsupported message type: ${type}`);
    }
    
    // Type-specific validation
    switch (type) {
      case 'text':
        if (!content.text || typeof content.text !== 'string') {
          errors.push('Text content is required');
        } else if (content.text.length > 4096) {
          errors.push('Text message cannot exceed 4096 characters');
        }
        break;
        
      case 'image':
        if (!content.image) {
          errors.push('Image content is required');
        }
        if (content.caption && content.caption.length > 1024) {
          errors.push('Image caption cannot exceed 1024 characters');
        }
        break;
        
      case 'video':
        if (!content.video) {
          errors.push('Video content is required');
        }
        if (content.caption && content.caption.length > 1024) {
          errors.push('Video caption cannot exceed 1024 characters');
        }
        break;
        
      case 'document':
        if (!content.document) {
          errors.push('Document content is required');
        }
        if (!content.fileName) {
          errors.push('Document filename is required');
        }
        break;
        
      case 'audio':
        if (!content.audio) {
          errors.push('Audio content is required');
        }
        break;
        
      case 'location':
        const { location } = content;
        if (!location || !location.degreesLatitude || !location.degreesLongitude) {
          errors.push('Location coordinates are required');
        }
        if (!this.isValidLatitude(location.degreesLatitude)) {
          errors.push('Invalid latitude');
        }
        if (!this.isValidLongitude(location.degreesLongitude)) {
          errors.push('Invalid longitude');
        }
        break;
        
      case 'contact':
        if (!content.contacts || !content.contacts.displayName) {
          errors.push('Contact display name is required');
        }
        if (!content.contacts.contacts || !Array.isArray(content.contacts.contacts)) {
          errors.push('Contact vCard data is required');
        }
        break;
        
      case 'list':
        if (!content.text || !content.buttonText || !content.sections) {
          errors.push('List message requires text, buttonText, and sections');
        }
        if (!Array.isArray(content.sections) || content.sections.length === 0) {
          errors.push('List sections must be a non-empty array');
        }
        break;
        
      case 'sticker':
        if (!content.sticker) {
          errors.push('Sticker content is required');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Process media content (download, validate, optimize)
   */
  async processMediaContent(messageType, content) {
    const mediaKey = messageType === 'sticker' ? 'sticker' : messageType;
    const mediaData = content[mediaKey];
    
    if (!mediaData) {
      throw new Error(`No ${mediaKey} data provided`);
    }
    
    let mediaBuffer;
    let originalSize = 0;
    
    try {
      // Handle different media sources
      if (mediaData.url) {
        // Download from URL
        const response = await axios.get(mediaData.url, {
          responseType: 'arraybuffer',
          timeout: this.config.mediaTimeout,
          maxContentLength: this.config.maxFileSize[messageType] || 50 * 1024 * 1024
        });
        
        mediaBuffer = Buffer.from(response.data);
        originalSize = mediaBuffer.length;
        
      } else if (mediaData.path) {
        // Read from file path
        const stats = await fs.stat(mediaData.path);
        originalSize = stats.size;
        
        if (originalSize > this.config.maxFileSize[messageType]) {
          throw new Error(`File too large: ${originalSize} bytes (max: ${this.config.maxFileSize[messageType]})`);
        }
        
        mediaBuffer = await fs.readFile(mediaData.path);
        
      } else if (mediaData.buffer || Buffer.isBuffer(mediaData)) {
        // Already a buffer
        mediaBuffer = Buffer.isBuffer(mediaData) ? mediaData : mediaData.buffer;
        originalSize = mediaBuffer.length;
        
      } else {
        throw new Error(`Invalid media source for ${messageType}`);
      }
      
      // Validate file size
      if (originalSize > this.config.maxFileSize[messageType]) {
        throw new Error(`File too large: ${originalSize} bytes (max: ${this.config.maxFileSize[messageType]})`);
      }
      
      // Validate media type
      const detectedMimeType = this.detectMimeType(mediaBuffer);
      if (!this.isValidMimeType(messageType, detectedMimeType)) {
        logger.warn(`Unexpected MIME type for ${messageType}: ${detectedMimeType}`);
      }
      
      // Optimize media if needed
      const optimizedBuffer = await this.optimizeMedia(messageType, mediaBuffer);
      
      logger.info(`MessageJob: Processed ${messageType} media - Original: ${originalSize} bytes, Final: ${optimizedBuffer.length} bytes`);
      
      return {
        ...content,
        [mediaKey]: optimizedBuffer
      };
      
    } catch (error) {
      logger.error(`MessageJob: Error processing ${messageType} media:`, error);
      throw new Error(`Failed to process ${messageType}: ${error.message}`);
    }
  }

  /**
   * Format message for Baileys
   */
  async formatMessageForBaileys(messageType, content) {
    switch (messageType) {
      case 'text':
        return { text: content.text };
        
      case 'image':
        return {
          image: content.image,
          caption: content.caption || ''
        };
        
      case 'video':
        return {
          video: content.video,
          caption: content.caption || '',
          gifPlayback: content.gifPlayback || false
        };
        
      case 'document':
        return {
          document: content.document,
          fileName: content.fileName,
          mimetype: content.mimetype || this.detectMimeType(content.document)
        };
        
      case 'audio':
        return {
          audio: content.audio,
          mimetype: content.mimetype || 'audio/mp4',
          ptt: content.ptt || false
        };
        
      case 'location':
        return {
          location: content.location
        };
        
      case 'contact':
        return {
          contacts: content.contacts
        };
        
      case 'list':
        return {
          text: content.text,
          buttonText: content.buttonText,
          sections: content.sections
        };
        
      case 'sticker':
        return {
          sticker: content.sticker
        };
        
      default:
        throw new Error(`Unsupported message type for Baileys: ${messageType}`);
    }
  }

  /**
   * Process bulk message sending
   */
  async processSendBulk(data, job) {
    const { 
      deviceId, 
      messages, 
      userId, 
      options = {} 
    } = data;
    
    const {
      delay = 1000,
      randomDelay = false,
      stopOnError = false,
      maxConcurrent = 1
    } = options;
    
    const results = [];
    const total = messages.length;
    
    // Emit bulk started event
    this.socketManager.emitToDevice(deviceId, 'message:bulk_started', {
      bulkId: job.id,
      total: total,
      timestamp: new Date()
    });
    
    try {
      if (maxConcurrent === 1) {
        // Sequential processing
        for (let i = 0; i < messages.length; i++) {
          const messageData = messages[i];
          
          try {
            // Add delay between messages
            if (i > 0) {
              const actualDelay = randomDelay 
                ? delay + Math.random() * delay 
                : delay;
              await this.sleep(actualDelay);
            }

            const result = await this.processSendMessage({
              deviceId,
              userId,
              type: 'send_message',
              ...messageData
            }, job);
            
            results.push({
              index: i,
              success: true,
              result: result
            });
            
          } catch (error) {
            results.push({
              index: i,
              success: false,
              error: error.message,
              messageData: messageData
            });
            
            logger.error(`MessageJob: Bulk message ${i} failed:`, error);
            
            if (stopOnError) {
              break;
            }
          }
          
          // Update progress
          const progress = Math.round(((i + 1) / total) * 100);
          job.progress(progress);
          
          // Emit progress event
          const successCount = results.filter(r => r.success).length;
          const failureCount = results.filter(r => !r.success).length;
          
          this.socketManager.emitToDevice(deviceId, 'message:bulk_progress', {
            bulkId: job.id,
            total: total,
            processed: i + 1,
            successful: successCount,
            failed: failureCount,
            remaining: total - (i + 1),
            percentage: progress,
            timestamp: new Date()
          });
        }
      } else {
        // Concurrent processing with batching
        const batches = this.chunkArray(messages, maxConcurrent);
        let processedCount = 0;
        
        for (const batch of batches) {
          const batchPromises = batch.map(async (messageData, batchIndex) => {
            const globalIndex = processedCount + batchIndex;
            
            try {
              const result = await this.processSendMessage({
                deviceId,
                userId,
                type: 'send_message',
                ...messageData
              }, job);
              
              return {
                index: globalIndex,
                success: true,
                result: result
              };
              
            } catch (error) {
              return {
                index: globalIndex,
                success: false,
                error: error.message,
                messageData: messageData
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
          processedCount += batch.length;
          
          // Update progress
          const progress = Math.round((processedCount / total) * 100);
          job.progress(progress);
          
          // Add delay between batches
          if (processedCount < total) {
            await this.sleep(delay);
          }
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Emit completion event
      this.socketManager.emitToDevice(deviceId, 'message:bulk_completed', {
        bulkId: job.id,
        total: total,
        successful: successCount,
        failed: failureCount,
        results: results,
        timestamp: new Date()
      });

      logger.info(`MessageJob: Bulk sending completed. Total: ${total}, Success: ${successCount}, Failed: ${failureCount}`);

      return {
        success: true,
        total: total,
        successful: successCount,
        failed: failureCount,
        results: results
      };
      
    } catch (error) {
      // Emit bulk error event
      this.socketManager.emitToDevice(deviceId, 'message:bulk_error', {
        bulkId: job.id,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Process scheduled message sending
   */
  async processSendScheduled(data, job) {
    // Scheduled messages are processed as regular messages when their time comes
    return await this.processSendMessage({
      ...data,
      type: 'send_message'
    }, job);
  }

  /**
   * Process template message sending
   */
  async processSendTemplate(data, job) {
    const { templateId, variables = {}, ...messageData } = data;
    
    // Load template
    const MessageTemplateRepository = require('../repositories/MessageTemplateRepository');
    const templateRepository = new MessageTemplateRepository();
    const template = await templateRepository.findById(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Render template with variables
    const renderedMessage = this.renderTemplate(template, variables);
    
    // Send rendered message
    return await this.processSendMessage({
      ...messageData,
      messageType: renderedMessage.type,
      content: renderedMessage.content,
      type: 'send_message'
    }, job);
  }

  /**
   * Render message template
   */
  renderTemplate(template, variables) {
    let renderedContent = JSON.parse(JSON.stringify(template.content));
    
    // Replace variables in text content
    if (renderedContent.text) {
      renderedContent.text = this.replaceVariables(renderedContent.text, variables);
    }
    
    // Replace variables in caption
    if (renderedContent.caption) {
      renderedContent.caption = this.replaceVariables(renderedContent.caption, variables);
    }
    
    return {
      type: template.type,
      content: renderedContent
    };
  }

  /**
   * Replace template variables
   */
  replaceVariables(text, variables) {
    let result = text;
    
    // Replace {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(pattern, value);
    }
    
    return result;
  }

  /**
   * Utility methods
   */
  extractPhoneNumber(whatsappId) {
    return whatsappId.split('@')[0];
  }

  isValidWhatsAppId(id) {
    return /^(\d{10,15})@(s\.whatsapp\.net|g\.us)$/.test(id);
  }

  isValidLatitude(lat) {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
  }

  isValidLongitude(lng) {
    return typeof lng === 'number' && lng >= -180 && lng <= 180;
  }

  detectMimeType(buffer) {
    // Simple MIME type detection based on file signature
    const signature = buffer.toString('hex', 0, 4).toUpperCase();
    
    switch (signature) {
      case '89504E47': return 'image/png';
      case 'FFD8FFE0':
      case 'FFD8FFE1':
      case 'FFD8FFE2': return 'image/jpeg';
      case '47494638': return 'image/gif';
      case '52494646': return 'image/webp';
      case '25504446': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  isValidMimeType(messageType, mimeType) {
    const validTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'],
      audio: ['audio/mp3', 'audio/mp4', 'audio/wav', 'audio/ogg'],
      document: ['application/pdf', 'application/msword', 'text/plain'],
      sticker: ['image/webp']
    };
    
    return validTypes[messageType]?.includes(mimeType) || false;
  }

  async optimizeMedia(messageType, buffer) {
    // Basic optimization - in production, use proper image/video processing libraries
    if (messageType === 'image' && buffer.length > 2 * 1024 * 1024) {
      // For images larger than 2MB, we could compress them
      // This is a placeholder - implement actual compression
      logger.info('MessageJob: Image optimization would be applied here');
    }
    
    return buffer;
  }

  serializeContent(content) {
    // Convert content to string for database storage
    if (typeof content === 'string') {
      return content;
    }
    
    // For media content, store metadata only (not the actual buffer)
    const serialized = { ...content };
    
    // Remove buffer data for storage
    for (const key of ['image', 'video', 'document', 'audio', 'sticker']) {
      if (serialized[key] && Buffer.isBuffer(serialized[key])) {
        serialized[key] = {
          type: 'buffer',
          size: serialized[key].length,
          processed: true
        };
      }
    }
    
    return JSON.stringify(serialized);
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Message Status Tracker Class
 */
class MessageStatusTracker {
  constructor(deviceId, userId) {
    this.deviceId = deviceId;
    this.userId = userId;
    this.messageId = null;
    this.socketManager = SocketManager.getInstance();
  }

  setMessageId(messageId) {
    this.messageId = messageId;
  }

  async updateStatus(status, metadata = {}) {
    if (!this.messageId) {
      throw new Error('Message ID not set');
    }

    const timestamp = new Date();
    
    // Update database
    await this.updateDatabase(status, timestamp, metadata);
    
    // Emit real-time event
    await this.emitStatusUpdate(status, timestamp, metadata);
    
    // Trigger webhooks if configured
    await this.triggerWebhooks(status, timestamp, metadata);
  }

  async updateDatabase(status, timestamp, metadata) {
    const MessageRepository = require('../repositories/MessageRepository');
    const messageRepository = new MessageRepository();
    
    const updateData = {
      status: status,
      updated_at: timestamp
    };
    
    // Add timestamp fields based on status
    if (status === 'processing') updateData.processing_at = timestamp;
    if (status === 'sent') updateData.sent_at = timestamp;
    if (status === 'delivered') updateData.delivered_at = timestamp;
    if (status === 'read') updateData.read_at = timestamp;
    if (status === 'failed') {
      updateData.failed_at = timestamp;
      updateData.error_message = metadata.error || null;
    }
    
    await messageRepository.update(this.messageId, updateData);
  }

  async emitStatusUpdate(status, timestamp, metadata) {
    this.socketManager.emitToDevice(this.deviceId, `message:${status}`, {
      messageId: this.messageId,
      status: status,
      timestamp: timestamp,
      ...metadata
    });
  }

  async triggerWebhooks(status, timestamp, metadata) {
    try {
      // Get user's webhook configuration
      const UserRepository = require('../repositories/UserRepository');
      const userRepository = new UserRepository();
      const user = await userRepository.findById(this.userId);
      
      if (user && user.webhook_url && user.webhook_events?.includes('message_status')) {
        const QueueManager = require('../core/QueueManager').getInstance();
        
        await QueueManager.addWebhookJob({
          type: 'message_status',
          webhookUrl: user.webhook_url,
          messageId: this.messageId,
          deviceId: this.deviceId,
          status: status,
          timestamp: timestamp,
          metadata: metadata,
          secret: user.webhook_secret
        });
      }
    } catch (error) {
      logger.error('MessageStatusTracker: Error triggering webhooks:', error);
    }
  }
}

module.exports = new MessageJob();