const CampaignRepository = require('../repositories/CampaignRepository');
const CampaignTargetRepository = require('../repositories/CampaignTargetRepository');
const ContactRepository = require('../repositories/ContactRepository');
const GroupRepository = require('../repositories/GroupRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const QueueManager = require('../core/QueueManager');
const SocketManager = require('../core/SocketManager');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

class CampaignService {
  constructor() {
    this.campaignRepository = new CampaignRepository();
    this.campaignTargetRepository = new CampaignTargetRepository();
    this.contactRepository = new ContactRepository();
    this.groupRepository = new GroupRepository();
    this.deviceRepository = new DeviceRepository();
    this.queueManager = QueueManager.getInstance();
    this.socketManager = SocketManager.getInstance();
    
    // Supported message types
    this.messageTypes = ['text', 'image', 'video', 'document', 'audio', 'location', 'contact', 'list'];
    
    // Supported target types
    this.targetTypes = ['contacts', 'groups', 'numbers', 'mixed', 'filtered'];
    
    // Supported schedule types
    this.scheduleTypes = ['immediate', 'scheduled', 'recurring'];
  }

  /**
   * Create new campaign
   */
  async createCampaign(userId, campaignData) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaignData.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Validate campaign data
      const validation = this.validateCampaignData(campaignData);
      if (!validation.isValid) {
        throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
      }

      // Add user_id to data
      const campaignWithUser = {
        ...campaignData,
        user_id: userId
      };

      // Create campaign
      const campaign = await this.campaignRepository.create(campaignWithUser);

      // Generate targets if not draft
      if (campaign.status !== 'draft') {
        await this.generateCampaignTargets(campaign.id, campaignData);
      }

      // Emit real-time event
      this.socketManager.emitToDevice(campaignData.device_id, 'campaign:created', {
        campaign: campaign,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign created for device ${campaignData.device_id}`);

      return {
        success: true,
        data: campaign,
        message: 'Campaign created successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(userId, campaignId, updateData) {
    try {
      // Get existing campaign
      const existingCampaign = await this.campaignRepository.findById(campaignId);
      if (!existingCampaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingCampaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check if campaign can be updated
      if (['running', 'completed'].includes(existingCampaign.status)) {
        throw new Error('Cannot update running or completed campaign');
      }

      // Validate update data
      if (Object.keys(updateData).length > 0) {
        const validation = this.validateCampaignData(updateData, true);
        if (!validation.isValid) {
          throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update campaign
      const updated = await this.campaignRepository.update(campaignId, updateData);
      if (!updated) {
        throw new Error('Failed to update campaign');
      }

      // Get updated data
      const updatedCampaign = await this.campaignRepository.findById(campaignId);

      // Regenerate targets if target configuration changed
      if (updateData.target_type || updateData.target_filters) {
        await this.regenerateCampaignTargets(campaignId, updatedCampaign);
      }

      // Emit real-time event
      this.socketManager.emitToDevice(existingCampaign.device_id, 'campaign:updated', {
        campaign: updatedCampaign,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} updated`);

      return {
        success: true,
        data: updatedCampaign,
        message: 'Campaign updated successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(userId, campaignId) {
    try {
      // Get existing campaign
      const existingCampaign = await this.campaignRepository.findById(campaignId);
      if (!existingCampaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingCampaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check if campaign can be deleted
      if (existingCampaign.status === 'running') {
        throw new Error('Cannot delete running campaign. Please stop it first.');
      }

      // Delete campaign (targets will be deleted by CASCADE)
      const deleted = await this.campaignRepository.delete(campaignId);
      if (!deleted) {
        throw new Error('Failed to delete campaign');
      }

      // Emit real-time event
      this.socketManager.emitToDevice(existingCampaign.device_id, 'campaign:deleted', {
        campaignId: campaignId,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} deleted`);

      return {
        success: true,
        message: 'Campaign deleted successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(userId, campaignId) {
    try {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Get campaign targets statistics
      const targetStats = await this.campaignTargetRepository.getStatistics(campaignId);

      return {
        success: true,
        data: {
          ...campaign,
          target_statistics: targetStats
        }
      };

    } catch (error) {
      logger.error('CampaignService: Error getting campaign by ID:', error);
      throw error;
    }
  }

  /**
   * Get campaigns for user
   */
  async getCampaigns(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        deviceId = null,
        status = null,
        search = null
      } = options;

      const offset = (page - 1) * limit;

      let campaigns;
      let totalCount;

      if (search) {
        // Search campaigns
        campaigns = await this.campaignRepository.search(search, userId, {
          limit,
          offset,
          deviceId,
          status
        });
        
        // Get total count for search
        totalCount = await this.campaignRepository.count({
          user_id: userId,
          device_id: deviceId,
          status: status
        });
      } else {
        // Get campaigns by user
        campaigns = await this.campaignRepository.findByUserId(userId, {
          limit,
          offset,
          deviceId,
          status
        });

        // Get total count
        totalCount = await this.campaignRepository.count({
          user_id: userId,
          device_id: deviceId,
          status: status
        });
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: campaigns,
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
          status,
          search
        }
      };

    } catch (error) {
      logger.error('CampaignService: Error getting campaigns:', error);
      throw error;
    }
  }

  /**
   * Start campaign
   */
  async startCampaign(userId, campaignId) {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check campaign status
      if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
        throw new Error(`Cannot start campaign with status: ${campaign.status}`);
      }

      // Check device connection
      const SessionManager = require('../core/SessionManager').getInstance();
      const sessionStatus = SessionManager.getSessionStatus(campaign.device_id);
      if (!sessionStatus.connected) {
        throw new Error('Device session is not connected');
      }

      // Generate targets if not already generated
      if (campaign.total_targets === 0) {
        await this.generateCampaignTargets(campaignId, campaign);
        
        // Refresh campaign data
        const updatedCampaign = await this.campaignRepository.findById(campaignId);
        if (updatedCampaign.total_targets === 0) {
          throw new Error('No valid targets found for campaign');
        }
      }

      // Update campaign status to running
      await this.campaignRepository.updateStatus(campaignId, 'running');

      // Add campaign job to queue
      await this.queueManager.addCampaignJob({
        type: 'process_campaign',
        campaignId: campaignId,
        deviceId: campaign.device_id,
        userId: userId
      });

      // Emit real-time event
      this.socketManager.emitToDevice(campaign.device_id, 'campaign:started', {
        campaignId: campaignId,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} started`);

      return {
        success: true,
        message: 'Campaign started successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error starting campaign:', error);
      throw error;
    }
  }

  /**
   * Stop campaign
   */
  async stopCampaign(userId, campaignId) {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check campaign status
      if (!['running', 'scheduled'].includes(campaign.status)) {
        throw new Error(`Cannot stop campaign with status: ${campaign.status}`);
      }

      // Update campaign status to cancelled
      await this.campaignRepository.updateStatus(campaignId, 'cancelled');

      // Cancel pending jobs (implementation depends on queue system)
      // await this.queueManager.cancelCampaignJobs(campaignId);

      // Emit real-time event
      this.socketManager.emitToDevice(campaign.device_id, 'campaign:stopped', {
        campaignId: campaignId,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} stopped`);

      return {
        success: true,
        message: 'Campaign stopped successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error stopping campaign:', error);
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(userId, campaignId) {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check campaign status
      if (campaign.status !== 'running') {
        throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
      }

      // Update campaign status to paused
      await this.campaignRepository.updateStatus(campaignId, 'paused');

      // Emit real-time event
      this.socketManager.emitToDevice(campaign.device_id, 'campaign:paused', {
        campaignId: campaignId,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} paused`);

      return {
        success: true,
        message: 'Campaign paused successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error pausing campaign:', error);
      throw error;
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(userId, campaignId) {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check campaign status
      if (campaign.status !== 'paused') {
        throw new Error(`Cannot resume campaign with status: ${campaign.status}`);
      }

      // Check device connection
      const SessionManager = require('../core/SessionManager').getInstance();
      const sessionStatus = SessionManager.getSessionStatus(campaign.device_id);
      if (!sessionStatus.connected) {
        throw new Error('Device session is not connected');
      }

      // Update campaign status to running
      await this.campaignRepository.updateStatus(campaignId, 'running');

      // Add campaign job to queue
      await this.queueManager.addCampaignJob({
        type: 'process_campaign',
        campaignId: campaignId,
        deviceId: campaign.device_id,
        userId: userId
      });

      // Emit real-time event
      this.socketManager.emitToDevice(campaign.device_id, 'campaign:resumed', {
        campaignId: campaignId,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} resumed`);

      return {
        success: true,
        message: 'Campaign resumed successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error resuming campaign:', error);
      throw error;
    }
  }

  /**
   * Schedule campaign
   */
  async scheduleCampaign(userId, campaignId, scheduledAt, timezone = 'UTC') {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check campaign status
      if (!['draft', 'paused'].includes(campaign.status)) {
        throw new Error(`Cannot schedule campaign with status: ${campaign.status}`);
      }

      // Parse and validate scheduled time
      const scheduledTime = moment.tz(scheduledAt, timezone);
      const now = moment();
      
      if (!scheduledTime.isValid()) {
        throw new Error('Invalid scheduled time format');
      }
      
      if (scheduledTime.isBefore(now)) {
        throw new Error('Scheduled time must be in the future');
      }

      // Generate targets if not already generated
      if (campaign.total_targets === 0) {
        await this.generateCampaignTargets(campaignId, campaign);
      }

      // Update campaign
      await this.campaignRepository.update(campaignId, {
        schedule_type: 'scheduled',
        scheduled_at: scheduledTime.toDate(),
        status: 'scheduled'
      });

      // Schedule campaign job
      const delay = scheduledTime.diff(now);
      await this.queueManager.addCampaignJob({
        type: 'process_campaign',
        campaignId: campaignId,
        deviceId: campaign.device_id,
        userId: userId
      }, {
        delay: delay,
        jobId: `campaign_${campaignId}_${Date.now()}`
      });

      // Emit real-time event
      this.socketManager.emitToDevice(campaign.device_id, 'campaign:scheduled', {
        campaignId: campaignId,
        scheduledAt: scheduledTime.toISOString(),
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} scheduled for ${scheduledTime.toISOString()}`);

      return {
        success: true,
        message: 'Campaign scheduled successfully',
        scheduledAt: scheduledTime.toISOString()
      };

    } catch (error) {
      logger.error('CampaignService: Error scheduling campaign:', error);
      throw error;
    }
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(userId, campaignId, newName = null) {
    try {
      // Get existing campaign
      const existingCampaign = await this.campaignRepository.findById(campaignId);
      if (!existingCampaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(existingCampaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Duplicate campaign
      const duplicatedCampaign = await this.campaignRepository.duplicate(campaignId, newName);

      // Emit real-time event
      this.socketManager.emitToDevice(existingCampaign.device_id, 'campaign:duplicated', {
        original: existingCampaign,
        duplicate: duplicatedCampaign,
        timestamp: new Date()
      });

      logger.info(`CampaignService: Campaign ${campaignId} duplicated as ${duplicatedCampaign.id}`);

      return {
        success: true,
        data: duplicatedCampaign,
        message: 'Campaign duplicated successfully'
      };

    } catch (error) {
      logger.error('CampaignService: Error duplicating campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStatistics(userId, deviceId, timeframe = '30d') {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Get statistics
      const stats = await this.campaignRepository.getStatistics(deviceId, timeframe);
      const performanceMetrics = await this.campaignRepository.getPerformanceMetrics(deviceId, 30);

      return {
        success: true,
        data: {
          statistics: stats,
          performance: performanceMetrics,
          device: {
            id: device.id,
            name: device.name,
            phone_number: device.phone_number
          },
          timeframe: timeframe
        }
      };

    } catch (error) {
      logger.error('CampaignService: Error getting campaign statistics:', error);
      throw error;
    }
  }

  /**
   * Get campaign targets
   */
  async getCampaignTargets(userId, campaignId, options = {}) {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(campaign.device_id, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const {
        page = 1,
        limit = 100,
        status = null,
        search = null
      } = options;

      const offset = (page - 1) * limit;
      let targets;

      if (search) {
        targets = await this.campaignTargetRepository.search(campaignId, search, {
          limit,
          offset,
          status
        });
      } else {
        targets = await this.campaignTargetRepository.findByCampaignId(campaignId, {
          limit,
          offset,
          status
        });
      }

      // Get target statistics
      const targetStats = await this.campaignTargetRepository.getStatistics(campaignId);

      return {
        success: true,
        data: targets,
        statistics: targetStats,
        pagination: {
          currentPage: page,
          limit
        }
      };

    } catch (error) {
      logger.error('CampaignService: Error getting campaign targets:', error);
      throw error;
    }
  }

  /**
   * Generate campaign targets
   */
  async generateCampaignTargets(campaignId, campaignData) {
    try {
      const targets = [];

      switch (campaignData.target_type) {
        case 'contacts':
          const contacts = await this.getContactTargets(campaignData.device_id, campaignData.target_filters);
          targets.push(...contacts.map(contact => ({
            campaign_id: campaignId,
            target_number: contact.phone_number,
            target_name: contact.name,
            target_type: 'contact',
            metadata: { contact_id: contact.id }
          })));
          break;

        case 'groups':
          const groups = await this.getGroupTargets(campaignData.device_id, campaignData.target_filters);
          targets.push(...groups.map(group => ({
            campaign_id: campaignId,
            target_number: group.group_id,
            target_name: group.name,
            target_type: 'group',
            metadata: { group_id: group.id }
          })));
          break;

        case 'numbers':
          if (campaignData.target_filters && campaignData.target_filters.numbers) {
            targets.push(...campaignData.target_filters.numbers.map(number => ({
              campaign_id: campaignId,
              target_number: this.normalizePhoneNumber(number),
              target_name: null,
              target_type: 'number'
            })));
          }
          break;

        case 'filtered':
          const filteredTargets = await this.getFilteredTargets(campaignData.device_id, campaignData.target_filters);
          targets.push(...filteredTargets);
          break;

        case 'mixed':
          // Combine multiple target types
          if (campaignData.target_filters) {
            if (campaignData.target_filters.contacts) {
              const mixedContacts = await this.getContactTargets(campaignData.device_id, campaignData.target_filters.contacts);
              targets.push(...mixedContacts.map(contact => ({
                campaign_id: campaignId,
                target_number: contact.phone_number,
                target_name: contact.name,
                target_type: 'contact',
                metadata: { contact_id: contact.id }
              })));
            }

            if (campaignData.target_filters.groups) {
              const mixedGroups = await this.getGroupTargets(campaignData.device_id, campaignData.target_filters.groups);
              targets.push(...mixedGroups.map(group => ({
                campaign_id: campaignId,
                target_number: group.group_id,
                target_name: group.name,
                target_type: 'group',
                metadata: { group_id: group.id }
              })));
            }

            if (campaignData.target_filters.numbers) {
              targets.push(...campaignData.target_filters.numbers.map(number => ({
                campaign_id: campaignId,
                target_number: this.normalizePhoneNumber(number),
                target_name: null,
                target_type: 'number'
              })));
            }
          }
          break;
      }

      // Remove duplicates
      const uniqueTargets = this.removeDuplicateTargets(targets);

      // Bulk create targets
      if (uniqueTargets.length > 0) {
        await this.campaignTargetRepository.bulkCreate(uniqueTargets);
      }

      // Update campaign total targets
      await this.campaignRepository.update(campaignId, {
        total_targets: uniqueTargets.length
      });

      logger.info(`CampaignService: Generated ${uniqueTargets.length} targets for campaign ${campaignId}`);

      return uniqueTargets.length;

    } catch (error) {
      logger.error('CampaignService: Error generating campaign targets:', error);
      throw error;
    }
  }

  /**
   * Regenerate campaign targets
   */
  async regenerateCampaignTargets(campaignId, campaignData) {
    try {
      // Delete existing targets
      await this.campaignTargetRepository.deleteByCampaignId(campaignId);

      // Generate new targets
      const targetCount = await this.generateCampaignTargets(campaignId, campaignData);

      logger.info(`CampaignService: Regenerated ${targetCount} targets for campaign ${campaignId}`);

      return targetCount;

    } catch (error) {
      logger.error('CampaignService: Error regenerating campaign targets:', error);
      throw error;
    }
  }

  /**
   * Get contact targets based on filters
   */
  async getContactTargets(deviceId, filters = {}) {
    try {
      const contactFilters = {
        device_id: deviceId,
        ...filters
      };

      // Get contacts based on filters
      const contacts = await this.contactRepository.findByFilters(contactFilters, {
        limit: 10000 // Large limit for campaign targets
      });

      return contacts;

    } catch (error) {
      logger.error('CampaignService: Error getting contact targets:', error);
      throw error;
    }
  }

  /**
   * Get group targets based on filters
   */
  async getGroupTargets(deviceId, filters = {}) {
    try {
      const groupFilters = {
        device_id: deviceId,
        ...filters
      };

      // Get groups based on filters
      const groups = await this.groupRepository.findByFilters(groupFilters, {
        limit: 1000 // Large limit for campaign targets
      });

      return groups;

    } catch (error) {
      logger.error('CampaignService: Error getting group targets:', error);
      throw error;
    }
  }

  /**
   * Get filtered targets (advanced filtering)
   */
  async getFilteredTargets(deviceId, filters) {
    try {
      const targets = [];

      // This would implement advanced filtering logic
      // For example: contacts with specific quality scores, recent activity, etc.
      
      if (filters.quality_score_min) {
        const qualityContacts = await this.contactRepository.findByQualityScore(
          deviceId, 
          filters.quality_score_min, 
          filters.quality_score_max || 100
        );
        
        targets.push(...qualityContacts.map(contact => ({
          target_number: contact.phone_number,
          target_name: contact.name,
          target_type: 'contact',
          metadata: { contact_id: contact.id, quality_score: contact.quality_score }
        })));
      }

      return targets;

    } catch (error) {
      logger.error('CampaignService: Error getting filtered targets:', error);
      throw error;
    }
  }

  /**
   * Remove duplicate targets
   */
  removeDuplicateTargets(targets) {
    const seen = new Set();
    return targets.filter(target => {
      const key = `${target.campaign_id}_${target.target_number}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Normalize phone number
   */
  normalizePhoneNumber(phoneNumber) {
    // Remove non-digit characters
    let normalized = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming Indonesia +62)
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.substring(1);
    } else if (!normalized.startsWith('62')) {
      normalized = '62' + normalized;
    }
    
    return normalized;
  }

  /**
   * Validate campaign data
   */
  validateCampaignData(data, isUpdate = false) {
    const errors = [];

    // Required fields for creation
    if (!isUpdate) {
      if (!data.device_id) {
        errors.push('Device ID is required');
      }
      if (!data.name || !data.name.trim()) {
        errors.push('Campaign name is required');
      }
      if (!data.message_type) {
        errors.push('Message type is required');
      }
      if (!data.message_content) {
        errors.push('Message content is required');
      }
      if (!data.target_type) {
        errors.push('Target type is required');
      }
    }

    // Validate message type
    if (data.message_type && !this.messageTypes.includes(data.message_type)) {
      errors.push(`Invalid message type. Must be one of: ${this.messageTypes.join(', ')}`);
    }

    // Validate target type
    if (data.target_type && !this.targetTypes.includes(data.target_type)) {
      errors.push(`Invalid target type. Must be one of: ${this.targetTypes.join(', ')}`);
    }

    // Validate schedule type
    if (data.schedule_type && !this.scheduleTypes.includes(data.schedule_type)) {
      errors.push(`Invalid schedule type. Must be one of: ${this.scheduleTypes.join(', ')}`);
    }

    // Validate message content based on type
    if (data.message_type && data.message_content) {
      const contentValidation = this.validateMessageContent(data.message_type, data.message_content);
      errors.push(...contentValidation);
    }

    // Validate delay settings
    if (data.delay_min !== undefined && (!Number.isInteger(data.delay_min) || data.delay_min < 1)) {
      errors.push('Minimum delay must be a positive integer');
    }

    if (data.delay_max !== undefined && (!Number.isInteger(data.delay_max) || data.delay_max < 1)) {
      errors.push('Maximum delay must be a positive integer');
    }

    if (data.delay_min !== undefined && data.delay_max !== undefined && data.delay_min > data.delay_max) {
      errors.push('Minimum delay cannot be greater than maximum delay');
    }

    // Validate scheduled time
    if (data.schedule_type === 'scheduled' && data.scheduled_at) {
      const scheduledTime = moment(data.scheduled_at);
      if (!scheduledTime.isValid()) {
        errors.push('Invalid scheduled time format');
      } else if (scheduledTime.isBefore(moment())) {
        errors.push('Scheduled time must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate message content by type
   */
  validateMessageContent(messageType, content) {
    const errors = [];

    switch (messageType) {
      case 'text':
        if (!content.text || typeof content.text !== 'string') {
          errors.push('Text content is required');
        } else if (content.text.length > 4096) {
          errors.push('Text message cannot exceed 4096 characters');
        }
        break;

      case 'image':
        if (!content.image) {
          errors.push('Image content is required');
        }
        if (content.caption && content.caption.length > 1024) {
          errors.push('Image caption cannot exceed 1024 characters');
        }
        break;

      case 'video':
        if (!content.video) {
          errors.push('Video content is required');
        }
        if (content.caption && content.caption.length > 1024) {
          errors.push('Video caption cannot exceed 1024 characters');
        }
        break;

      case 'document':
        if (!content.document) {
          errors.push('Document content is required');
        }
        if (!content.fileName) {
          errors.push('Document filename is required');
        }
        break;

      case 'audio':
        if (!content.audio) {
          errors.push('Audio content is required');
        }
        break;

      case 'location':
        const { location } = content;
        if (!location) {
          errors.push('Location data is required');
        } else {
          if (typeof location.degreesLatitude !== 'number' || 
              location.degreesLatitude < -90 || location.degreesLatitude > 90) {
            errors.push('Invalid latitude');
          }
          if (typeof location.degreesLongitude !== 'number' || 
              location.degreesLongitude < -180 || location.degreesLongitude > 180) {
            errors.push('Invalid longitude');
          }
        }
        break;

      case 'contact':
        if (!content.contacts || !content.contacts.displayName) {
          errors.push('Contact display name is required');
        }
        if (!content.contacts.contacts || !Array.isArray(content.contacts.contacts)) {
          errors.push('Contact vCard data is required');
        }
        break;

      case 'list':
        if (!content.text || !content.buttonText || !content.sections) {
          errors.push('List message requires text, buttonText, and sections');
        }
        if (!Array.isArray(content.sections) || content.sections.length === 0) {
          errors.push('List sections must be a non-empty array');
        }
        break;
    }

    return errors;
  }
}

module.exports = CampaignService;