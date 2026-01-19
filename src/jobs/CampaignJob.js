const logger = require('../utils/logger');
const CampaignRepository = require('../repositories/CampaignRepository');
const CampaignTargetRepository = require('../repositories/CampaignTargetRepository');
const QueueManager = require('../core/QueueManager');
const SocketManager = require('../core/SocketManager');

class CampaignJob {
  constructor() {
    this.campaignRepository = new CampaignRepository();
    this.campaignTargetRepository = new CampaignTargetRepository();
    this.queueManager = QueueManager.getInstance();
    this.socketManager = SocketManager.getInstance();
    
    // Configuration
    this.config = {
      batchSize: 50,           // Process targets in batches
      maxConcurrent: 5,        // Max concurrent message jobs
      retryDelay: 30000,       // 30 seconds retry delay
      maxRetries: 3,           // Max retry attempts
      progressUpdateInterval: 10 // Update progress every 10 targets
    };
  }

  /**
   * Process campaign job
   */
  async process(data, job) {
    const { type, campaignId, deviceId, userId } = data;
    
    logger.info(`CampaignJob: Processing ${type} for campaign ${campaignId}`);
    
    try {
      switch (type) {
        case 'process_campaign':
          return await this.processCampaign(data, job);
        case 'retry_failed_targets':
          return await this.retryFailedTargets(data, job);
        case 'schedule_recurring':
          return await this.scheduleRecurring(data, job);
        default:
          throw new Error(`Unknown campaign job type: ${type}`);
      }
    } catch (error) {
      logger.error(`CampaignJob: Error processing ${type}:`, error);
      
      // Update campaign status to failed
      if (campaignId) {
        await this.campaignRepository.updateStatus(campaignId, 'failed', {
          error_message: error.message
        });
        
        // Emit error event
        this.socketManager.emitToDevice(deviceId, 'campaign:failed', {
          campaignId: campaignId,
          error: error.message,
          timestamp: new Date()
        });
      }
      
      throw error;
    }
  }

  /**
   * Process campaign execution
   */
  async processCampaign(data, job) {
    const { campaignId, deviceId, userId } = data;
    
    // Get campaign details
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if campaign is still in valid state
    if (!['running', 'scheduled'].includes(campaign.status)) {
      logger.info(`CampaignJob: Campaign ${campaignId} is not in running state, skipping`);
      return { success: true, message: 'Campaign not in running state' };
    }

    // Update campaign status to running if scheduled
    if (campaign.status === 'scheduled') {
      await this.campaignRepository.updateStatus(campaignId, 'running');
    }

    // Emit campaign started event
    this.socketManager.emitToDevice(deviceId, 'campaign:processing_started', {
      campaignId: campaignId,
      totalTargets: campaign.total_targets,
      timestamp: new Date()
    });

    try {
      // Process campaign in batches
      const result = await this.processCampaignBatches(campaign, job);
      
      // Update campaign completion status
      const finalStats = await this.campaignTargetRepository.getStatistics(campaignId);
      
      if (finalStats.failed_count === 0 && finalStats.sent_count === campaign.total_targets) {
        await this.campaignRepository.updateStatus(campaignId, 'completed', {
          sent_count: finalStats.sent_count,
          delivered_count: finalStats.delivered_count,
          failed_count: finalStats.failed_count
        });
        
        this.socketManager.emitToDevice(deviceId, 'campaign:completed', {
          campaignId: campaignId,
          statistics: finalStats,
          timestamp: new Date()
        });
      } else {
        await this.campaignRepository.updateProgress(campaignId, {
          sent_count: finalStats.sent_count,
          delivered_count: finalStats.delivered_count,
          failed_count: finalStats.failed_count
        });
        
        // Schedule retry for failed targets if any
        if (finalStats.failed_count > 0) {
          await this.scheduleRetryJob(campaignId, deviceId, userId);
        }
      }

      logger.info(`CampaignJob: Campaign ${campaignId} processing completed`);
      
      return {
        success: true,
        campaignId: campaignId,
        statistics: finalStats
      };

    } catch (error) {
      logger.error(`CampaignJob: Error processing campaign ${campaignId}:`, error);
      
      await this.campaignRepository.updateStatus(campaignId, 'failed', {
        error_message: error.message
      });
      
      throw error;
    }
  }

  /**
   * Process campaign in batches
   */
  async processCampaignBatches(campaign, job) {
    const campaignId = campaign.id;
    let processedCount = 0;
    let batchNumber = 1;
    
    while (true) {
      // Check if campaign is still running (might be paused/stopped)
      const currentCampaign = await this.campaignRepository.findById(campaignId);
      if (currentCampaign.status === 'paused') {
        logger.info(`CampaignJob: Campaign ${campaignId} paused, stopping processing`);
        break;
      }
      
      if (currentCampaign.status === 'cancelled') {
        logger.info(`CampaignJob: Campaign ${campaignId} cancelled, stopping processing`);
        break;
      }

      // Get next batch of queued targets
      const targets = await this.campaignTargetRepository.getQueuedTargets(
        campaignId, 
        this.config.batchSize
      );

      if (targets.length === 0) {
        logger.info(`CampaignJob: No more queued targets for campaign ${campaignId}`);
        break;
      }

      logger.info(`CampaignJob: Processing batch ${batchNumber} with ${targets.length} targets for campaign ${campaignId}`);

      // Process batch
      await this.processBatch(campaign, targets, job);
      
      processedCount += targets.length;
      batchNumber++;

      // Update job progress
      const progress = Math.round((processedCount / campaign.total_targets) * 100);
      job.progress(progress);

      // Emit progress event
      if (processedCount % this.config.progressUpdateInterval === 0 || targets.length < this.config.batchSize) {
        const currentStats = await this.campaignTargetRepository.getStatistics(campaignId);
        
        this.socketManager.emitToDevice(campaign.device_id, 'campaign:progress', {
          campaignId: campaignId,
          processed: processedCount,
          total: campaign.total_targets,
          percentage: progress,
          statistics: currentStats,
          timestamp: new Date()
        });
      }

      // Add delay between batches if configured
      if (targets.length === this.config.batchSize) {
        const delay = this.calculateBatchDelay(campaign);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    return {
      processedCount: processedCount,
      batchCount: batchNumber - 1
    };
  }

  /**
   * Process a batch of targets
   */
  async processBatch(campaign, targets, job) {
    const promises = [];
    
    for (const target of targets) {
      // Update target status to sending
      await this.campaignTargetRepository.updateStatus(target.id, 'sending');
      
      // Create message job
      const messagePromise = this.createMessageJob(campaign, target);
      promises.push(messagePromise);
      
      // Limit concurrent processing
      if (promises.length >= this.config.maxConcurrent) {
        await Promise.allSettled(promises.splice(0, this.config.maxConcurrent));
      }
      
      // Add delay between messages if configured
      const messageDelay = this.calculateMessageDelay(campaign);
      if (messageDelay > 0) {
        await this.sleep(messageDelay);
      }
    }
    
    // Process remaining promises
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Create message job for target
   */
  async createMessageJob(campaign, target) {
    try {
      // Prepare message data
      const messageData = {
        type: 'send_message',
        deviceId: campaign.device_id,
        userId: campaign.user_id,
        to: this.formatRecipient(target.target_number, target.target_type),
        messageType: campaign.message_type,
        content: this.processMessageContent(campaign.message_content, target),
        options: {
          priority: 5, // Medium priority for campaign messages
          campaignId: campaign.id,
          targetId: target.id
        }
      };

      // Add to message queue
      const messageJob = await this.queueManager.addMessageJob(messageData, {
        priority: 5,
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.config.retryDelay
        }
      });

      // Update target with job ID
      await this.campaignTargetRepository.update(target.id, {
        job_id: messageJob.id,
        status: 'sent' // Will be updated by message job callbacks
      });

      logger.debug(`CampaignJob: Created message job ${messageJob.id} for target ${target.id}`);

      return {
        success: true,
        targetId: target.id,
        jobId: messageJob.id
      };

    } catch (error) {
      logger.error(`CampaignJob: Error creating message job for target ${target.id}:`, error);
      
      // Update target status to failed
      await this.campaignTargetRepository.updateStatus(target.id, 'failed', {
        error_message: error.message
      });

      return {
        success: false,
        targetId: target.id,
        error: error.message
      };
    }
  }

  /**
   * Process message content with variables
   */
  processMessageContent(content, target) {
    let processedContent = JSON.parse(JSON.stringify(content));
    
    // Available variables
    const variables = {
      '{name}': target.target_name || target.target_number,
      '{number}': target.target_number,
      '{time}': new Date().toLocaleTimeString(),
      '{date}': new Date().toLocaleDateString(),
      '{datetime}': new Date().toLocaleString()
    };
    
    // Process text content
    if (processedContent.text) {
      processedContent.text = this.replaceVariables(processedContent.text, variables);
    }
    
    // Process caption
    if (processedContent.caption) {
      processedContent.caption = this.replaceVariables(processedContent.caption, variables);
    }
    
    return processedContent;
  }

  /**
   * Replace variables in text
   */
  replaceVariables(text, variables) {
    let result = text;
    
    for (const [variable, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  /**
   * Format recipient based on type
   */
  formatRecipient(number, type) {
    if (type === 'group') {
      return number; // Group ID already includes @g.us
    }
    
    // For contacts and numbers, ensure @s.whatsapp.net format
    if (number.includes('@')) {
      return number;
    }
    
    return `${number}@s.whatsapp.net`;
  }

  /**
   * Calculate delay between batches
   */
  calculateBatchDelay(campaign) {
    // Base delay between batches (to avoid rate limits)
    return 5000; // 5 seconds
  }

  /**
   * Calculate delay between individual messages
   */
  calculateMessageDelay(campaign) {
    const minDelay = (campaign.delay_min || 1) * 1000;
    const maxDelay = (campaign.delay_max || 5) * 1000;
    
    if (campaign.randomize_delay) {
      return minDelay + Math.random() * (maxDelay - minDelay);
    }
    
    return minDelay;
  }

  /**
   * Retry failed targets
   */
  async retryFailedTargets(data, job) {
    const { campaignId, deviceId, userId } = data;
    
    // Get campaign
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get failed targets that can be retried
    const failedTargets = await this.campaignTargetRepository.getFailedTargetsForRetry(
      campaignId, 
      this.config.maxRetries
    );

    if (failedTargets.length === 0) {
      logger.info(`CampaignJob: No failed targets to retry for campaign ${campaignId}`);
      return { success: true, message: 'No targets to retry' };
    }

    logger.info(`CampaignJob: Retrying ${failedTargets.length} failed targets for campaign ${campaignId}`);

    // Reset targets to queued status
    for (const target of failedTargets) {
      await this.campaignTargetRepository.updateStatus(target.id, 'queued');
      await this.campaignTargetRepository.incrementRetryCount(target.id);
    }

    // Update campaign status to running
    await this.campaignRepository.updateStatus(campaignId, 'running');

    // Process retry batch
    await this.processBatch(campaign, failedTargets, job);

    // Emit retry completed event
    this.socketManager.emitToDevice(deviceId, 'campaign:retry_completed', {
      campaignId: campaignId,
      retriedCount: failedTargets.length,
      timestamp: new Date()
    });

    return {
      success: true,
      campaignId: campaignId,
      retriedCount: failedTargets.length
    };
  }

  /**
   * Schedule recurring campaign
   */
  async scheduleRecurring(data, job) {
    const { campaignId, deviceId, userId } = data;
    
    // Get campaign
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign || campaign.schedule_type !== 'recurring') {
      return { success: true, message: 'Campaign is not recurring' };
    }

    // Calculate next execution time based on recurring pattern
    const nextExecution = this.calculateNextExecution(campaign.recurring_pattern);
    
    if (nextExecution) {
      // Schedule next execution
      const delay = nextExecution.getTime() - Date.now();
      
      await this.queueManager.addCampaignJob({
        type: 'process_campaign',
        campaignId: campaignId,
        deviceId: deviceId,
        userId: userId
      }, {
        delay: delay,
        jobId: `recurring_${campaignId}_${nextExecution.getTime()}`
      });

      logger.info(`CampaignJob: Scheduled next recurring execution for campaign ${campaignId} at ${nextExecution}`);
    }

    return {
      success: true,
      nextExecution: nextExecution
    };
  }

  /**
   * Calculate next execution time for recurring campaign
   */
  calculateNextExecution(recurringPattern) {
    if (!recurringPattern || !recurringPattern.frequency) {
      return null;
    }

    const now = new Date();
    const { frequency, interval = 1 } = recurringPattern;

    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + (interval * 24 * 60 * 60 * 1000));
      
      case 'weekly':
        return new Date(now.getTime() + (interval * 7 * 24 * 60 * 60 * 1000));
      
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + interval);
        return nextMonth;
      
      default:
        return null;
    }
  }

  /**
   * Schedule retry job for failed targets
   */
  async scheduleRetryJob(campaignId, deviceId, userId) {
    try {
      // Schedule retry after delay
      await this.queueManager.addCampaignJob({
        type: 'retry_failed_targets',
        campaignId: campaignId,
        deviceId: deviceId,
        userId: userId
      }, {
        delay: this.config.retryDelay,
        jobId: `retry_${campaignId}_${Date.now()}`
      });

      logger.info(`CampaignJob: Scheduled retry job for campaign ${campaignId}`);

    } catch (error) {
      logger.error(`CampaignJob: Error scheduling retry job for campaign ${campaignId}:`, error);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CampaignJob();