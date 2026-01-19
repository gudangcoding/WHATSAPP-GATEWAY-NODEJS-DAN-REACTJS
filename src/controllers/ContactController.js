const ContactService = require('../services/ContactService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ContactController {
  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Start contact scraping
   * POST /api/v1/contacts/scrape
   */
  async startScraping(req, res) {
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
      const { device_id, sources, options } = req.body;

      const result = await this.contactService.startScraping(userId, device_id, {
        sources,
        ...options
      });

      res.json({
        success: true,
        data: result,
        message: 'Contact scraping started successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error starting scraping:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start contact scraping'
      });
    }
  }

  /**
   * Get scraping status
   * GET /api/v1/contacts/scrape/status/:jobId
   */
  async getScrapingStatus(req, res) {
    try {
      const userId = req.user.id;
      const { jobId } = req.params;

      const result = await this.contactService.getScrapingStatus(userId, jobId);

      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: 'Scraping job not found'
        });
      }

      res.json({
        success: true,
        data: result,
        message: 'Scraping status retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting scraping status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get scraping status'
      });
    }
  }

  /**
   * Get contacts with filtering and pagination
   * GET /api/v1/contacts
   */
  async getContacts(req, res) {
    try {
      const userId = req.user.id;
      const {
        device_id,
        page = 1,
        limit = 50,
        search,
        source,
        min_quality_score,
        max_quality_score,
        business_only = false,
        order_by = 'created_at',
        order_direction = 'DESC'
      } = req.query;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const result = await this.contactService.getContacts(userId, parseInt(device_id), {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        source,
        minQualityScore: min_quality_score ? parseInt(min_quality_score) : null,
        maxQualityScore: max_quality_score ? parseInt(max_quality_score) : null,
        businessOnly: business_only === 'true',
        orderBy: order_by,
        orderDirection: order_direction
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
        message: 'Contacts retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting contacts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get contacts'
      });
    }
  }

  /**
   * Get contact statistics
   * GET /api/v1/contacts/statistics/:deviceId
   */
  async getContactStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      const result = await this.contactService.getContactStatistics(userId, parseInt(deviceId));

      res.json({
        success: true,
        data: result,
        message: 'Contact statistics retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting contact statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get contact statistics'
      });
    }
  }

  /**
   * Get groups with filtering and pagination
   * GET /api/v1/contacts/groups
   */
  async getGroups(req, res) {
    try {
      const userId = req.user.id;
      const {
        device_id,
        page = 1,
        limit = 50,
        search,
        admin_only = false,
        min_members,
        max_members,
        order_by = 'created_at',
        order_direction = 'DESC'
      } = req.query;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const result = await this.contactService.getGroups(userId, parseInt(device_id), {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        adminOnly: admin_only === 'true',
        minMembers: min_members ? parseInt(min_members) : null,
        maxMembers: max_members ? parseInt(max_members) : null,
        orderBy: order_by,
        orderDirection: order_direction
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
        message: 'Groups retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting groups:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get groups'
      });
    }
  }

  /**
   * Get group statistics
   * GET /api/v1/contacts/groups/statistics/:deviceId
   */
  async getGroupStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      const result = await this.contactService.getGroupStatistics(userId, parseInt(deviceId));

      res.json({
        success: true,
        data: result,
        message: 'Group statistics retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting group statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get group statistics'
      });
    }
  }

  /**
   * Enrich contacts
   * POST /api/v1/contacts/enrich
   */
  async enrichContacts(req, res) {
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
      const { device_id, contact_ids = [] } = req.body;

      const result = await this.contactService.enrichContacts(userId, device_id, contact_ids);

      res.json({
        success: true,
        data: result,
        message: 'Contact enrichment started successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error enriching contacts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start contact enrichment'
      });
    }
  }

  /**
   * Cleanup duplicate contacts
   * POST /api/v1/contacts/cleanup-duplicates
   */
  async cleanupDuplicates(req, res) {
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
      const { device_id } = req.body;

      const result = await this.contactService.cleanupDuplicates(userId, device_id);

      res.json({
        success: true,
        data: result,
        message: 'Duplicate cleanup started successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error cleaning up duplicates:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start duplicate cleanup'
      });
    }
  }

  /**
   * Export contacts
   * GET /api/v1/contacts/export/:deviceId
   */
  async exportContacts(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const {
        format = 'json',
        source,
        min_quality_score
      } = req.query;

      const result = await this.contactService.exportContacts(userId, parseInt(deviceId), format, {
        source,
        minQualityScore: min_quality_score ? parseInt(min_quality_score) : null
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="contacts_${deviceId}_${Date.now()}.csv"`);
        res.send(result.data);
      } else {
        res.json({
          success: true,
          data: result,
          message: 'Contacts exported successfully'
        });
      }

    } catch (error) {
      logger.error('ContactController: Error exporting contacts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export contacts'
      });
    }
  }

  /**
   * Export groups
   * GET /api/v1/contacts/groups/export/:deviceId
   */
  async exportGroups(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { format = 'json' } = req.query;

      const result = await this.contactService.exportGroups(userId, parseInt(deviceId), format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="groups_${deviceId}_${Date.now()}.csv"`);
        res.send(result.data);
      } else {
        res.json({
          success: true,
          data: result,
          message: 'Groups exported successfully'
        });
      }

    } catch (error) {
      logger.error('ContactController: Error exporting groups:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export groups'
      });
    }
  }

  /**
   * Get contacts for campaign targeting
   * POST /api/v1/contacts/targeting
   */
  async getContactsForCampaign(req, res) {
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
      const { device_id, targeting_options = {} } = req.body;

      const result = await this.contactService.getContactsForCampaign(userId, device_id, targeting_options);

      res.json({
        success: true,
        data: result,
        message: 'Contacts for campaign retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting contacts for campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get contacts for campaign'
      });
    }
  }

  /**
   * Get groups for campaign targeting
   * POST /api/v1/contacts/groups/targeting
   */
  async getGroupsForCampaign(req, res) {
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
      const { device_id, targeting_options = {} } = req.body;

      const result = await this.contactService.getGroupsForCampaign(userId, device_id, targeting_options);

      res.json({
        success: true,
        data: result,
        message: 'Groups for campaign retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting groups for campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get groups for campaign'
      });
    }
  }

  /**
   * Schedule automatic scraping
   * POST /api/v1/contacts/schedule-scraping
   */
  async scheduleAutoScraping(req, res) {
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
      const { device_id, schedule, options = {} } = req.body;

      const result = await this.contactService.scheduleAutoScraping(userId, device_id, schedule, options);

      res.json({
        success: true,
        data: result,
        message: 'Auto scraping scheduled successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error scheduling auto scraping:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to schedule auto scraping'
      });
    }
  }

  /**
   * Update contact
   * PUT /api/v1/contacts/:contactId
   */
  async updateContact(req, res) {
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
      const { contactId } = req.params;
      const { device_id, ...updateData } = req.body;

      const result = await this.contactService.updateContact(userId, device_id, parseInt(contactId), updateData);

      res.json({
        success: true,
        data: result,
        message: 'Contact updated successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error updating contact:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update contact'
      });
    }
  }

  /**
   * Delete contact
   * DELETE /api/v1/contacts/:contactId
   */
  async deleteContact(req, res) {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;
      const { device_id } = req.query;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const result = await this.contactService.deleteContact(userId, parseInt(device_id), parseInt(contactId));

      res.json({
        success: true,
        data: result,
        message: 'Contact deleted successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error deleting contact:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete contact'
      });
    }
  }

  /**
   * Get contact by ID
   * GET /api/v1/contacts/:contactId
   */
  async getContactById(req, res) {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;
      const { device_id } = req.query;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      // Validate device ownership first
      const DeviceRepository = require('../repositories/DeviceRepository');
      const deviceRepository = new DeviceRepository();
      const device = await deviceRepository.findByIdAndUserId(parseInt(device_id), userId);
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Get contact
      const ContactRepository = require('../repositories/ContactRepository');
      const contactRepository = new ContactRepository();
      const contact = await contactRepository.findById(parseInt(contactId));

      if (!contact || contact.device_id !== parseInt(device_id)) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found or access denied'
        });
      }

      res.json({
        success: true,
        data: contact,
        message: 'Contact retrieved successfully'
      });

    } catch (error) {
      logger.error('ContactController: Error getting contact by ID:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get contact'
      });
    }
  }
}

module.exports = ContactController;