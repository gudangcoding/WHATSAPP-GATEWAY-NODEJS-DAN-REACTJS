const Queue = require('bull');
const Redis = require('ioredis');
const logger = require('../utils/logger');

class QueueManager {
  constructor() {
    this.redis = null;
    this.queues = new Map();
    this.processors = new Map();
    
    // Queue configurations
    this.queueConfigs = {
      message: {
        name: 'message-queue',
        concurrency: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
      campaign: {
        name: 'campaign-queue',
        concurrency: 3,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      },
      autoReply: {
        name: 'auto-reply-queue',
        concurrency: 10,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000
        }
      },
      contactScrape: {
        name: 'contact-scrape-queue',
        concurrency: 2,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000
        }
      },
      webhook: {
        name: 'webhook-queue',
        concurrency: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      },
      ai: {
        name: 'ai-queue',
        concurrency: 3,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 2000
        }
      }
    };
  }

  /**
   * Initialize Queue Manager
   */
  async init() {
    try {
      // Initialize Redis connection
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true
      });

      // Test Redis connection
      await this.redis.ping();
      logger.info('QueueManager: Redis connection established');

      // Initialize queues
      await this.initializeQueues();

      // Setup queue event handlers
      this.setupQueueEvents();

      // Register job processors
      this.registerProcessors();

      logger.info('QueueManager: Initialized successfully');

    } catch (error) {
      logger.error('QueueManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all queues
   */
  async initializeQueues() {
    for (const [queueType, config] of Object.entries(this.queueConfigs)) {
      const queue = new Queue(config.name, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined
        },
        defaultJobOptions: {
          attempts: config.attempts,
          backoff: config.backoff,
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      this.queues.set(queueType, queue);
      logger.info(`QueueManager: Queue '${config.name}' initialized`);
    }
  }

  /**
   * Setup queue event handlers
   */
  setupQueueEvents() {
    for (const [queueType, queue] of this.queues) {
      // Job completed
      queue.on('completed', (job, result) => {
        logger.debug(`QueueManager: Job ${job.id} in queue '${queueType}' completed:`, result);
      });

      // Job failed
      queue.on('failed', (job, err) => {
        logger.error(`QueueManager: Job ${job.id} in queue '${queueType}' failed:`, err);
      });

      // Job stalled
      queue.on('stalled', (job) => {
        logger.warn(`QueueManager: Job ${job.id} in queue '${queueType}' stalled`);
      });

      // Queue error
      queue.on('error', (error) => {
        logger.error(`QueueManager: Queue '${queueType}' error:`, error);
      });
    }
  }

  /**
   * Register job processors
   */
  registerProcessors() {
    // Message queue processor
    this.registerProcessor('message', require('../jobs/MessageJob'));
    
    // Campaign queue processor
    this.registerProcessor('campaign', require('../jobs/CampaignJob'));
    
    // Auto reply queue processor
    this.registerProcessor('autoReply', require('../jobs/AutoReplyJob'));
    
    // Contact scrape queue processor
    this.registerProcessor('contactScrape', require('../jobs/ContactScrapeJob'));
    
    // Webhook queue processor
    this.registerProcessor('webhook', require('../jobs/WebhookJob'));
    
    // AI queue processor
    this.registerProcessor('ai', require('../jobs/AIJob'));
  }

  /**
   * Register a job processor for a queue
   */
  registerProcessor(queueType, processor) {
    const queue = this.queues.get(queueType);
    const config = this.queueConfigs[queueType];
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    // Register processor with concurrency
    queue.process(config.concurrency, async (job) => {
      try {
        logger.debug(`QueueManager: Processing job ${job.id} in queue '${queueType}'`);
        
        const result = await processor.process(job.data, job);
        
        logger.debug(`QueueManager: Job ${job.id} processed successfully`);
        return result;
        
      } catch (error) {
        logger.error(`QueueManager: Job ${job.id} processing failed:`, error);
        throw error;
      }
    });

    this.processors.set(queueType, processor);
    logger.info(`QueueManager: Processor registered for queue '${queueType}'`);
  }

  /**
   * Add job to queue
   */
  async addJob(queueType, jobData, options = {}) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    try {
      const job = await queue.add(jobData, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        repeat: options.repeat || undefined,
        jobId: options.jobId || undefined,
        ...options
      });

      logger.debug(`QueueManager: Job ${job.id} added to queue '${queueType}'`);
      return job;
      
    } catch (error) {
      logger.error(`QueueManager: Failed to add job to queue '${queueType}':`, error);
      throw error;
    }
  }

  /**
   * Add message job
   */
  async addMessageJob(messageData, options = {}) {
    return await this.addJob('message', {
      type: 'send_message',
      ...messageData
    }, options);
  }

  /**
   * Add campaign job
   */
  async addCampaignJob(campaignData, options = {}) {
    return await this.addJob('campaign', {
      type: 'process_campaign',
      ...campaignData
    }, options);
  }

  /**
   * Add auto reply job
   */
  async addAutoReplyJob(replyData, options = {}) {
    return await this.addJob('autoReply', {
      type: 'process_auto_reply',
      ...replyData
    }, options);
  }

  /**
   * Add contact scrape job
   */
  async addContactScrapeJob(scrapeData, options = {}) {
    return await this.addJob('contactScrape', {
      type: 'scrape_contacts',
      ...scrapeData
    }, options);
  }

  /**
   * Add webhook job
   */
  async addWebhookJob(webhookData, options = {}) {
    return await this.addJob('webhook', {
      type: 'send_webhook',
      ...webhookData
    }, options);
  }

  /**
   * Add AI job
   */
  async addAIJob(aiData, options = {}) {
    return await this.addJob('ai', {
      type: 'generate_variation',
      ...aiData
    }, options);
  }

  /**
   * Get job by ID
   */
  async getJob(queueType, jobId) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    return await queue.getJob(jobId);
  }

  /**
   * Remove job by ID
   */
  async removeJob(queueType, jobId) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.debug(`QueueManager: Job ${jobId} removed from queue '${queueType}'`);
      return true;
    }
    
    return false;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueType) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = {};
    
    for (const queueType of this.queues.keys()) {
      stats[queueType] = await this.getQueueStats(queueType);
    }
    
    return stats;
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueType) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    await queue.pause();
    logger.info(`QueueManager: Queue '${queueType}' paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueType) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    await queue.resume();
    logger.info(`QueueManager: Queue '${queueType}' resumed`);
  }

  /**
   * Clean queue (remove old jobs)
   */
  async cleanQueue(queueType, grace = 24 * 60 * 60 * 1000) { // 24 hours default
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const cleaned = await queue.clean(grace, 'completed');
    logger.info(`QueueManager: Cleaned ${cleaned.length} completed jobs from queue '${queueType}'`);
    
    return cleaned.length;
  }

  /**
   * Get queue health status
   */
  async getQueueHealth() {
    const health = {
      redis: false,
      queues: {},
      overall: true
    };

    try {
      // Check Redis connection
      await this.redis.ping();
      health.redis = true;
    } catch (error) {
      health.redis = false;
      health.overall = false;
    }

    // Check each queue
    for (const [queueType, queue] of this.queues) {
      try {
        const stats = await this.getQueueStats(queueType);
        health.queues[queueType] = {
          status: 'healthy',
          stats
        };
      } catch (error) {
        health.queues[queueType] = {
          status: 'error',
          error: error.message
        };
        health.overall = false;
      }
    }

    return health;
  }

  /**
   * Schedule recurring job
   */
  async scheduleRecurringJob(queueType, jobData, cronPattern, options = {}) {
    return await this.addJob(queueType, jobData, {
      repeat: { cron: cronPattern },
      ...options
    });
  }

  /**
   * Schedule delayed job
   */
  async scheduleDelayedJob(queueType, jobData, delay, options = {}) {
    return await this.addJob(queueType, jobData, {
      delay,
      ...options
    });
  }

  /**
   * Bulk add jobs
   */
  async bulkAddJobs(queueType, jobs) {
    const queue = this.queues.get(queueType);
    
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const addedJobs = await queue.addBulk(jobs);
    logger.info(`QueueManager: Added ${addedJobs.length} jobs to queue '${queueType}'`);
    
    return addedJobs;
  }

  /**
   * Get queue instance
   */
  getQueue(queueType) {
    return this.queues.get(queueType);
  }

  /**
   * Close all queues and Redis connection
   */
  async close() {
    logger.info('QueueManager: Closing all queues...');
    
    // Close all queues
    for (const [queueType, queue] of this.queues) {
      await queue.close();
      logger.info(`QueueManager: Queue '${queueType}' closed`);
    }

    // Close Redis connection
    if (this.redis) {
      await this.redis.disconnect();
      logger.info('QueueManager: Redis connection closed');
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new QueueManager();
    }
    return instance;
  },
  QueueManager
};