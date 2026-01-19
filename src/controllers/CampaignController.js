const CampaignService = require('../services/CampaignService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class CampaignController {
  constructor() {
    this.campaignService = new CampaignService();
  }

  /**
   * Create campaign
   * POST /api/v1/campaigns
   */
  async createCampaign(req, res) {
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
      const result = await this.campaignService.createCampaign(userId, req.body);

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create campaign'
      });
    }
  }

  /**
   * Update campaign
   * PUT /api/v1/campaigns/:campaignId
   */
  async updateCampaign(req, res) {
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
      const { campaignId } = req.params;
      const result = await this.campaignService.updateCampaign(userId, parseInt(campaignId), req.body);

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error updating campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update campaign'
      });
    }
  }

  /**
   * Delete campaign
   * DELETE /api/v1/campaigns/:campaignId
   */
  async deleteCampaign(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const result = await this.campaignService.deleteCampaign(userId, parseInt(campaignId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete campaign'
      });
    }
  }

  /**
   * Get campaign by ID
   * GET /api/v1/campaigns/:campaignId
   */
  async getCampaignById(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const result = await this.campaignService.getCampaignById(userId, parseInt(campaignId));

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      logger.error('CampaignController: Error getting campaign by ID:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get campaign'
      });
    }
  }

  /**
   * Get campaigns
   * GET /api/v1/campaigns
   */
  async getCampaigns(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        device_id,
        status,
        search
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        deviceId: device_id ? parseInt(device_id) : null,
        status,
        search
      };

      const result = await this.campaignService.getCampaigns(userId, options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters
      });

    } catch (error) {
      logger.error('CampaignController: Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get campaigns'
      });
    }
  }

  /**
   * Start campaign
   * POST /api/v1/campaigns/:campaignId/start
   */
  async startCampaign(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const result = await this.campaignService.startCampaign(userId, parseInt(campaignId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error starting campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start campaign'
      });
    }
  }

  /**
   * Stop campaign
   * POST /api/v1/campaigns/:campaignId/stop
   */
  async stopCampaign(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const result = await this.campaignService.stopCampaign(userId, parseInt(campaignId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error stopping campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to stop campaign'
      });
    }
  }

  /**
   * Pause campaign
   * POST /api/v1/campaigns/:campaignId/pause
   */
  async pauseCampaign(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const result = await this.campaignService.pauseCampaign(userId, parseInt(campaignId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error pausing campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to pause campaign'
      });
    }
  }

  /**
   * Resume campaign
   * POST /api/v1/campaigns/:campaignId/resume
   */
  async resumeCampaign(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const result = await this.campaignService.resumeCampaign(userId, parseInt(campaignId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error resuming campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to resume campaign'
      });
    }
  }

  /**
   * Schedule campaign
   * POST /api/v1/campaigns/:campaignId/schedule
   */
  async scheduleCampaign(req, res) {
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
      const { campaignId } = req.params;
      const { scheduled_at, timezone = 'UTC' } = req.body;

      const result = await this.campaignService.scheduleCampaign(
        userId, 
        parseInt(campaignId), 
        scheduled_at, 
        timezone
      );

      res.json({
        success: true,
        message: result.message,
        scheduledAt: result.scheduledAt
      });

    } catch (error) {
      logger.error('CampaignController: Error scheduling campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to schedule campaign'
      });
    }
  }

  /**
   * Duplicate campaign
   * POST /api/v1/campaigns/:campaignId/duplicate
   */
  async duplicateCampaign(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const { name } = req.body;
      
      const result = await this.campaignService.duplicateCampaign(
        userId, 
        parseInt(campaignId), 
        name
      );

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      logger.error('CampaignController: Error duplicating campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to duplicate campaign'
      });
    }
  }

  /**
   * Get campaign statistics
   * GET /api/v1/campaigns/statistics/:deviceId
   */
  async getCampaignStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { timeframe = '30d' } = req.query;

      const result = await this.campaignService.getCampaignStatistics(
        userId, 
        parseInt(deviceId), 
        timeframe
      );

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      logger.error('CampaignController: Error getting campaign statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get campaign statistics'
      });
    }
  }

  /**
   * Get campaign targets
   * GET /api/v1/campaigns/:campaignId/targets
   */
  async getCampaignTargets(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const {
        page = 1,
        limit = 100,
        status,
        search
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search
      };

      const result = await this.campaignService.getCampaignTargets(
        userId, 
        parseInt(campaignId), 
        options
      );

      res.json({
        success: true,
        data: result.data,
        statistics: result.statistics,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('CampaignController: Error getting campaign targets:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get campaign targets'
      });
    }
  }

  /**
   * Get campaign templates
   * GET /api/v1/campaigns/templates
   */
  async getCampaignTemplates(req, res) {
    try {
      // Predefined campaign templates
      const templates = [
        {
          id: 'product_announcement',
          name: 'Product Announcement',
          description: 'Announce new products to customers',
          message_type: 'image',
          message_content: {
            image: { url: 'https://example.com/product.jpg' },
            caption: '🎉 New Product Alert! Check out our latest {product_name}. Special launch price: {price}. Order now!'
          },
          target_type: 'contacts',
          category: 'marketing'
        },
        {
          id: 'promotional_offer',
          name: 'Promotional Offer',
          description: 'Send promotional offers to customers',
          message_type: 'text',
          message_content: {
            text: '🔥 Special Offer for {name}! Get {discount}% off on all items. Use code: {promo_code}. Valid until {expiry_date}.'
          },
          target_type: 'filtered',
          category: 'promotion'
        },
        {
          id: 'event_invitation',
          name: 'Event Invitation',
          description: 'Invite customers to events',
          message_type: 'text',
          message_content: {
            text: '📅 You\'re invited to {event_name}! Date: {event_date}, Time: {event_time}, Venue: {venue}. RSVP: {rsvp_link}'
          },
          target_type: 'contacts',
          category: 'event'
        },
        {
          id: 'order_confirmation',
          name: 'Order Confirmation',
          description: 'Confirm customer orders',
          message_type: 'text',
          message_content: {
            text: '✅ Order Confirmed! Hi {name}, your order #{order_id} has been confirmed. Total: {total_amount}. Estimated delivery: {delivery_date}.'
          },
          target_type: 'numbers',
          category: 'transactional'
        },
        {
          id: 'survey_feedback',
          name: 'Survey & Feedback',
          description: 'Collect customer feedback',
          message_type: 'text',
          message_content: {
            text: '📝 We value your opinion! Please take 2 minutes to rate your experience: {survey_link}. Thank you!'
          },
          target_type: 'contacts',
          category: 'feedback'
        },
        {
          id: 'appointment_reminder',
          name: 'Appointment Reminder',
          description: 'Remind customers about appointments',
          message_type: 'text',
          message_content: {
            text: '⏰ Appointment Reminder: Hi {name}, this is a reminder for your appointment on {date} at {time}. Location: {location}.'
          },
          target_type: 'numbers',
          category: 'reminder'
        }
      ];

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      logger.error('CampaignController: Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaign templates'
      });
    }
  }

  /**
   * Create campaign from template
   * POST /api/v1/campaigns/from-template
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
        'product_announcement': {
          name: 'Product Announcement',
          message_type: 'image',
          message_content: {
            image: { url: 'https://example.com/product.jpg' },
            caption: '🎉 New Product Alert! Check out our latest {product_name}. Special launch price: {price}. Order now!'
          },
          target_type: 'contacts'
        },
        'promotional_offer': {
          name: 'Promotional Offer',
          message_type: 'text',
          message_content: {
            text: '🔥 Special Offer for {name}! Get {discount}% off on all items. Use code: {promo_code}. Valid until {expiry_date}.'
          },
          target_type: 'filtered'
        },
        'event_invitation': {
          name: 'Event Invitation',
          message_type: 'text',
          message_content: {
            text: '📅 You\'re invited to {event_name}! Date: {event_date}, Time: {event_time}, Venue: {venue}. RSVP: {rsvp_link}'
          },
          target_type: 'contacts'
        },
        'order_confirmation': {
          name: 'Order Confirmation',
          message_type: 'text',
          message_content: {
            text: '✅ Order Confirmed! Hi {name}, your order #{order_id} has been confirmed. Total: {total_amount}. Estimated delivery: {delivery_date}.'
          },
          target_type: 'numbers'
        },
        'survey_feedback': {
          name: 'Survey & Feedback',
          message_type: 'text',
          message_content: {
            text: '📝 We value your opinion! Please take 2 minutes to rate your experience: {survey_link}. Thank you!'
          },
          target_type: 'contacts'
        },
        'appointment_reminder': {
          name: 'Appointment Reminder',
          message_type: 'text',
          message_content: {
            text: '⏰ Appointment Reminder: Hi {name}, this is a reminder for your appointment on {date} at {time}. Location: {location}.'
          },
          target_type: 'numbers'
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
      const campaignData = {
        device_id: device_id,
        name: name || template.name,
        description: customizations.description || `Campaign created from ${template.name} template`,
        message_type: customizations.message_type || template.message_type,
        message_content: customizations.message_content || template.message_content,
        media_url: customizations.media_url || null,
        media_type: customizations.media_type || null,
        target_type: customizations.target_type || template.target_type,
        target_filters: customizations.target_filters || {},
        schedule_type: customizations.schedule_type || 'immediate',
        scheduled_at: customizations.scheduled_at || null,
        delay_min: customizations.delay_min || 1,
        delay_max: customizations.delay_max || 5,
        randomize_delay: customizations.randomize_delay !== undefined ? customizations.randomize_delay : true,
        ai_variation: customizations.ai_variation !== undefined ? customizations.ai_variation : false,
        status: customizations.status || 'draft'
      };

      const result = await this.campaignService.createCampaign(userId, campaignData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Campaign created from template successfully'
      });

    } catch (error) {
      logger.error('CampaignController: Error creating from template:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create campaign from template'
      });
    }
  }

  /**
   * Preview campaign targets
   * POST /api/v1/campaigns/preview-targets
   */
  async previewCampaignTargets(req, res) {
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
      const { device_id, target_type, target_filters } = req.body;

      // Validate device ownership
      const DeviceRepository = require('../repositories/DeviceRepository');
      const deviceRepository = new DeviceRepository();
      const device = await deviceRepository.findByIdAndUserId(device_id, userId);
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Preview targets based on type and filters
      let previewTargets = [];
      let estimatedCount = 0;

      switch (target_type) {
        case 'contacts':
          const contacts = await this.campaignService.getContactTargets(device_id, target_filters);
          previewTargets = contacts.slice(0, 10); // Show first 10 as preview
          estimatedCount = contacts.length;
          break;

        case 'groups':
          const groups = await this.campaignService.getGroupTargets(device_id, target_filters);
          previewTargets = groups.slice(0, 10);
          estimatedCount = groups.length;
          break;

        case 'numbers':
          if (target_filters && target_filters.numbers) {
            previewTargets = target_filters.numbers.slice(0, 10).map(number => ({
              phone_number: number,
              name: null,
              type: 'number'
            }));
            estimatedCount = target_filters.numbers.length;
          }
          break;

        case 'filtered':
          const filteredTargets = await this.campaignService.getFilteredTargets(device_id, target_filters);
          previewTargets = filteredTargets.slice(0, 10);
          estimatedCount = filteredTargets.length;
          break;
      }

      res.json({
        success: true,
        data: {
          preview: previewTargets,
          estimated_count: estimatedCount,
          target_type: target_type,
          showing: Math.min(previewTargets.length, 10)
        }
      });

    } catch (error) {
      logger.error('CampaignController: Error previewing targets:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to preview campaign targets'
      });
    }
  }

  /**
   * Export campaign results
   * GET /api/v1/campaigns/:campaignId/export
   */
  async exportCampaignResults(req, res) {
    try {
      const userId = req.user.id;
      const { campaignId } = req.params;
      const { format = 'json' } = req.query;

      // Get campaign and targets
      const campaign = await this.campaignService.getCampaignById(userId, parseInt(campaignId));
      const targets = await this.campaignService.getCampaignTargets(userId, parseInt(campaignId), {
        limit: 10000 // Get all targets
      });

      const exportData = {
        campaign: campaign.data,
        targets: targets.data,
        statistics: targets.statistics,
        exported_at: new Date().toISOString()
      };

      if (format === 'csv') {
        // Convert to CSV
        const csv = this.convertTargetsToCSV(targets.data, campaign.data);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaignId}-results-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        // Return JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaignId}-results-${Date.now()}.json"`);
        res.json({
          success: true,
          data: exportData
        });
      }

    } catch (error) {
      logger.error('CampaignController: Error exporting campaign results:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export campaign results'
      });
    }
  }

  /**
   * Get campaign dashboard
   * GET /api/v1/campaigns/dashboard/:deviceId
   */
  async getCampaignDashboard(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      // Get recent campaigns
      const recentCampaigns = await this.campaignService.getCampaigns(userId, {
        deviceId: parseInt(deviceId),
        limit: 5
      });

      // Get statistics
      const statistics = await this.campaignService.getCampaignStatistics(userId, parseInt(deviceId));

      // Get running campaigns
      const CampaignRepository = require('../repositories/CampaignRepository');
      const campaignRepository = new CampaignRepository();
      const runningCampaigns = await campaignRepository.getRunningCampaigns(parseInt(deviceId));

      res.json({
        success: true,
        data: {
          recent_campaigns: recentCampaigns.data,
          statistics: statistics.data,
          running_campaigns: runningCampaigns,
          summary: {
            total_campaigns: statistics.data.statistics.overall.total_campaigns,
            running_count: runningCampaigns.length,
            completed_today: statistics.data.statistics.daily_activity[0]?.campaigns_created || 0
          }
        }
      });

    } catch (error) {
      logger.error('CampaignController: Error getting campaign dashboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get campaign dashboard'
      });
    }
  }

  /**
   * Convert targets to CSV format
   */
  convertTargetsToCSV(targets, campaign) {
    const headers = [
      'Target Number', 'Target Name', 'Target Type', 'Status', 
      'Sent At', 'Delivered At', 'Failed At', 'Error Message', 
      'Retry Count', 'Campaign Name'
    ];

    const rows = targets.map(target => [
      target.target_number,
      target.target_name || '',
      target.target_type,
      target.status,
      target.sent_at || '',
      target.delivered_at || '',
      target.failed_at || '',
      target.error_message || '',
      target.retry_count,
      campaign.name
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

module.exports = CampaignController;