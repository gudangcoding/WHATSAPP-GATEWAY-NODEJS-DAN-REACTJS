const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');

class WebhookJob {
  constructor() {
    this.maxRetries = 3;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Process webhook job
   */
  async process(data, job) {
    const { type, webhookUrl, payload, headers = {}, retryCount = 0 } = data;
    
    logger.info(`WebhookJob: Processing ${type} to ${webhookUrl}`);
    
    try {
      switch (type) {
        case 'send_webhook':
          return await this.sendWebhook(data, job);
        case 'message_received':
          return await this.sendMessageWebhook(data, job);
        case 'device_status':
          return await this.sendDeviceStatusWebhook(data, job);
        case 'campaign_update':
          return await this.sendCampaignWebhook(data, job);
        default:
          throw new Error(`Unknown webhook job type: ${type}`);
      }
    } catch (error) {
      logger.error(`WebhookJob: Error processing ${type}:`, error);
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        logger.info(`WebhookJob: Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        // Schedule retry
        const QueueManager = require('../core/QueueManager').getInstance();
        await QueueManager.addWebhookJob({
          ...data,
          retryCount: retryCount + 1
        }, { delay });
        
        return { success: false, retry: true, retryCount: retryCount + 1 };
      }
      
      throw error;
    }
  }

  /**
   * Send generic webhook
   */
  async sendWebhook(data, job) {
    const { webhookUrl, payload, headers, method = 'POST', secret } = data;
    
    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-Gateway-Webhook/1.0',
      ...headers
    };

    // Add signature if secret is provided
    if (secret) {
      const signature = this.generateSignature(payload, secret);
      requestHeaders['X-Webhook-Signature'] = signature;
    }

    // Add timestamp
    requestHeaders['X-Webhook-Timestamp'] = Date.now().toString();

    try {
      const response = await axios({
        method,
        url: webhookUrl,
        data: payload,
        headers: requestHeaders,
        timeout: this.timeout,
        validateStatus: (status) => status < 500 // Don't retry on 4xx errors
      });

      const result = {
        success: true,
        statusCode: response.status,
        responseData: response.data,
        responseHeaders: response.headers,
        timestamp: new Date()
      };

      logger.info(`WebhookJob: Webhook sent successfully to ${webhookUrl}`, {
        statusCode: response.status,
        responseSize: JSON.stringify(response.data).length
      });

      return result;

    } catch (error) {
      const result = {
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        timestamp: new Date()
      };

      // Don't retry on 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        logger.warn(`WebhookJob: Client error ${error.response.status}, not retrying:`, error.message);
        return result;
      }

      throw error;
    }
  }

  /**
   * Send message received webhook
   */
  async sendMessageWebhook(data, job) {
    const { webhookUrl, deviceId, message, device, secret } = data;
    
    const payload = {
      event: 'message.received',
      timestamp: new Date().toISOString(),
      device: {
        id: device.id,
        name: device.name,
        phone_number: device.phone_number
      },
      message: {
        id: message.id,
        message_id: message.message_id,
        from_number: message.from_number,
        to_number: message.to_number,
        type: message.type,
        content: message.content,
        is_group: message.is_group,
        group_id: message.group_id,
        timestamp: message.created_at,
        metadata: message.metadata
      }
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'message_received'
    }, job);
  }

  /**
   * Send device status webhook
   */
  async sendDeviceStatusWebhook(data, job) {
    const { webhookUrl, deviceId, device, status, previousStatus, secret } = data;
    
    const payload = {
      event: 'device.status_changed',
      timestamp: new Date().toISOString(),
      device: {
        id: device.id,
        name: device.name,
        phone_number: device.phone_number,
        status: status,
        previous_status: previousStatus,
        last_seen: device.last_seen
      }
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'device_status'
    }, job);
  }

  /**
   * Send campaign update webhook
   */
  async sendCampaignWebhook(data, job) {
    const { webhookUrl, campaignId, campaign, status, stats, secret } = data;
    
    const payload = {
      event: 'campaign.updated',
      timestamp: new Date().toISOString(),
      campaign: {
        id: campaign.id,
        name: campaign.name,
        device_id: campaign.device_id,
        status: status,
        created_at: campaign.created_at,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at
      },
      statistics: stats
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'campaign_update'
    }, job);
  }

  /**
   * Generate webhook signature
   */
  generateSignature(payload, secret) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    return `sha256=${signature}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Send message status webhook
   */
  async sendMessageStatusWebhook(data, job) {
    const { webhookUrl, deviceId, message, status, secret } = data;
    
    const payload = {
      event: 'message.status_updated',
      timestamp: new Date().toISOString(),
      device_id: deviceId,
      message: {
        id: message.id,
        message_id: message.message_id,
        to_number: message.to_number,
        status: status,
        sent_at: message.sent_at,
        delivered_at: message.delivered_at,
        read_at: message.read_at
      }
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'message_status'
    }, job);
  }

  /**
   * Send auto reply webhook
   */
  async sendAutoReplyWebhook(data, job) {
    const { webhookUrl, deviceId, autoReply, triggerMessage, replyMessage, secret } = data;
    
    const payload = {
      event: 'auto_reply.triggered',
      timestamp: new Date().toISOString(),
      device_id: deviceId,
      auto_reply: {
        id: autoReply.id,
        name: autoReply.name,
        match_type: autoReply.match_type,
        keywords: autoReply.keywords
      },
      trigger: {
        message_id: triggerMessage.message_id,
        from_number: triggerMessage.from_number,
        content: triggerMessage.content,
        timestamp: triggerMessage.created_at
      },
      reply: {
        message_id: replyMessage.message_id,
        content: replyMessage.content,
        type: replyMessage.type,
        timestamp: replyMessage.created_at
      }
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'auto_reply'
    }, job);
  }

  /**
   * Send bulk webhook for multiple events
   */
  async sendBulkWebhook(data, job) {
    const { webhookUrl, events, secret } = data;
    
    const payload = {
      event: 'bulk.events',
      timestamp: new Date().toISOString(),
      events: events,
      count: events.length
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'bulk_events'
    }, job);
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(data, job) {
    const { webhookUrl, secret } = data;
    
    const payload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook from WhatsApp Gateway',
      test_data: {
        random_number: Math.floor(Math.random() * 1000),
        timestamp: Date.now()
      }
    };

    return await this.sendWebhook({
      webhookUrl,
      payload,
      secret,
      type: 'webhook_test'
    }, job);
  }

  /**
   * Log webhook result
   */
  async logWebhookResult(webhookUrl, payload, result) {
    try {
      const WebhookLogRepository = require('../repositories/WebhookLogRepository');
      const logRepository = new WebhookLogRepository();
      
      const logData = {
        webhook_url: webhookUrl,
        payload: JSON.stringify(payload),
        status_code: result.statusCode,
        response_data: JSON.stringify(result.responseData),
        success: result.success,
        error_message: result.error,
        executed_at: new Date()
      };
      
      await logRepository.create(logData);
      
    } catch (error) {
      logger.error('WebhookJob: Error logging webhook result:', error);
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookUrl, timeframe = '24h') {
    try {
      const WebhookLogRepository = require('../repositories/WebhookLogRepository');
      const logRepository = new WebhookLogRepository();
      
      const stats = await logRepository.getStatsByUrl(webhookUrl, timeframe);
      
      return {
        url: webhookUrl,
        timeframe,
        total_requests: stats.total,
        successful_requests: stats.success,
        failed_requests: stats.failed,
        success_rate: stats.total > 0 ? (stats.success / stats.total * 100).toFixed(2) : 0,
        average_response_time: stats.avg_response_time,
        last_request: stats.last_request
      };
      
    } catch (error) {
      logger.error('WebhookJob: Error getting webhook stats:', error);
      return null;
    }
  }
}

module.exports = new WebhookJob();