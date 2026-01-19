const logger = require('../utils/logger');
const AutoReplyRepository = require('../repositories/AutoReplyRepository');
const MessageRepository = require('../repositories/MessageRepository');
const QueueManager = require('../core/QueueManager');

class AutoReplyJob {
  constructor() {
    this.autoReplyRepository = new AutoReplyRepository();
    this.messageRepository = new MessageRepository();
  }

  /**
   * Process auto reply job
   */
  async process(data, job) {
    const { type, deviceId, incomingMessage, userId } = data;
    
    logger.info(`AutoReplyJob: Processing ${type} for device ${deviceId}`);
    
    try {
      switch (type) {
        case 'process_auto_reply':
          return await this.processAutoReply(data, job);
        case 'check_cooldown':
          return await this.checkCooldown(data, job);
        default:
          throw new Error(`Unknown auto reply job type: ${type}`);
      }
    } catch (error) {
      logger.error(`AutoReplyJob: Error processing ${type}:`, error);
      throw error;
    }
  }

  /**
   * Process auto reply for incoming message
   */
  async processAutoReply(data, job) {
    const { deviceId, incomingMessage, userId } = data;
    
    // Get active auto reply rules for device
    const autoReplies = await this.autoReplyRepository.getActiveByDeviceId(deviceId);
    
    if (!autoReplies || autoReplies.length === 0) {
      logger.debug(`AutoReplyJob: No active auto replies for device ${deviceId}`);
      return { success: true, message: 'No active auto replies' };
    }

    const fromNumber = incomingMessage.from_number;
    const messageContent = incomingMessage.content.toLowerCase();
    
    // Check cooldown first
    const cooldownCheck = await this.checkMessageCooldown(deviceId, fromNumber);
    if (!cooldownCheck.allowed) {
      logger.debug(`AutoReplyJob: Cooldown active for ${fromNumber} on device ${deviceId}`);
      return { success: true, message: 'Cooldown active', cooldownUntil: cooldownCheck.cooldownUntil };
    }

    // Find matching auto reply rule
    let matchedRule = null;
    
    for (const rule of autoReplies) {
      if (await this.isRuleMatched(rule, messageContent, incomingMessage)) {
        matchedRule = rule;
        break; // Use first matching rule (priority order)
      }
    }

    if (!matchedRule) {
      logger.debug(`AutoReplyJob: No matching rule for message from ${fromNumber}`);
      return { success: true, message: 'No matching rule' };
    }

    // Process the auto reply
    const replyResult = await this.sendAutoReply(deviceId, fromNumber, matchedRule, incomingMessage);
    
    // Log auto reply
    await this.logAutoReply(deviceId, matchedRule.id, incomingMessage, replyResult);
    
    // Set cooldown
    await this.setCooldown(deviceId, fromNumber, matchedRule.cooldown_minutes);

    logger.info(`AutoReplyJob: Auto reply sent for device ${deviceId} to ${fromNumber}`);
    
    return {
      success: true,
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      replyResult
    };
  }

  /**
   * Check if rule matches the incoming message
   */
  async isRuleMatched(rule, messageContent, incomingMessage) {
    const { match_type, keywords, is_group_enabled } = rule;
    
    // Check if group messages are allowed
    if (incomingMessage.is_group && !is_group_enabled) {
      return false;
    }

    // Check time restrictions
    if (!this.isWithinTimeRestrictions(rule)) {
      return false;
    }

    // Parse keywords
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
          logger.error(`AutoReplyJob: Invalid regex pattern: ${keywords}`, error);
          return false;
        }
      
      default:
        return false;
    }
  }

  /**
   * Check if current time is within rule's time restrictions
   */
  isWithinTimeRestrictions(rule) {
    if (!rule.time_start || !rule.time_end) {
      return true; // No time restrictions
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    const startTime = this.parseTime(rule.time_start);
    const endTime = this.parseTime(rule.time_end);
    
    if (startTime <= endTime) {
      // Same day range (e.g., 09:00 - 17:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range (e.g., 22:00 - 06:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Parse time string to minutes since midnight
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Send auto reply message
   */
  async sendAutoReply(deviceId, toNumber, rule, incomingMessage) {
    const { reply_type, reply_text, reply_media_url, reply_media_type } = rule;
    
    const queueManager = QueueManager.getInstance();
    
    try {
      let messageData = {
        deviceId,
        to: `${toNumber}@s.whatsapp.net`,
        messageType: reply_type
      };

      switch (reply_type) {
        case 'text':
          messageData.message = this.processReplyText(reply_text, incomingMessage);
          break;
          
        case 'image':
          messageData.message = {
            url: reply_media_url,
            caption: this.processReplyText(reply_text, incomingMessage)
          };
          break;
          
        case 'video':
          messageData.message = {
            url: reply_media_url,
            caption: this.processReplyText(reply_text, incomingMessage)
          };
          break;
          
        case 'document':
          messageData.message = {
            url: reply_media_url,
            fileName: reply_text || 'document'
          };
          break;
          
        case 'audio':
          messageData.message = {
            url: reply_media_url
          };
          break;
          
        default:
          messageData.message = this.processReplyText(reply_text, incomingMessage);
          messageData.messageType = 'text';
      }

      // Add to message queue with high priority
      const job = await queueManager.addMessageJob(messageData, {
        priority: 10, // High priority for auto replies
        delay: rule.delay_seconds * 1000 || 0
      });

      return {
        success: true,
        jobId: job.id,
        messageType: reply_type
      };
      
    } catch (error) {
      logger.error(`AutoReplyJob: Error sending auto reply:`, error);
      throw error;
    }
  }

  /**
   * Process reply text with variables
   */
  processReplyText(replyText, incomingMessage) {
    if (!replyText) return '';
    
    // Replace variables in reply text
    let processedText = replyText;
    
    // Available variables
    const variables = {
      '{name}': incomingMessage.pushName || incomingMessage.from_number,
      '{number}': incomingMessage.from_number,
      '{message}': incomingMessage.content,
      '{time}': new Date().toLocaleTimeString(),
      '{date}': new Date().toLocaleDateString(),
      '{datetime}': new Date().toLocaleString()
    };
    
    // Replace all variables
    for (const [variable, value] of Object.entries(variables)) {
      processedText = processedText.replace(new RegExp(variable, 'g'), value);
    }
    
    return processedText;
  }

  /**
   * Check message cooldown
   */
  async checkMessageCooldown(deviceId, fromNumber) {
    try {
      const cooldownKey = `cooldown:${deviceId}:${fromNumber}`;
      const redis = require('../core/QueueManager').getInstance().redis;
      
      const cooldownUntil = await redis.get(cooldownKey);
      
      if (cooldownUntil) {
        const cooldownTime = new Date(cooldownUntil);
        const now = new Date();
        
        if (now < cooldownTime) {
          return {
            allowed: false,
            cooldownUntil: cooldownTime
          };
        }
      }
      
      return { allowed: true };
      
    } catch (error) {
      logger.error(`AutoReplyJob: Error checking cooldown:`, error);
      return { allowed: true }; // Allow on error
    }
  }

  /**
   * Set cooldown for number
   */
  async setCooldown(deviceId, fromNumber, cooldownMinutes) {
    if (!cooldownMinutes || cooldownMinutes <= 0) return;
    
    try {
      const cooldownKey = `cooldown:${deviceId}:${fromNumber}`;
      const redis = require('../core/QueueManager').getInstance().redis;
      
      const cooldownUntil = new Date(Date.now() + (cooldownMinutes * 60 * 1000));
      
      await redis.setex(cooldownKey, cooldownMinutes * 60, cooldownUntil.toISOString());
      
      logger.debug(`AutoReplyJob: Cooldown set for ${fromNumber} until ${cooldownUntil}`);
      
    } catch (error) {
      logger.error(`AutoReplyJob: Error setting cooldown:`, error);
    }
  }

  /**
   * Log auto reply execution
   */
  async logAutoReply(deviceId, ruleId, incomingMessage, replyResult) {
    try {
      const logData = {
        device_id: deviceId,
        auto_reply_id: ruleId,
        trigger_message_id: incomingMessage.id,
        from_number: incomingMessage.from_number,
        trigger_text: incomingMessage.content,
        reply_sent: replyResult.success,
        reply_job_id: replyResult.jobId,
        executed_at: new Date()
      };
      
      // Save to auto_reply_logs table
      const AutoReplyLogRepository = require('../repositories/AutoReplyLogRepository');
      const logRepository = new AutoReplyLogRepository();
      await logRepository.create(logData);
      
    } catch (error) {
      logger.error(`AutoReplyJob: Error logging auto reply:`, error);
    }
  }

  /**
   * Check cooldown job
   */
  async checkCooldown(data, job) {
    const { deviceId, fromNumber } = data;
    
    const result = await this.checkMessageCooldown(deviceId, fromNumber);
    
    return {
      deviceId,
      fromNumber,
      ...result
    };
  }
}

module.exports = new AutoReplyJob();