const MessageRepository = require('../repositories/MessageRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const ContactRepository = require('../repositories/ContactRepository');
const QueueManager = require('../core/QueueManager');
const SocketManager = require('../core/SocketManager');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

class MessageService {
  constructor() {
    this.messageRepository = new MessageRepository();
    this.deviceRepository = new DeviceRepository();
    this.contactRepository = new ContactRepository();
    this.queueManager = QueueManager.getInstance();
    this.socketManager = SocketManager.getInstance();
    
    // Supported message types
    this.supportedTypes = [
      'text', 'image', 'video', 'document', 'audio', 
      'location', 'contact', 'list', 'sticker'
    ];
  }

  /**
   * Send single message
   */
  async sendMessage(userId, deviceId, messageData, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check if device is active and connected
      if (!device.is_active) {
        throw new Error('Device is not active');
      }

      const SessionManager = require('../core/SessionManager').getInstance();
      const sessionStatus = SessionManager.getSessionStatus(deviceId);
      
      if (!sessionStatus.connected) {
        throw new Error('Device session is not connected');
      }

      // Validate message data
      const validation = this.validateMessageData(messageData);
      if (!validation.isValid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }

      // Normalize recipient
      const normalizedTo = this.normalizeRecipient(messageData.to);

      // Prepare job data
      const jobData = {
        type: 'send_message',
        deviceId: deviceId,
        userId: userId,
        to: normalizedTo,
        messageType: messageData.type,
        content: messageData.content,
        options: options,
        priority: options.priority || 0
      };

      // Add to message queue
      const job = await this.queueManager.addMessageJob(jobData, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      logger.info(`MessageService: Message queued for device ${deviceId}, job ${job.id}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Message queued for sending',
        to: this.extractPhoneNumber(normalizedTo),
        type: messageData.type,
        estimatedDelay: options.delay || 0
      };

    } catch (error) {
      logger.error(`MessageService: Error sending message for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(userId, deviceId, messages, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check if device is active and connected
      if (!device.is_active) {
        throw new Error('Device is not active');
      }

      const SessionManager = require('../core/SessionManager').getInstance();
      const sessionStatus = SessionManager.getSessionStatus(deviceId);
      
      if (!sessionStatus.connected) {
        throw new Error('Device session is not connected');
      }

      // Validate all messages
      const validationErrors = [];
      const validatedMessages = [];

      for (let i = 0; i < messages.length; i++) {
        const messageData = messages[i];
        const validation = this.validateMessageData(messageData);
        
        if (!validation.isValid) {
          validationErrors.push(`Message ${i + 1}: ${validation.errors.join(', ')}`);
        } else {
          validatedMessages.push({
            ...messageData,
            to: this.normalizeRecipient(messageData.to)
          });
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(`Bulk message validation failed:\n${validationErrors.join('\n')}`);
      }

      // Default bulk options
      const bulkOptions = {
        delay: options.delay || 1000,
        randomDelay: options.randomDelay || false,
        stopOnError: options.stopOnError || false,
        maxConcurrent: options.maxConcurrent || 1,
        ...options
      };

      // Prepare job data
      const jobData = {
        type: 'send_bulk',
        deviceId: deviceId,
        userId: userId,
        messages: validatedMessages,
        options: bulkOptions
      };

      // Add to message queue
      const job = await this.queueManager.addMessageJob(jobData, {
        priority: options.priority || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });

      logger.info(`MessageService: Bulk messages queued for device ${deviceId}, job ${job.id}, count: ${validatedMessages.length}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Bulk messages queued for sending',
        totalMessages: validatedMessages.length,
        estimatedDuration: this.calculateBulkDuration(validatedMessages.length, bulkOptions)
      };

    } catch (error) {
      logger.error(`MessageService: Error sending bulk messages for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule message
   */
  async scheduleMessage(userId, deviceId, messageData, scheduledAt, timezone = 'UTC', options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Validate message data
      const validation = this.validateMessageData(messageData);
      if (!validation.isValid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }

      // Parse and validate scheduled time
      const scheduledTime = moment.tz(scheduledAt, timezone);
      const now = moment();
      
      if (!scheduledTime.isValid()) {
        throw new Error('Invalid scheduled time format');
      }
      
      if (scheduledTime.isBefore(now)) {
        throw new Error('Scheduled time must be in the future');
      }

      const delay = scheduledTime.diff(now);
      const normalizedTo = this.normalizeRecipient(messageData.to);

      // Prepare job data
      const jobData = {
        type: 'send_scheduled',
        deviceId: deviceId,
        userId: userId,
        to: normalizedTo,
        messageType: messageData.type,
        content: messageData.content,
        options: options,
        scheduledAt: scheduledTime.toISOString(),
        timezone: timezone
      };

      // Add to message queue with delay
      const job = await this.queueManager.addMessageJob(jobData, {
        delay: delay,
        jobId: `scheduled_${deviceId}_${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      // Save scheduled message record
      await this.messageRepository.create({
        device_id: deviceId,
        user_id: userId,
        to_number: this.extractPhoneNumber(normalizedTo),
        type: messageData.type,
        content: JSON.stringify(messageData.content),
        direction: 'outgoing',
        is_group: normalizedTo.includes('@g.us'),
        group_id: normalizedTo.includes('@g.us') ? normalizedTo : null,
        status: 'scheduled',
        scheduled_at: scheduledTime.toDate(),
        job_id: job.id,
        metadata: {
          timezone: timezone,
          originalScheduledAt: scheduledAt
        }
      });

      logger.info(`MessageService: Message scheduled for device ${deviceId}, job ${job.id}, time: ${scheduledTime.toISOString()}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Message scheduled successfully',
        scheduledAt: scheduledTime.toISOString(),
        timezone: timezone,
        delay: delay,
        to: this.extractPhoneNumber(normalizedTo),
        type: messageData.type
      };

    } catch (error) {
      logger.error(`MessageService: Error scheduling message for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel scheduled message
   */
  async cancelScheduledMessage(userId, deviceId, messageId) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Find scheduled message
      const message = await this.messageRepository.findById(messageId);
      if (!message || message.device_id !== deviceId || message.user_id !== userId) {
        throw new Error('Scheduled message not found or access denied');
      }

      if (message.status !== 'scheduled') {
        throw new Error('Message is not in scheduled status');
      }

      // Remove job from queue
      if (message.job_id) {
        try {
          await this.queueManager.removeJob('message', message.job_id);
        } catch (error) {
          logger.warn(`MessageService: Could not remove job ${message.job_id}:`, error.message);
        }
      }

      // Update message status
      await this.messageRepository.update(messageId, {
        status: 'cancelled',
        cancelled_at: new Date()
      });

      logger.info(`MessageService: Scheduled message ${messageId} cancelled for device ${deviceId}`);

      return {
        success: true,
        message: 'Scheduled message cancelled successfully',
        messageId: messageId
      };

    } catch (error) {
      logger.error(`MessageService: Error cancelling scheduled message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(userId, deviceId, messageId) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Find message
      const message = await this.messageRepository.findById(messageId);
      if (!message || message.device_id !== deviceId || message.user_id !== userId) {
        throw new Error('Message not found or access denied');
      }

      // Get job status if available
      let jobStatus = null;
      if (message.job_id) {
        try {
          const job = await this.queueManager.getJob('message', message.job_id);
          if (job) {
            jobStatus = {
              id: job.id,
              state: await job.getState(),
              progress: job.progress(),
              createdAt: new Date(job.timestamp),
              processedOn: job.processedOn ? new Date(job.processedOn) : null,
              finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
              failedReason: job.failedReason || null
            };
          }
        } catch (error) {
          logger.warn(`MessageService: Could not get job status for ${message.job_id}:`, error.message);
        }
      }

      return {
        success: true,
        message: {
          id: message.id,
          to_number: message.to_number,
          type: message.type,
          status: message.status,
          direction: message.direction,
          is_group: message.is_group,
          created_at: message.created_at,
          scheduled_at: message.scheduled_at,
          sent_at: message.sent_at,
          delivered_at: message.delivered_at,
          read_at: message.read_at,
          failed_at: message.failed_at,
          cancelled_at: message.cancelled_at,
          error_message: message.error_message
        },
        job: jobStatus
      };

    } catch (error) {
      logger.error(`MessageService: Error getting message status ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get message history
   */
  async getMessageHistory(userId, deviceId, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const {
        page = 1,
        limit = 50,
        status = null,
        type = null,
        direction = null,
        isGroup = null,
        startDate = null,
        endDate = null,
        search = null,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const filters = { device_id: deviceId };

      // Apply filters
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (direction) filters.direction = direction;
      if (isGroup !== null) filters.is_group = isGroup;

      // Get messages with pagination
      let messages;
      let totalCount;

      if (search) {
        // Search in content or phone number
        messages = await this.messageRepository.search(search, deviceId, {
          limit,
          offset,
          status,
          type,
          direction
        });
        totalCount = await this.messageRepository.count(filters);
      } else {
        messages = await this.messageRepository.findAll(filters, {
          limit,
          offset,
          orderBy,
          orderDirection
        });
        totalCount = await this.messageRepository.count(filters);
      }

      // Apply date filters if specified
      if (startDate || endDate) {
        messages = messages.filter(message => {
          const messageDate = new Date(message.created_at);
          if (startDate && messageDate < new Date(startDate)) return false;
          if (endDate && messageDate > new Date(endDate)) return false;
          return true;
        });
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: messages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          status,
          type,
          direction,
          isGroup,
          startDate,
          endDate,
          search
        }
      };

    } catch (error) {
      logger.error(`MessageService: Error getting message history for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStatistics(userId, deviceId, timeframe = '24h') {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const stats = await this.messageRepository.getStatistics(deviceId, timeframe);
      const recentMessages = await this.messageRepository.getRecentMessages(deviceId, 10);
      const topRecipients = await this.messageRepository.getTopRecipients(deviceId, timeframe, 10);

      return {
        success: true,
        statistics: stats,
        recent: recentMessages,
        topRecipients: topRecipients,
        device: {
          id: device.id,
          name: device.name,
          phone_number: device.phone_number,
          status: device.status
        },
        timeframe: timeframe
      };

    } catch (error) {
      logger.error(`MessageService: Error getting message statistics for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to contact
   */
  async sendMessageToContact(userId, deviceId, contactId, messageData, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Get contact
      const contact = await this.contactRepository.findById(contactId);
      if (!contact || contact.device_id !== deviceId) {
        throw new Error('Contact not found or access denied');
      }

      // Prepare message with contact's phone number
      const messageWithRecipient = {
        ...messageData,
        to: contact.phone_number
      };

      return await this.sendMessage(userId, deviceId, messageWithRecipient, options);

    } catch (error) {
      logger.error(`MessageService: Error sending message to contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to multiple contacts
   */
  async sendMessageToContacts(userId, deviceId, contactIds, messageData, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Get contacts
      const contacts = await Promise.all(
        contactIds.map(id => this.contactRepository.findById(id))
      );

      // Filter valid contacts
      const validContacts = contacts.filter(contact => 
        contact && contact.device_id === deviceId
      );

      if (validContacts.length === 0) {
        throw new Error('No valid contacts found');
      }

      // Prepare bulk messages
      const messages = validContacts.map(contact => ({
        ...messageData,
        to: contact.phone_number
      }));

      return await this.sendBulkMessages(userId, deviceId, messages, options);

    } catch (error) {
      logger.error(`MessageService: Error sending message to contacts:`, error);
      throw error;
    }
  }

  /**
   * Validate message data
   */
  validateMessageData(messageData) {
    const errors = [];
    const { to, type, content } = messageData;

    // Validate recipient
    if (!to) {
      errors.push('Recipient is required');
    } else if (!this.isValidRecipient(to)) {
      errors.push('Invalid recipient format');
    }

    // Validate message type
    if (!type) {
      errors.push('Message type is required');
    } else if (!this.supportedTypes.includes(type)) {
      errors.push(`Unsupported message type: ${type}`);
    }

    // Validate content
    if (!content) {
      errors.push('Message content is required');
    } else {
      // Type-specific validation
      const typeValidation = this.validateContentByType(type, content);
      errors.push(...typeValidation);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate content by message type
   */
  validateContentByType(type, content) {
    const errors = [];

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
        if (!location) {
          errors.push('Location data is required');
        } else {
          if (typeof location.degreesLatitude !== 'number' || 
              location.degreesLatitude < -90 || location.degreesLatitude > 90) {
            errors.push('Invalid latitude');
          }
          if (typeof location.degreesLongitude !== 'number' || 
              location.degreesLongitude < -180 || location.degreesLongitude > 180) {
            errors.push('Invalid longitude');
          }
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

    return errors;
  }

  /**
   * Utility methods
   */
  isValidRecipient(recipient) {
    // Check if it's a phone number or WhatsApp ID
    const phonePattern = /^\d{10,15}$/;
    const whatsappIdPattern = /^\d{10,15}@(s\.whatsapp\.net|g\.us)$/;
    
    return phonePattern.test(recipient) || whatsappIdPattern.test(recipient);
  }

  normalizeRecipient(recipient) {
    // If it's just a phone number, add @s.whatsapp.net
    if (/^\d{10,15}$/.test(recipient)) {
      return `${recipient}@s.whatsapp.net`;
    }
    
    // If it already has the domain, return as is
    return recipient;
  }

  extractPhoneNumber(whatsappId) {
    return whatsappId.split('@')[0];
  }

  calculateBulkDuration(messageCount, options) {
    const baseDelay = options.delay || 1000;
    const randomFactor = options.randomDelay ? 1.5 : 1;
    const avgDelay = baseDelay * randomFactor;
    
    return Math.round((messageCount * avgDelay) / 1000); // seconds
  }
}

module.exports = MessageService;