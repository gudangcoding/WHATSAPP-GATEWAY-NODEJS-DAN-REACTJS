const AIService = require('../services/AIService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class AIController {
  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Generate message variations
   * POST /api/v1/ai/message-variations
   */
  async generateMessageVariations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.generateMessageVariations(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Message variation generation started'
      });

    } catch (error) {
      logger.error('AIController: Error generating message variations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate message variations'
      });
    }
  }

  /**
   * Optimize campaign content
   * POST /api/v1/ai/optimize-campaign
   */
  async optimizeCampaignContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.optimizeCampaignContent(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Campaign optimization started'
      });

    } catch (error) {
      logger.error('AIController: Error optimizing campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to optimize campaign'
      });
    }
  }

  /**
   * Analyze target audience
   * POST /api/v1/ai/analyze-audience
   */
  async analyzeTargetAudience(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.analyzeTargetAudience(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Target audience analysis started'
      });

    } catch (error) {
      logger.error('AIController: Error analyzing target audience:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze target audience'
      });
    }
  }

  /**
   * Generate intelligent auto reply
   * POST /api/v1/ai/intelligent-auto-reply
   */
  async generateIntelligentAutoReply(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.generateAutoReplyIntelligent(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Intelligent auto reply generation started'
      });

    } catch (error) {
      logger.error('AIController: Error generating intelligent auto reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate intelligent auto reply'
      });
    }
  }

  /**
   * Analyze message sentiment
   * POST /api/v1/ai/analyze-sentiment
   */
  async analyzeMessageSentiment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.analyzeMessageSentiment(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Message sentiment analysis started'
      });

    } catch (error) {
      logger.error('AIController: Error analyzing sentiment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze sentiment'
      });
    }
  }

  /**
   * Predict campaign performance
   * POST /api/v1/ai/predict-performance
   */
  async predictCampaignPerformance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.predictCampaignPerformance(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Campaign performance prediction started'
      });

    } catch (error) {
      logger.error('AIController: Error predicting performance:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to predict campaign performance'
      });
    }
  }

  /**
   * Optimize message timing
   * POST /api/v1/ai/optimize-timing
   */
  async optimizeMessageTiming(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.optimizeMessageTiming(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Message timing optimization started'
      });

    } catch (error) {
      logger.error('AIController: Error optimizing timing:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to optimize message timing'
      });
    }
  }

  /**
   * Generate content suggestions
   * POST /api/v1/ai/content-suggestions
   */
  async generateContentSuggestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.generateContentSuggestions(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Content suggestions generation started'
      });

    } catch (error) {
      logger.error('AIController: Error generating content suggestions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate content suggestions'
      });
    }
  }

  /**
   * Translate message with context
   * POST /api/v1/ai/translate
   */
  async translateMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const result = await this.aiService.translateMessageContextual(userId, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Translation started'
      });

    } catch (error) {
      logger.error('AIController: Error translating message:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to translate message'
      });
    }
  }

  /**
   * Get AI usage statistics
   * GET /api/v1/ai/statistics
   */
  async getAIStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { timeframe = '30d' } = req.query;

      const result = await this.aiService.getAIUsageStatistics(userId, timeframe);

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      logger.error('AIController: Error getting AI statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get AI statistics'
      });
    }
  }

  /**
   * Get AI job status
   * GET /api/v1/ai/jobs/:jobId
   */
  async getAIJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const result = await this.aiService.getAIJobStatus(jobId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('AIController: Error getting job status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get job status'
      });
    }
  }

  /**
   * Test AI connection
   * GET /api/v1/ai/test-connection
   */
  async testAIConnection(req, res) {
    try {
      const result = await this.aiService.testAIConnection();

      res.json({
        success: result.success,
        data: result
      });

    } catch (error) {
      logger.error('AIController: Error testing AI connection:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to test AI connection'
      });
    }
  }

  /**
   * Get AI feature recommendations
   * GET /api/v1/ai/recommendations
   */
  async getAIRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const userActivity = req.query;

      const result = await this.aiService.getAIFeatureRecommendations(userId, userActivity);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('AIController: Error getting AI recommendations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get AI recommendations'
      });
    }
  }

  /**
   * Get AI service health
   * GET /api/v1/ai/health
   */
  async getAIHealth(req, res) {
    try {
      const result = await this.aiService.getHealthStatus();

      res.json({
        success: result.success,
        data: result
      });

    } catch (error) {
      logger.error('AIController: Error getting AI health:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get AI health status'
      });
    }
  }

  /**
   * Get AI templates
   * GET /api/v1/ai/templates
   */
  async getAITemplates(req, res) {
    try {
      const { category = 'all', language = 'id' } = req.query;

      // Predefined AI templates
      const templates = {
        message_variations: [
          {
            id: 'casual_friendly',
            name: 'Casual & Friendly',
            description: 'Generate casual and friendly message variations',
            style: 'casual',
            tone: 'friendly',
            language: language,
            example: 'Transform formal messages into casual, approachable content'
          },
          {
            id: 'professional_formal',
            name: 'Professional & Formal',
            description: 'Generate professional and formal message variations',
            style: 'professional',
            tone: 'formal',
            language: language,
            example: 'Create polished, business-appropriate message versions'
          },
          {
            id: 'persuasive_sales',
            name: 'Persuasive & Sales',
            description: 'Generate persuasive sales-oriented variations',
            style: 'persuasive',
            tone: 'confident',
            language: language,
            example: 'Optimize messages for conversion and sales'
          }
        ],
        auto_reply: [
          {
            id: 'customer_service',
            name: 'Customer Service',
            description: 'Intelligent customer service auto replies',
            tone: 'helpful',
            context: 'customer_support',
            language: language,
            example: 'Context-aware responses for customer inquiries'
          },
          {
            id: 'sales_inquiry',
            name: 'Sales Inquiry',
            description: 'Smart responses for sales inquiries',
            tone: 'professional',
            context: 'sales',
            language: language,
            example: 'Intelligent responses to product and pricing questions'
          },
          {
            id: 'appointment_booking',
            name: 'Appointment Booking',
            description: 'Automated appointment booking assistance',
            tone: 'friendly',
            context: 'scheduling',
            language: language,
            example: 'Help customers book appointments automatically'
          }
        ],
        campaign_optimization: [
          {
            id: 'engagement_optimizer',
            name: 'Engagement Optimizer',
            description: 'Optimize content for maximum engagement',
            goals: ['engagement', 'interaction'],
            targetAudience: 'general',
            language: language,
            example: 'Increase likes, comments, and shares'
          },
          {
            id: 'conversion_optimizer',
            name: 'Conversion Optimizer',
            description: 'Optimize content for conversions and sales',
            goals: ['conversion', 'sales'],
            targetAudience: 'customers',
            language: language,
            example: 'Drive more purchases and sign-ups'
          },
          {
            id: 'brand_awareness',
            name: 'Brand Awareness',
            description: 'Optimize content for brand recognition',
            goals: ['awareness', 'branding'],
            targetAudience: 'prospects',
            language: language,
            example: 'Build brand recognition and recall'
          }
        ],
        content_generation: [
          {
            id: 'product_announcement',
            name: 'Product Announcement',
            description: 'Generate product launch announcements',
            contentType: 'announcement',
            industry: 'general',
            language: language,
            example: 'Create compelling product launch messages'
          },
          {
            id: 'promotional_content',
            name: 'Promotional Content',
            description: 'Generate promotional and marketing content',
            contentType: 'promotional',
            industry: 'general',
            language: language,
            example: 'Create effective promotional campaigns'
          },
          {
            id: 'educational_content',
            name: 'Educational Content',
            description: 'Generate educational and informative content',
            contentType: 'educational',
            industry: 'general',
            language: language,
            example: 'Create valuable educational content'
          }
        ]
      };

      let filteredTemplates = templates;
      if (category !== 'all' && templates[category]) {
        filteredTemplates = { [category]: templates[category] };
      }

      res.json({
        success: true,
        data: {
          templates: filteredTemplates,
          categories: Object.keys(templates),
          totalTemplates: Object.values(templates).reduce((sum, arr) => sum + arr.length, 0)
        }
      });

    } catch (error) {
      logger.error('AIController: Error getting AI templates:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get AI templates'
      });
    }
  }

  /**
   * Create AI template
   * POST /api/v1/ai/templates
   */
  async createAITemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const templateData = {
        ...req.body,
        userId: userId,
        createdAt: new Date(),
        isCustom: true
      };

      // In a real implementation, you would save this to a database
      // For now, we'll just return the template data
      res.status(201).json({
        success: true,
        data: templateData,
        message: 'AI template created successfully'
      });

    } catch (error) {
      logger.error('AIController: Error creating AI template:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create AI template'
      });
    }
  }

  /**
   * Get AI insights dashboard
   * GET /api/v1/ai/insights
   */
  async getAIInsights(req, res) {
    try {
      const userId = req.user.id;
      const { timeframe = '7d' } = req.query;

      const statistics = await this.aiService.getAIUsageStatistics(userId, timeframe);
      const recommendations = await this.aiService.getAIFeatureRecommendations(userId);
      const health = await this.aiService.getHealthStatus();

      const insights = {
        usage_summary: {
          timeframe: timeframe,
          total_requests: statistics.data.overview.total_requests,
          total_tokens: statistics.data.overview.total_tokens,
          estimated_cost: statistics.data.overview.estimated_cost,
          most_used_feature: statistics.data.feature_usage[0]?.type || 'none'
        },
        performance_insights: {
          avg_tokens_per_request: statistics.data.overview.avg_tokens_per_request,
          efficiency_score: this.calculateEfficiencyScore(statistics.data),
          cost_optimization: this.getCostOptimizationTips(statistics.data),
          usage_trends: 'stable' // This would be calculated from historical data
        },
        recommendations: {
          high_priority: recommendations.recommendations.filter(r => r.priority === 'high'),
          suggested_features: recommendations.recommendations.slice(0, 3),
          optimization_tips: [
            'Use message variations to improve engagement',
            'Implement intelligent auto replies for faster response',
            'Analyze sentiment to understand customer feedback'
          ]
        },
        system_health: {
          status: health.status,
          connection_quality: health.connection?.success ? 'good' : 'poor',
          recent_activity: health.recentActivity,
          configuration_status: health.configuration?.apiKeyConfigured ? 'configured' : 'needs_setup'
        }
      };

      res.json({
        success: true,
        data: insights
      });

    } catch (error) {
      logger.error('AIController: Error getting AI insights:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get AI insights'
      });
    }
  }

  /**
   * Calculate efficiency score based on usage data
   */
  calculateEfficiencyScore(usageData) {
    const avgTokens = usageData.overview.avg_tokens_per_request;
    const totalRequests = usageData.overview.total_requests;
    
    // Simple efficiency calculation (lower tokens per request = higher efficiency)
    if (avgTokens === 0 || totalRequests === 0) return 0;
    
    const baseScore = Math.max(0, 100 - (avgTokens / 10));
    const usageBonus = Math.min(20, totalRequests / 10);
    
    return Math.min(100, Math.round(baseScore + usageBonus));
  }

  /**
   * Get cost optimization tips
   */
  getCostOptimizationTips(usageData) {
    const tips = [];
    const avgTokens = usageData.overview.avg_tokens_per_request;
    
    if (avgTokens > 300) {
      tips.push('Consider using shorter prompts to reduce token usage');
    }
    
    if (usageData.feature_usage.length > 0) {
      const mostUsed = usageData.feature_usage[0];
      if (mostUsed.usage_count > 50) {
        tips.push(`Optimize your ${mostUsed.type} usage for better efficiency`);
      }
    }
    
    if (tips.length === 0) {
      tips.push('Your AI usage is well optimized');
    }
    
    return tips;
  }
}

module.exports = AIController;