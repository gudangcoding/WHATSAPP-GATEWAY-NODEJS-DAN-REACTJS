const AIHistoryRepository = require('../repositories/AIHistoryRepository');
const QueueManager = require('../core/QueueManager');
const logger = require('../utils/logger');
const axios = require('axios');

class AIService {
  constructor() {
    this.aiHistoryRepository = new AIHistoryRepository();
    this.queueManager = QueueManager.getInstance();
    
    // AI Configuration
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 500;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    
    // Supported AI features
    this.supportedFeatures = [
      'message_variation',
      'content_optimization',
      'target_analysis',
      'campaign_optimization',
      'auto_reply_generation',
      'sentiment_analysis',
      'keyword_extraction',
      'translation',
      'paraphrasing',
      'content_generation'
    ];
  }

  /**
   * Generate message variations for campaigns
   */
  async generateMessageVariations(userId, messageData) {
    try {
      const { 
        originalMessage, 
        variationCount = 3, 
        style = 'casual', 
        language = 'id',
        targetAudience = 'general',
        messageType = 'text'
      } = messageData;

      if (!this.openaiApiKey) {
        throw new Error('AI service not configured. Please set OpenAI API key.');
      }

      // Add to AI job queue
      const jobData = {
        type: 'generate_variation',
        userId: userId,
        originalText: originalMessage,
        variationCount: variationCount,
        style: style,
        language: language,
        targetAudience: targetAudience,
        messageType: messageType
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 5,
        attempts: 3
      });

      logger.info(`AIService: Message variation job created for user ${userId}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Message variation generation started',
        estimatedTime: '30-60 seconds'
      };

    } catch (error) {
      logger.error('AIService: Error generating message variations:', error);
      throw error;
    }
  }

  /**
   * Optimize campaign content using AI
   */
  async optimizeCampaignContent(userId, campaignData) {
    try {
      const {
        campaignId,
        messageContent,
        targetType,
        targetFilters,
        goals = ['engagement', 'conversion'],
        language = 'id'
      } = campaignData;

      const jobData = {
        type: 'optimize_campaign_content',
        userId: userId,
        campaignId: campaignId,
        messageContent: messageContent,
        targetType: targetType,
        targetFilters: targetFilters,
        goals: goals,
        language: language
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 4,
        attempts: 3
      });

      logger.info(`AIService: Campaign optimization job created for campaign ${campaignId}`);

      return {
        success: true,
        jobId: job.id,
        campaignId: campaignId,
        message: 'Campaign content optimization started',
        estimatedTime: '1-2 minutes'
      };

    } catch (error) {
      logger.error('AIService: Error optimizing campaign content:', error);
      throw error;
    }
  }

  /**
   * Analyze target audience for better campaign targeting
   */
  async analyzeTargetAudience(userId, targetData) {
    try {
      const {
        deviceId,
        targetType,
        targetFilters,
        analysisType = 'comprehensive'
      } = targetData;

      const jobData = {
        type: 'analyze_target_audience',
        userId: userId,
        deviceId: deviceId,
        targetType: targetType,
        targetFilters: targetFilters,
        analysisType: analysisType
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 3,
        attempts: 3
      });

      logger.info(`AIService: Target audience analysis job created for device ${deviceId}`);

      return {
        success: true,
        jobId: job.id,
        deviceId: deviceId,
        message: 'Target audience analysis started',
        estimatedTime: '2-3 minutes'
      };

    } catch (error) {
      logger.error('AIService: Error analyzing target audience:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent auto reply suggestions
   */
  async generateAutoReplyIntelligent(userId, replyData) {
    try {
      const {
        deviceId,
        incomingMessage,
        messageHistory = [],
        contactInfo = {},
        businessContext = '',
        tone = 'professional',
        language = 'id'
      } = replyData;

      const jobData = {
        type: 'generate_intelligent_auto_reply',
        userId: userId,
        deviceId: deviceId,
        incomingMessage: incomingMessage,
        messageHistory: messageHistory,
        contactInfo: contactInfo,
        businessContext: businessContext,
        tone: tone,
        language: language
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 8, // High priority for real-time responses
        attempts: 2
      });

      logger.info(`AIService: Intelligent auto reply job created for device ${deviceId}`);

      return {
        success: true,
        jobId: job.id,
        deviceId: deviceId,
        message: 'Intelligent auto reply generation started',
        estimatedTime: '10-30 seconds'
      };

    } catch (error) {
      logger.error('AIService: Error generating intelligent auto reply:', error);
      throw error;
    }
  }

  /**
   * Analyze message sentiment and extract insights
   */
  async analyzeMessageSentiment(userId, messageData) {
    try {
      const {
        messages,
        includeKeywords = true,
        includeTopics = true,
        language = 'id'
      } = messageData;

      const jobData = {
        type: 'analyze_message_sentiment',
        userId: userId,
        messages: messages,
        includeKeywords: includeKeywords,
        includeTopics: includeTopics,
        language: language
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 6,
        attempts: 3
      });

      logger.info(`AIService: Message sentiment analysis job created for user ${userId}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Message sentiment analysis started',
        estimatedTime: '30-90 seconds'
      };

    } catch (error) {
      logger.error('AIService: Error analyzing message sentiment:', error);
      throw error;
    }
  }

  /**
   * Generate campaign performance predictions
   */
  async predictCampaignPerformance(userId, predictionData) {
    try {
      const {
        campaignId,
        messageContent,
        targetCount,
        targetType,
        historicalData = [],
        timeframe = '24h'
      } = predictionData;

      const jobData = {
        type: 'predict_campaign_performance',
        userId: userId,
        campaignId: campaignId,
        messageContent: messageContent,
        targetCount: targetCount,
        targetType: targetType,
        historicalData: historicalData,
        timeframe: timeframe
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 4,
        attempts: 3
      });

      logger.info(`AIService: Campaign performance prediction job created for campaign ${campaignId}`);

      return {
        success: true,
        jobId: job.id,
        campaignId: campaignId,
        message: 'Campaign performance prediction started',
        estimatedTime: '1-2 minutes'
      };

    } catch (error) {
      logger.error('AIService: Error predicting campaign performance:', error);
      throw error;
    }
  }

  /**
   * Optimize message timing using AI
   */
  async optimizeMessageTiming(userId, timingData) {
    try {
      const {
        deviceId,
        targetAudience,
        messageType,
        historicalEngagement = [],
        timezone = 'Asia/Jakarta'
      } = timingData;

      const jobData = {
        type: 'optimize_message_timing',
        userId: userId,
        deviceId: deviceId,
        targetAudience: targetAudience,
        messageType: messageType,
        historicalEngagement: historicalEngagement,
        timezone: timezone
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 5,
        attempts: 3
      });

      logger.info(`AIService: Message timing optimization job created for device ${deviceId}`);

      return {
        success: true,
        jobId: job.id,
        deviceId: deviceId,
        message: 'Message timing optimization started',
        estimatedTime: '1-2 minutes'
      };

    } catch (error) {
      logger.error('AIService: Error optimizing message timing:', error);
      throw error;
    }
  }

  /**
   * Generate content suggestions based on trends
   */
  async generateContentSuggestions(userId, suggestionData) {
    try {
      const {
        industry = 'general',
        targetAudience = 'general',
        contentType = 'promotional',
        language = 'id',
        trends = [],
        businessGoals = []
      } = suggestionData;

      const jobData = {
        type: 'generate_content_suggestions',
        userId: userId,
        industry: industry,
        targetAudience: targetAudience,
        contentType: contentType,
        language: language,
        trends: trends,
        businessGoals: businessGoals
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 4,
        attempts: 3
      });

      logger.info(`AIService: Content suggestions job created for user ${userId}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Content suggestions generation started',
        estimatedTime: '1-2 minutes'
      };

    } catch (error) {
      logger.error('AIService: Error generating content suggestions:', error);
      throw error;
    }
  }

  /**
   * Translate messages with context awareness
   */
  async translateMessageContextual(userId, translationData) {
    try {
      const {
        message,
        fromLanguage,
        toLanguage,
        context = '',
        tone = 'neutral',
        preserveFormatting = true
      } = translationData;

      const jobData = {
        type: 'translate_contextual',
        userId: userId,
        message: message,
        fromLanguage: fromLanguage,
        toLanguage: toLanguage,
        context: context,
        tone: tone,
        preserveFormatting: preserveFormatting
      };

      const job = await this.queueManager.addAIJob(jobData, {
        priority: 7,
        attempts: 3
      });

      logger.info(`AIService: Contextual translation job created for user ${userId}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Contextual translation started',
        estimatedTime: '20-40 seconds'
      };

    } catch (error) {
      logger.error('AIService: Error translating message:', error);
      throw error;
    }
  }

  /**
   * Get AI usage statistics for user
   */
  async getAIUsageStatistics(userId, timeframe = '30d') {
    try {
      const stats = await this.aiHistoryRepository.getUsageStats(timeframe);
      const performanceMetrics = await this.aiHistoryRepository.getPerformanceMetrics(timeframe);
      const mostUsedFeatures = await this.aiHistoryRepository.getMostUsedFeatures(10, timeframe);
      const tokenUsageByModel = await this.aiHistoryRepository.getTokenUsageByModel(timeframe);

      return {
        success: true,
        data: {
          overview: {
            timeframe: timeframe,
            total_requests: stats.total,
            total_tokens: stats.tokens,
            estimated_cost: this.calculateEstimatedCost(stats.tokens),
            avg_tokens_per_request: stats.total > 0 ? Math.round(stats.tokens / stats.total) : 0
          },
          performance: performanceMetrics,
          feature_usage: mostUsedFeatures,
          model_usage: tokenUsageByModel,
          requests_by_type: stats.by_type
        }
      };

    } catch (error) {
      logger.error('AIService: Error getting AI usage statistics:', error);
      throw error;
    }
  }

  /**
   * Get AI job status
   */
  async getAIJobStatus(jobId) {
    try {
      const jobStatus = await this.queueManager.getJobStatus(jobId);
      
      return {
        success: true,
        jobId: jobId,
        status: jobStatus.status,
        progress: jobStatus.progress,
        result: jobStatus.result,
        error: jobStatus.error,
        createdAt: jobStatus.createdAt,
        completedAt: jobStatus.completedAt
      };

    } catch (error) {
      logger.error('AIService: Error getting AI job status:', error);
      throw error;
    }
  }

  /**
   * Test AI service connection
   */
  async testAIConnection() {
    try {
      if (!this.openaiApiKey) {
        return {
          success: false,
          message: 'OpenAI API key not configured',
          configured: false
        };
      }

      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: this.defaultModel,
          messages: [
            {
              role: 'user',
              content: 'Say "AI service is working!" in a friendly way.'
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        message: 'AI service connection successful',
        configured: true,
        model: response.data.model,
        response: response.data.choices[0].message.content.trim(),
        tokensUsed: response.data.usage?.total_tokens || 0
      };

    } catch (error) {
      logger.error('AIService: AI connection test failed:', error);
      
      return {
        success: false,
        message: `AI connection failed: ${error.message}`,
        configured: true,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get AI feature recommendations for user
   */
  async getAIFeatureRecommendations(userId, userActivity = {}) {
    try {
      const {
        campaignCount = 0,
        messageCount = 0,
        autoReplyCount = 0,
        contactCount = 0,
        industry = 'general'
      } = userActivity;

      const recommendations = [];

      // Recommend based on usage patterns
      if (campaignCount > 5 && messageCount > 100) {
        recommendations.push({
          feature: 'message_variation',
          title: 'Message Variations',
          description: 'Generate multiple variations of your campaign messages to improve engagement',
          priority: 'high',
          estimatedBenefit: 'Increase engagement by 15-25%'
        });

        recommendations.push({
          feature: 'campaign_optimization',
          title: 'Campaign Optimization',
          description: 'AI-powered optimization of your campaign content and targeting',
          priority: 'high',
          estimatedBenefit: 'Improve campaign performance by 20-30%'
        });
      }

      if (autoReplyCount > 10) {
        recommendations.push({
          feature: 'intelligent_auto_reply',
          title: 'Intelligent Auto Replies',
          description: 'Context-aware auto replies that understand conversation history',
          priority: 'medium',
          estimatedBenefit: 'Reduce response time by 80%'
        });
      }

      if (contactCount > 500) {
        recommendations.push({
          feature: 'target_analysis',
          title: 'Target Audience Analysis',
          description: 'AI analysis of your contacts for better targeting and segmentation',
          priority: 'medium',
          estimatedBenefit: 'Improve targeting accuracy by 25%'
        });
      }

      // Always recommend basic features
      recommendations.push({
        feature: 'sentiment_analysis',
        title: 'Message Sentiment Analysis',
        description: 'Understand the sentiment and tone of incoming messages',
        priority: 'low',
        estimatedBenefit: 'Better customer understanding'
      });

      recommendations.push({
        feature: 'translation',
        title: 'Smart Translation',
        description: 'Context-aware translation for multilingual communication',
        priority: 'low',
        estimatedBenefit: 'Expand to international markets'
      });

      return {
        success: true,
        recommendations: recommendations,
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length
      };

    } catch (error) {
      logger.error('AIService: Error getting AI feature recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated cost based on tokens
   */
  calculateEstimatedCost(tokens) {
    // Rough estimation for GPT-3.5-turbo pricing
    const costPer1kTokens = 0.002; // $0.002 per 1K tokens
    return (tokens / 1000) * costPer1kTokens;
  }

  /**
   * Validate AI feature availability
   */
  validateFeature(feature) {
    if (!this.supportedFeatures.includes(feature)) {
      throw new Error(`AI feature '${feature}' is not supported. Available features: ${this.supportedFeatures.join(', ')}`);
    }

    if (!this.openaiApiKey) {
      throw new Error('AI service not configured. Please set OpenAI API key.');
    }

    return true;
  }

  /**
   * Get AI service health status
   */
  async getHealthStatus() {
    try {
      const connectionTest = await this.testAIConnection();
      const recentStats = await this.aiHistoryRepository.getPerformanceMetrics('1h');
      
      return {
        success: true,
        status: connectionTest.success ? 'healthy' : 'unhealthy',
        connection: connectionTest,
        configuration: {
          apiKeyConfigured: !!this.openaiApiKey,
          baseUrl: this.openaiBaseUrl,
          defaultModel: this.defaultModel,
          maxTokens: this.maxTokens,
          temperature: this.temperature
        },
        recentActivity: {
          requests_last_hour: recentStats.total_requests || 0,
          tokens_last_hour: recentStats.total_tokens || 0,
          avg_response_time: '< 30s', // This would need actual timing data
          error_rate: '< 1%' // This would need actual error tracking
        },
        supportedFeatures: this.supportedFeatures
      };

    } catch (error) {
      logger.error('AIService: Error getting health status:', error);
      
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        configuration: {
          apiKeyConfigured: !!this.openaiApiKey,
          baseUrl: this.openaiBaseUrl,
          defaultModel: this.defaultModel
        }
      };
    }
  }
}

module.exports = AIService;