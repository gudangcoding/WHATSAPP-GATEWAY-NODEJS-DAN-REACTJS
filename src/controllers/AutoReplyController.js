const AutoReplyService = require('../services/AutoReplyService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class AutoReplyController {
  constructor() {
    this.autoReplyService = new AutoReplyService();
  }

  /**
   * Create auto reply rule
   * POST /api/v1/auto-replies
   */
  async createAutoReply(req, res) {
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
      const result = await this.autoReplyService.createAutoReply(userId, req.body);

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('AutoReplyController: Error creating auto reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create auto reply rule'
      });
    }
  }

  /**
   * Update auto reply rule
   * PUT /api/v1/auto-replies/:autoReplyId
   */
  async updateAutoReply(req, res) {
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
      const { autoReplyId } = req.params;
      const result = await this.autoReplyService.updateAutoReply(userId, parseInt(autoReplyId), req.body);

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('AutoReplyController: Error updating auto reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update auto reply rule'
      });
    }
  }

  /**
   * Delete auto reply rule
   * DELETE /api/v1/auto-replies/:autoReplyId
   */
  async deleteAutoReply(req, res) {
    try {
      const userId = req.user.id;
      const { autoReplyId } = req.params;
      const result = await this.autoReplyService.deleteAutoReply(userId, parseInt(autoReplyId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('AutoReplyController: Error deleting auto reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete auto reply rule'
      });
    }
  }

  /**
   * Get auto reply by ID
   * GET /api/v1/auto-replies/:autoReplyId
   */
  async getAutoReplyById(req, res) {
    try {
      const userId = req.user.id;
      const { autoReplyId } = req.params;
      const result = await this.autoReplyService.getAutoReplyById(userId, parseInt(autoReplyId));

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      logger.error('AutoReplyController: Error getting auto reply by ID:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get auto reply rule'
      });
    }
  }

  /**
   * Get auto replies
   * GET /api/v1/auto-replies
   */
  async getAutoReplies(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        device_id,
        is_active,
        search
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        deviceId: device_id ? parseInt(device_id) : null,
        isActive: is_active === 'true' ? true : is_active === 'false' ? false : null,
        search
      };

      const result = await this.autoReplyService.getAutoReplies(userId, options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters
      });

    } catch (error) {
      logger.error('AutoReplyController: Error getting auto replies:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get auto reply rules'
      });
    }
  }

  /**
   * Toggle auto reply status
   * POST /api/v1/auto-replies/:autoReplyId/toggle
   */
  async toggleAutoReplyStatus(req, res) {
    try {
      const userId = req.user.id;
      const { autoReplyId } = req.params;
      const result = await this.autoReplyService.toggleAutoReplyStatus(userId, parseInt(autoReplyId));

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('AutoReplyController: Error toggling auto reply status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle auto reply status'
      });
    }
  }

  /**
   * Update auto reply priorities
   * PUT /api/v1/auto-replies/priorities
   */
  async updatePriorities(req, res) {
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
      const { priorities } = req.body;
      const result = await this.autoReplyService.updatePriorities(userId, priorities);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('AutoReplyController: Error updating priorities:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update priorities'
      });
    }
  }

  /**
   * Duplicate auto reply rule
   * POST /api/v1/auto-replies/:autoReplyId/duplicate
   */
  async duplicateAutoReply(req, res) {
    try {
      const userId = req.user.id;
      const { autoReplyId } = req.params;
      const { name } = req.body;
      
      const result = await this.autoReplyService.duplicateAutoReply(
        userId, 
        parseInt(autoReplyId), 
        name
      );

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('AutoReplyController: Error duplicating auto reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to duplicate auto reply rule'
      });
    }
  }

  /**
   * Test auto reply rule
   * POST /api/v1/auto-replies/:autoReplyId/test
   */
  async testAutoReply(req, res) {
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
      const { autoReplyId } = req.params;
      const { message } = req.body;
      
      const result = await this.autoReplyService.testAutoReply(
        userId, 
        parseInt(autoReplyId), 
        message
      );

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      logger.error('AutoReplyController: Error testing auto reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to test auto reply rule'
      });
    }
  }

  /**
   * Get auto reply statistics
   * GET /api/v1/auto-replies/statistics/:deviceId
   */
  async getAutoReplyStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { timeframe = '24h' } = req.query;

      const result = await this.autoReplyService.getAutoReplyStatistics(
        userId, 
        parseInt(deviceId), 
        timeframe
      );

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      logger.error('AutoReplyController: Error getting auto reply statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get auto reply statistics'
      });
    }
  }

  /**
   * Get auto reply logs
   * GET /api/v1/auto-replies/logs
   */
  async getAutoReplyLogs(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        device_id,
        auto_reply_id
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        deviceId: device_id ? parseInt(device_id) : null,
        autoReplyId: auto_reply_id ? parseInt(auto_reply_id) : null
      };

      const result = await this.autoReplyService.getAutoReplyLogs(userId, options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('AutoReplyController: Error getting auto reply logs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get auto reply logs'
      });
    }
  }

  /**
   * Get auto reply templates
   * GET /api/v1/auto-replies/templates
   */
  async getAutoReplyTemplates(req, res) {
    try {
      // Predefined templates for common use cases
      const templates = [
        {
          id: 'welcome',
          name: 'Welcome Message',
          description: 'Automatic welcome message for new contacts',
          match_type: 'contains',
          keywords: 'hello,hi,halo,hai',
          reply_type: 'text',
          reply_text: 'Hello {name}! Welcome to our service. How can I help you today?',
          category: 'greeting'
        },
        {
          id: 'business_hours',
          name: 'Business Hours Info',
          description: 'Inform about business hours',
          match_type: 'contains',
          keywords: 'hours,open,close,time',
          reply_type: 'text',
          reply_text: 'Our business hours are Monday-Friday 9AM-5PM. We will respond to your message during business hours.',
          category: 'information'
        },
        {
          id: 'away_message',
          name: 'Away Message',
          description: 'Auto reply when away',
          match_type: 'contains',
          keywords: '*',
          reply_type: 'text',
          reply_text: 'Thank you for your message. I am currently away and will respond as soon as possible.',
          category: 'status'
        },
        {
          id: 'price_inquiry',
          name: 'Price Inquiry',
          description: 'Response to price questions',
          match_type: 'contains',
          keywords: 'price,cost,how much,berapa',
          reply_type: 'text',
          reply_text: 'Thank you for your interest! Please visit our website or contact our sales team for pricing information.',
          category: 'sales'
        },
        {
          id: 'support_ticket',
          name: 'Support Ticket',
          description: 'Create support ticket',
          match_type: 'contains',
          keywords: 'help,support,problem,issue',
          reply_type: 'text',
          reply_text: 'I understand you need help. Your support ticket #{datetime} has been created. Our team will assist you shortly.',
          category: 'support'
        }
      ];

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      logger.error('AutoReplyController: Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get auto reply templates'
      });
    }
  }

  /**
   * Create auto reply from template
   * POST /api/v1/auto-replies/from-template
   */
  async createFromTemplate(req, res) {
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
      const { template_id, device_id, name, customizations = {} } = req.body;

      // Get template (this would normally come from a database)
      const templates = {
        'welcome': {
          name: 'Welcome Message',
          match_type: 'contains',
          keywords: 'hello,hi,halo,hai',
          reply_type: 'text',
          reply_text: 'Hello {name}! Welcome to our service. How can I help you today?'
        },
        'business_hours': {
          name: 'Business Hours Info',
          match_type: 'contains',
          keywords: 'hours,open,close,time',
          reply_type: 'text',
          reply_text: 'Our business hours are Monday-Friday 9AM-5PM. We will respond to your message during business hours.'
        },
        'away_message': {
          name: 'Away Message',
          match_type: 'contains',
          keywords: '*',
          reply_type: 'text',
          reply_text: 'Thank you for your message. I am currently away and will respond as soon as possible.'
        },
        'price_inquiry': {
          name: 'Price Inquiry',
          match_type: 'contains',
          keywords: 'price,cost,how much,berapa',
          reply_type: 'text',
          reply_text: 'Thank you for your interest! Please visit our website or contact our sales team for pricing information.'
        },
        'support_ticket': {
          name: 'Support Ticket',
          match_type: 'contains',
          keywords: 'help,support,problem,issue',
          reply_type: 'text',
          reply_text: 'I understand you need help. Your support ticket #{datetime} has been created. Our team will assist you shortly.'
        }
      };

      const template = templates[template_id];
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Merge template with customizations
      const autoReplyData = {
        device_id: device_id,
        name: name || template.name,
        match_type: customizations.match_type || template.match_type,
        keywords: customizations.keywords || template.keywords,
        reply_type: customizations.reply_type || template.reply_type,
        reply_text: customizations.reply_text || template.reply_text,
        reply_media_url: customizations.reply_media_url || null,
        reply_media_type: customizations.reply_media_type || null,
        is_active: customizations.is_active !== undefined ? customizations.is_active : true,
        priority: customizations.priority || 1,
        cooldown_minutes: customizations.cooldown_minutes || 0,
        max_daily_replies: customizations.max_daily_replies || 0,
        is_group_enabled: customizations.is_group_enabled || false,
        time_start: customizations.time_start || null,
        time_end: customizations.time_end || null,
        delay_seconds: customizations.delay_seconds || 0
      };

      const result = await this.autoReplyService.createAutoReply(userId, autoReplyData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Auto reply created from template successfully'
      });

    } catch (error) {
      logger.error('AutoReplyController: Error creating from template:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create auto reply from template'
      });
    }
  }

  /**
   * Export auto replies
   * GET /api/v1/auto-replies/export/:deviceId
   */
  async exportAutoReplies(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { format = 'json' } = req.query;

      // Get all auto replies for device
      const result = await this.autoReplyService.getAutoReplies(userId, {
        deviceId: parseInt(deviceId),
        limit: 1000 // Get all
      });

      const autoReplies = result.data;

      if (format === 'csv') {
        // Convert to CSV
        const csv = this.convertToCSV(autoReplies);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="auto-replies-${deviceId}-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        // Return JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="auto-replies-${deviceId}-${Date.now()}.json"`);
        res.json({
          success: true,
          data: autoReplies,
          exported_at: new Date().toISOString(),
          total_count: autoReplies.length
        });
      }

    } catch (error) {
      logger.error('AutoReplyController: Error exporting auto replies:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export auto replies'
      });
    }
  }

  /**
   * Import auto replies
   * POST /api/v1/auto-replies/import/:deviceId
   */
  async importAutoReplies(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { auto_replies, overwrite = false } = req.body;

      if (!Array.isArray(auto_replies) || auto_replies.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Auto replies array is required'
        });
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const autoReplyData of auto_replies) {
        try {
          // Add device_id to each auto reply
          const dataWithDevice = {
            ...autoReplyData,
            device_id: parseInt(deviceId)
          };

          // Remove fields that shouldn't be imported
          delete dataWithDevice.id;
          delete dataWithDevice.created_at;
          delete dataWithDevice.updated_at;

          await this.autoReplyService.createAutoReply(userId, dataWithDevice);
          results.imported++;

        } catch (error) {
          results.errors.push({
            name: autoReplyData.name || 'Unknown',
            error: error.message
          });
          results.skipped++;
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Import completed. ${results.imported} imported, ${results.skipped} skipped.`
      });

    } catch (error) {
      logger.error('AutoReplyController: Error importing auto replies:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import auto replies'
      });
    }
  }

  /**
   * Convert auto replies to CSV format
   */
  convertToCSV(autoReplies) {
    const headers = [
      'ID', 'Name', 'Match Type', 'Keywords', 'Reply Type', 'Reply Text', 
      'Reply Media URL', 'Is Active', 'Priority', 'Cooldown Minutes', 
      'Max Daily Replies', 'Group Enabled', 'Time Start', 'Time End', 
      'Delay Seconds', 'Created At'
    ];

    const rows = autoReplies.map(ar => [
      ar.id,
      ar.name,
      ar.match_type,
      ar.keywords,
      ar.reply_type,
      ar.reply_text || '',
      ar.reply_media_url || '',
      ar.is_active ? 'Yes' : 'No',
      ar.priority,
      ar.cooldown_minutes,
      ar.max_daily_replies,
      ar.is_group_enabled ? 'Yes' : 'No',
      ar.time_start || '',
      ar.time_end || '',
      ar.delay_seconds,
      ar.created_at
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

module.exports = AutoReplyController;