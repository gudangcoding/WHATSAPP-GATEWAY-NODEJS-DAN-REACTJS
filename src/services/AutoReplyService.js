const AutoReplyRepository = require('../repositories/AutoReplyRepository');
const AutoReplyLogRepository = require('../repositories/AutoReplyLogRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const QueueManager = require('../core/QueueManager');
const SocketManager = require('../core/SocketManager');
const logger = require('../utils/logger');

class AutoReplyService {
  constructor() {
    this.autoReplyRepository = new AutoReplyRepository();
    this.autoReplyLogRepository = new AutoReplyLogRepository();
    this.deviceRepository = new DeviceRepository();
    this.queueManager = QueueManager.getInstance();
    this.socketManager = SocketManager.getInstance();
    
    // Supported match types
    this.matchTypes = ['exact', 'contains', 'starts_with', 'ends_with', 'regex'];
    
    // Supported reply types
    this.replyTypes = ['text', 'image', 'video', 'document', 'audio'];
  }

  /**
   * Create new auto reply rule
   */
  async createAutoReply(userId, autoReplyData) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(autoReplyData.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Validate auto reply data
      const validation = this.validateAutoReplyData(autoReplyData);
      if (!validation.isValid) {
        throw new Error(`Auto reply validation failed: ${validation.errors.join(', ')}`);
      }

      // Add user_id to data
      const autoReplyWithUser = {
        ...autoReplyData,
        user_id: userId
      };

      // Create auto reply
      const autoReply = await this.autoReplyRepository.create(autoReplyWithUser);

      // Emit real-time event
      this.socketManager.emitToDevice(autoReplyData.device_id, 'auto_reply:created', {
        autoReply: autoReply,
        timestamp: new Date()
      });

      logger.info(`AutoReplyService: Auto reply created for device ${autoReplyData.device_id}`);

      return {
        success: true,
        data: autoReply,
        message: 'Auto reply rule created successfully'
      };

    } catch (error) {
      logger.error('AutoReplyService: Error creating auto reply:', error);
      throw error;
    }
  }

  /**
   * Update auto reply rule
   */
  async updateAutoReply(userId, autoReplyId, updateData) {
    try {
      // Get existing auto reply
      const existingAutoReply = await this.autoReplyRepository.findById(autoReplyId);
      if (!existingAutoReply) {
        throw new Error('Auto reply rule not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingAutoReply.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Validate update data
      if (Object.keys(updateData).length > 0) {
        const validation = this.validateAutoReplyData(updateData, true);
        if (!validation.isValid) {
          throw new Error(`Auto reply validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update auto reply
      const updated = await this.autoReplyRepository.update(autoReplyId, updateData);
      if (!updated) {
        throw new Error('Failed to update auto reply rule');
      }

      // Get updated data
      const updatedAutoReply = await this.autoReplyRepository.findById(autoReplyId);

      // Emit real-time event
      this.socketManager.emitToDevice(existingAutoReply.device_id, 'auto_reply:updated', {
        autoReply: updatedAutoReply,
        timestamp: new Date()
      });

      logger.info(`AutoReplyService: Auto reply ${autoReplyId} updated`);

      return {
        success: true,
        data: updatedAutoReply,
        message: 'Auto reply rule updated successfully'
      };

    } catch (error) {
      logger.error('AutoReplyService: Error updating auto reply:', error);
      throw error;
    }
  }

  /**
   * Delete auto reply rule
   */
  async deleteAutoReply(userId, autoReplyId) {
    try {
      // Get existing auto reply
      const existingAutoReply = await this.autoReplyRepository.findById(autoReplyId);
      if (!existingAutoReply) {
        throw new Error('Auto reply rule not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingAutoReply.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Delete auto reply
      const deleted = await this.autoReplyRepository.delete(autoReplyId);
      if (!deleted) {
        throw new Error('Failed to delete auto reply rule');
      }

      // Emit real-time event
      this.socketManager.emitToDevice(existingAutoReply.device_id, 'auto_reply:deleted', {
        autoReplyId: autoReplyId,
        timestamp: new Date()
      });

      logger.info(`AutoReplyService: Auto reply ${autoReplyId} deleted`);

      return {
        success: true,
        message: 'Auto reply rule deleted successfully'
      };

    } catch (error) {
      logger.error('AutoReplyService: Error deleting auto reply:', error);
      throw error;
    }
  }

  /**
   * Get auto reply by ID
   */
  async getAutoReplyById(userId, autoReplyId) {
    try {
      const autoReply = await this.autoReplyRepository.findById(autoReplyId);
      if (!autoReply) {
        throw new Error('Auto reply rule not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(autoReply.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      return {
        success: true,
        data: autoReply
      };

    } catch (error) {
      logger.error('AutoReplyService: Error getting auto reply by ID:', error);
      throw error;
    }
  }

  /**
   * Get auto replies for user
   */
  async getAutoReplies(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        deviceId = null,
        isActive = null,
        search = null
      } = options;

      const offset = (page - 1) * limit;

      let autoReplies;
      let totalCount;

      if (search) {
        // Search auto replies
        autoReplies = await this.autoReplyRepository.search(search, deviceId, {
          limit,
          offset,
          isActive
        });
        
        // Get total count for search
        totalCount = await this.autoReplyRepository.count({
          user_id: userId,
          device_id: deviceId,
          is_active: isActive
        });
      } else {
        // Get auto replies by user
        autoReplies = await this.autoReplyRepository.findByUserId(userId, {
          limit,
          offset,
          deviceId,
          isActive
        });

        // Get total count
        totalCount = await this.autoReplyRepository.count({
          user_id: userId,
          device_id: deviceId,
          is_active: isActive
        });
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: autoReplies,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          deviceId,
          isActive,
          search
        }
      };

    } catch (error) {
      logger.error('AutoReplyService: Error getting auto replies:', error);
      throw error;
    }
  }

  /**
   * Toggle auto reply status
   */
  async toggleAutoReplyStatus(userId, autoReplyId) {
    try {
      // Get existing auto reply
      const existingAutoReply = await this.autoReplyRepository.findById(autoReplyId);
      if (!existingAutoReply) {
        throw new Error('Auto reply rule not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingAutoReply.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Toggle status
      const updated = await this.autoReplyRepository.toggleStatus(autoReplyId);
      if (!updated) {
        throw new Error('Failed to toggle auto reply status');
      }

      // Get updated data
      const updatedAutoReply = await this.autoReplyRepository.findById(autoReplyId);

      // Emit real-time event
      this.socketManager.emitToDevice(existingAutoReply.device_id, 'auto_reply:status_changed', {
        autoReply: updatedAutoReply,
        timestamp: new Date()
      });

      logger.info(`AutoReplyService: Auto reply ${autoReplyId} status toggled to ${updatedAutoReply.is_active}`);

      return {
        success: true,
        data: updatedAutoReply,
        message: `Auto reply rule ${updatedAutoReply.is_active ? 'activated' : 'deactivated'} successfully`
      };

    } catch (error) {
      logger.error('AutoReplyService: Error toggling auto reply status:', error);
      throw error;
    }
  }

  /**
   * Update auto reply priorities
   */
  async updatePriorities(userId, priorityUpdates) {
    try {
      // Validate all auto replies belong to user
      for (const update of priorityUpdates) {
        const autoReply = await this.autoReplyRepository.findById(update.id);
        if (!autoReply) {
          throw new Error(`Auto reply rule ${update.id} not found`);
        }

        const device = await this.deviceRepository.findByIdAndUserId(autoReply.device_id, userId);
        if (!device) {
          throw new Error(`Access denied for auto reply rule ${update.id}`);
        }
      }

      // Update priorities
      const updated = await this.autoReplyRepository.bulkUpdatePriorities(priorityUpdates);
      if (!updated) {
        throw new Error('Failed to update priorities');
      }

      logger.info(`AutoReplyService: Updated priorities for ${priorityUpdates.length} auto reply rules`);

      return {
        success: true,
        message: 'Auto reply priorities updated successfully'
      };

    } catch (error) {
      logger.error('AutoReplyService: Error updating priorities:', error);
      throw error;
    }
  }

  /**
   * Duplicate auto reply rule
   */
  async duplicateAutoReply(userId, autoReplyId, newName = null) {
    try {
      // Get existing auto reply
      const existingAutoReply = await this.autoReplyRepository.findById(autoReplyId);
      if (!existingAutoReply) {
        throw new Error('Auto reply rule not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingAutoReply.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Duplicate auto reply
      const duplicatedAutoReply = await this.autoReplyRepository.duplicate(autoReplyId, newName);

      // Emit real-time event
      this.socketManager.emitToDevice(existingAutoReply.device_id, 'auto_reply:duplicated', {
        original: existingAutoReply,
        duplicate: duplicatedAutoReply,
        timestamp: new Date()
      });

      logger.info(`AutoReplyService: Auto reply ${autoReplyId} duplicated as ${duplicatedAutoReply.id}`);

      return {
        success: true,
        data: duplicatedAutoReply,
        message: 'Auto reply rule duplicated successfully'
      };

    } catch (error) {
      logger.error('AutoReplyService: Error duplicating auto reply:', error);
      throw error;
    }
  }

  /**
   * Test auto reply rule
   */
  async testAutoReply(userId, autoReplyId, testMessage) {
    try {
      // Get auto reply rule
      const autoReply = await this.autoReplyRepository.findById(autoReplyId);
      if (!autoReply) {
        throw new Error('Auto reply rule not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(autoReply.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Test message matching
      const messageContent = testMessage.toLowerCase();
      const isMatched = this.testRuleMatch(autoReply, messageContent);

      // Generate test reply if matched
      let testReply = null;
      if (isMatched) {
        testReply = this.generateTestReply(autoReply, {
          content: testMessage,
          from_number: '628123456789',
          pushName: 'Test User'
        });
      }

      return {
        success: true,
        data: {
          matched: isMatched,
          rule: {
            id: autoReply.id,
            name: autoReply.name,
            match_type: autoReply.match_type,
            keywords: autoReply.keywords,
            reply_type: autoReply.reply_type
          },
          testMessage: testMessage,
          testReply: testReply
        }
      };

    } catch (error) {
      logger.error('AutoReplyService: Error testing auto reply:', error);
      throw error;
    }
  }

  /**
   * Get auto reply statistics
   */
  async getAutoReplyStatistics(userId, deviceId, timeframe = '24h') {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Get statistics
      const stats = await this.autoReplyRepository.getStatistics(deviceId, timeframe);
      const logStats = await this.autoReplyLogRepository.getStatistics(deviceId, timeframe);
      const mostTriggered = await this.autoReplyRepository.getMostTriggeredRules(deviceId, 10, timeframe);
      const hourlyPerformance = await this.autoReplyLogRepository.getHourlyPerformance(deviceId, 7);

      return {
        success: true,
        data: {
          rules: stats,
          logs: logStats,
          mostTriggered: mostTriggered,
          hourlyPerformance: hourlyPerformance,
          device: {
            id: device.id,
            name: device.name,
            phone_number: device.phone_number
          },
          timeframe: timeframe
        }
      };

    } catch (error) {
      logger.error('AutoReplyService: Error getting auto reply statistics:', error);
      throw error;
    }
  }

  /**
   * Get auto reply logs
   */
  async getAutoReplyLogs(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        deviceId = null,
        autoReplyId = null
      } = options;

      // Validate device ownership if deviceId provided
      if (deviceId) {
        const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
        if (!device) {
          throw new Error('Device not found or access denied');
        }
      }

      const offset = (page - 1) * limit;
      let logs;

      if (autoReplyId) {
        // Get logs for specific auto reply
        logs = await this.autoReplyLogRepository.findByAutoReplyId(autoReplyId, {
          limit,
          offset
        });
      } else if (deviceId) {
        // Get logs for specific device
        logs = await this.autoReplyLogRepository.findByDeviceId(deviceId, {
          limit,
          offset
        });
      } else {
        // Get all logs for user (need to implement this)
        throw new Error('Either deviceId or autoReplyId must be provided');
      }

      return {
        success: true,
        data: logs,
        pagination: {
          currentPage: page,
          limit
        }
      };

    } catch (error) {
      logger.error('AutoReplyService: Error getting auto reply logs:', error);
      throw error;
    }
  }

  /**
   * Process incoming message for auto reply
   */
  async processIncomingMessage(deviceId, incomingMessage) {
    try {
      // Add auto reply job to queue
      await this.queueManager.addAutoReplyJob({
        type: 'process_auto_reply',
        deviceId: deviceId,
        incomingMessage: incomingMessage,
        userId: incomingMessage.user_id
      });

      logger.debug(`AutoReplyService: Auto reply job queued for device ${deviceId}`);

      return {
        success: true,
        message: 'Auto reply processing queued'
      };

    } catch (error) {
      logger.error('AutoReplyService: Error processing incoming message:', error);
      throw error;
    }
  }

  /**
   * Validate auto reply data
   */
  validateAutoReplyData(data, isUpdate = false) {
    const errors = [];

    // Required fields for creation
    if (!isUpdate) {
      if (!data.device_id) {
        errors.push('Device ID is required');
      }
      if (!data.name || !data.name.trim()) {
        errors.push('Name is required');
      }
      if (!data.match_type) {
        errors.push('Match type is required');
      }
      if (!data.keywords || !data.keywords.trim()) {
        errors.push('Keywords are required');
      }
      if (!data.reply_type) {
        errors.push('Reply type is required');
      }
    }

    // Validate match type
    if (data.match_type && !this.matchTypes.includes(data.match_type)) {
      errors.push(`Invalid match type. Must be one of: ${this.matchTypes.join(', ')}`);
    }

    // Validate reply type
    if (data.reply_type && !this.replyTypes.includes(data.reply_type)) {
      errors.push(`Invalid reply type. Must be one of: ${this.replyTypes.join(', ')}`);
    }

    // Validate regex pattern if match_type is regex
    if (data.match_type === 'regex' && data.keywords) {
      try {
        new RegExp(data.keywords);
      } catch (error) {
        errors.push('Invalid regex pattern in keywords');
      }
    }

    // Validate reply content based on type
    if (data.reply_type) {
      switch (data.reply_type) {
        case 'text':
          if (!data.reply_text || !data.reply_text.trim()) {
            errors.push('Reply text is required for text replies');
          }
          break;
        case 'image':
        case 'video':
        case 'document':
        case 'audio':
          if (!data.reply_media_url || !data.reply_media_url.trim()) {
            errors.push(`Media URL is required for ${data.reply_type} replies`);
          }
          break;
      }
    }

    // Validate time restrictions
    if (data.time_start && data.time_end) {
      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(data.time_start)) {
        errors.push('Invalid time_start format. Use HH:MM format');
      }
      if (!timePattern.test(data.time_end)) {
        errors.push('Invalid time_end format. Use HH:MM format');
      }
    }

    // Validate numeric fields
    if (data.priority !== undefined && (!Number.isInteger(data.priority) || data.priority < 1)) {
      errors.push('Priority must be a positive integer');
    }

    if (data.cooldown_minutes !== undefined && (!Number.isInteger(data.cooldown_minutes) || data.cooldown_minutes < 0)) {
      errors.push('Cooldown minutes must be a non-negative integer');
    }

    if (data.max_daily_replies !== undefined && (!Number.isInteger(data.max_daily_replies) || data.max_daily_replies < 0)) {
      errors.push('Max daily replies must be a non-negative integer');
    }

    if (data.delay_seconds !== undefined && (!Number.isInteger(data.delay_seconds) || data.delay_seconds < 0)) {
      errors.push('Delay seconds must be a non-negative integer');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Test if rule matches message
   */
  testRuleMatch(rule, messageContent) {
    const { match_type, keywords } = rule;
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
    
    switch (match_type) {
      case 'exact':
        return keywordList.includes(messageContent);
      
      case 'contains':
        return keywordList.some(keyword => messageContent.includes(keyword));
      
      case 'starts_with':
        return keywordList.some(keyword => messageContent.startsWith(keyword));
      
      case 'ends_with':
        return keywordList.some(keyword => messageContent.endsWith(keyword));
      
      case 'regex':
        try {
          const regex = new RegExp(keywords, 'i');
          return regex.test(messageContent);
        } catch (error) {
          return false;
        }
      
      default:
        return false;
    }
  }

  /**
   * Generate test reply
   */
  generateTestReply(rule, incomingMessage) {
    const { reply_type, reply_text, reply_media_url } = rule;
    
    // Process reply text with variables
    let processedText = reply_text || '';
    
    const variables = {
      '{name}': incomingMessage.pushName || incomingMessage.from_number,
      '{number}': incomingMessage.from_number,
      '{message}': incomingMessage.content,
      '{time}': new Date().toLocaleTimeString(),
      '{date}': new Date().toLocaleDateString(),
      '{datetime}': new Date().toLocaleString()
    };
    
    for (const [variable, value] of Object.entries(variables)) {
      processedText = processedText.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    const reply = {
      type: reply_type,
      text: processedText
    };

    if (reply_media_url && ['image', 'video', 'document', 'audio'].includes(reply_type)) {
      reply.media_url = reply_media_url;
    }

    return reply;
  }
}

module.exports = AutoReplyService;