const ContactRepository = require('../repositories/ContactRepository');
const GroupRepository = require('../repositories/GroupRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const QueueManager = require('../core/QueueManager');
const SocketManager = require('../core/SocketManager');
const logger = require('../utils/logger');

class ContactService {
  constructor() {
    this.contactRepository = new ContactRepository();
    this.groupRepository = new GroupRepository();
    this.deviceRepository = new DeviceRepository();
    this.queueManager = QueueManager.getInstance();
    this.socketManager = SocketManager.getInstance();
  }

  /**
   * Start contact scraping
   */
  async startScraping(userId, deviceId, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Check if device is active and connected
      if (!device.is_active) {
        throw new Error('Device is not active');
      }

      const SessionManager = require('../core/SessionManager').getInstance();
      const sessionStatus = SessionManager.getSessionStatus(deviceId);
      
      if (!sessionStatus.connected) {
        throw new Error('Device session is not connected');
      }

      // Default scraping options
      const scrapingOptions = {
        sources: options.sources || ['private_chats', 'group_members'],
        min_quality_score: options.min_quality_score || 0,
        enrich_data: options.enrich_data || false,
        include_inactive: options.include_inactive || false,
        ...options
      };

      // Add scraping job to queue
      const job = await this.queueManager.addContactScrapeJob({
        type: 'scrape_contacts',
        deviceId: deviceId,
        userId: userId,
        sources: scrapingOptions.sources,
        options: scrapingOptions
      });

      logger.info(`ContactService: Started scraping for device ${deviceId}, job ${job.id}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Contact scraping started',
        options: scrapingOptions
      };

    } catch (error) {
      logger.error(`ContactService: Error starting scraping for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get scraping status
   */
  async getScrapingStatus(userId, jobId) {
    try {
      const job = await this.queueManager.getJob('contactScrape', jobId);
      
      if (!job) {
        return { found: false, message: 'Job not found' };
      }

      // Verify job belongs to user (basic security check)
      if (job.data.userId !== userId) {
        throw new Error('Access denied');
      }

      const status = await job.getState();
      const progress = job.progress();

      return {
        found: true,
        jobId: jobId,
        status: status,
        progress: progress,
        data: job.data,
        createdAt: new Date(job.timestamp),
        processedOn: job.processedOn ? new Date(job.processedOn) : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
        failedReason: job.failedReason || null
      };

    } catch (error) {
      logger.error(`ContactService: Error getting scraping status for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get contacts with filtering and pagination
   */
  async getContacts(userId, deviceId, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const {
        page = 1,
        limit = 50,
        search = null,
        source = null,
        minQualityScore = null,
        maxQualityScore = null,
        businessOnly = false,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      const offset = (page - 1) * limit;

      let contacts;
      let totalCount;

      if (search) {
        // Search contacts
        contacts = await this.contactRepository.search(search, deviceId, {
          limit,
          offset,
          source
        });
        
        // Get total count for search
        totalCount = await this.contactRepository.count({
          device_id: deviceId,
          ...(source && { source })
        });
      } else {
        // Get contacts with filters
        const filters = { device_id: deviceId };
        
        if (source) filters.source = source;
        if (businessOnly) filters.is_business = 1;

        contacts = await this.contactRepository.findAll(filters, {
          limit,
          offset,
          orderBy,
          orderDirection
        });

        totalCount = await this.contactRepository.count(filters);
      }

      // Apply quality score filters if specified
      if (minQualityScore !== null || maxQualityScore !== null) {
        contacts = contacts.filter(contact => {
          if (minQualityScore !== null && contact.quality_score < minQualityScore) {
            return false;
          }
          if (maxQualityScore !== null && contact.quality_score > maxQualityScore) {
            return false;
          }
          return true;
        });
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: contacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          search,
          source,
          minQualityScore,
          maxQualityScore,
          businessOnly
        }
      };

    } catch (error) {
      logger.error(`ContactService: Error getting contacts for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get contact statistics
   */
  async getContactStatistics(userId, deviceId) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const stats = await this.contactRepository.getStatistics(deviceId);
      const growthStats = await this.contactRepository.getGrowthStats(deviceId, 30);
      const recentContacts = await this.contactRepository.getRecentContacts(deviceId, 7, 10);

      return {
        overview: stats,
        growth: growthStats,
        recent: recentContacts,
        device: {
          id: device.id,
          name: device.name,
          phone_number: device.phone_number,
          status: device.status
        }
      };

    } catch (error) {
      logger.error(`ContactService: Error getting statistics for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get groups with filtering and pagination
   */
  async getGroups(userId, deviceId, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const {
        page = 1,
        limit = 50,
        search = null,
        adminOnly = false,
        minMembers = null,
        maxMembers = null,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      const offset = (page - 1) * limit;

      let groups;
      let totalCount;

      if (search) {
        // Search groups
        groups = await this.groupRepository.searchByName(search, deviceId, {
          limit,
          offset
        });
        totalCount = await this.groupRepository.count({ device_id: deviceId });
      } else {
        // Get groups with filters
        const queryOptions = {
          limit,
          offset,
          orderBy,
          orderDirection
        };

        if (adminOnly) {
          groups = await this.groupRepository.findAdminGroups(deviceId, queryOptions);
        } else if (minMembers !== null || maxMembers !== null) {
          groups = await this.groupRepository.findByMemberCountRange(
            minMembers || 1,
            maxMembers || 1000,
            deviceId,
            queryOptions
          );
        } else {
          groups = await this.groupRepository.findByDeviceId(deviceId, queryOptions);
        }

        totalCount = await this.groupRepository.count({ device_id: deviceId });
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: groups,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          search,
          adminOnly,
          minMembers,
          maxMembers
        }
      };

    } catch (error) {
      logger.error(`ContactService: Error getting groups for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get group statistics
   */
  async getGroupStatistics(userId, deviceId) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const stats = await this.groupRepository.getStatistics(deviceId);
      const activitySummary = await this.groupRepository.getActivitySummary(deviceId, '7d');
      const largestGroups = await this.groupRepository.getLargestGroups(deviceId, 10);
      const recentGroups = await this.groupRepository.getRecentGroups(deviceId, 7, 10);

      return {
        overview: stats,
        activity: activitySummary,
        largest: largestGroups,
        recent: recentGroups,
        device: {
          id: device.id,
          name: device.name,
          phone_number: device.phone_number,
          status: device.status
        }
      };

    } catch (error) {
      logger.error(`ContactService: Error getting group statistics for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Enrich contacts with additional data
   */
  async enrichContacts(userId, deviceId, contactIds = []) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Add enrichment job to queue
      const job = await this.queueManager.addContactScrapeJob({
        type: 'enrich_contacts',
        deviceId: deviceId,
        userId: userId,
        contactIds: contactIds,
        options: {}
      });

      logger.info(`ContactService: Started contact enrichment for device ${deviceId}, job ${job.id}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Contact enrichment started',
        contactCount: contactIds.length || 'all'
      };

    } catch (error) {
      logger.error(`ContactService: Error starting enrichment for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup duplicate contacts
   */
  async cleanupDuplicates(userId, deviceId) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Get duplicate contacts
      const duplicates = await this.contactRepository.findDuplicates(deviceId);

      if (duplicates.length === 0) {
        return {
          success: true,
          message: 'No duplicate contacts found',
          duplicatesFound: 0,
          duplicatesRemoved: 0
        };
      }

      // Add cleanup job to queue
      const job = await this.queueManager.addContactScrapeJob({
        type: 'cleanup_duplicates',
        deviceId: deviceId,
        userId: userId,
        duplicates: duplicates,
        options: {}
      });

      logger.info(`ContactService: Started duplicate cleanup for device ${deviceId}, job ${job.id}`);

      return {
        success: true,
        jobId: job.id,
        message: 'Duplicate cleanup started',
        duplicatesFound: duplicates.length
      };

    } catch (error) {
      logger.error(`ContactService: Error starting duplicate cleanup for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Export contacts
   */
  async exportContacts(userId, deviceId, format = 'json', options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const exportData = await this.contactRepository.exportContacts(deviceId, format, options);

      logger.info(`ContactService: Exported contacts for device ${deviceId} in ${format} format`);

      return {
        success: true,
        format: format,
        data: exportData,
        count: Array.isArray(exportData) ? exportData.length : exportData.split('\n').length - 1,
        exportedAt: new Date()
      };

    } catch (error) {
      logger.error(`ContactService: Error exporting contacts for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Export groups
   */
  async exportGroups(userId, deviceId, format = 'json') {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const exportData = await this.groupRepository.exportGroups(deviceId, format);

      logger.info(`ContactService: Exported groups for device ${deviceId} in ${format} format`);

      return {
        success: true,
        format: format,
        data: exportData,
        count: Array.isArray(exportData) ? exportData.length : exportData.split('\n').length - 1,
        exportedAt: new Date()
      };

    } catch (error) {
      logger.error(`ContactService: Error exporting groups for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get contacts for campaign targeting
   */
  async getContactsForCampaign(userId, deviceId, targetingOptions = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const contacts = await this.contactRepository.getContactsForTargeting(deviceId, targetingOptions);

      return {
        success: true,
        contacts: contacts,
        count: contacts.length,
        targeting: targetingOptions
      };

    } catch (error) {
      logger.error(`ContactService: Error getting contacts for campaign targeting:`, error);
      throw error;
    }
  }

  /**
   * Get groups for campaign targeting
   */
  async getGroupsForCampaign(userId, deviceId, targetingOptions = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const groups = await this.groupRepository.getGroupsForTargeting(deviceId, targetingOptions);

      return {
        success: true,
        groups: groups,
        count: groups.length,
        targeting: targetingOptions
      };

    } catch (error) {
      logger.error(`ContactService: Error getting groups for campaign targeting:`, error);
      throw error;
    }
  }

  /**
   * Schedule automatic scraping
   */
  async scheduleAutoScraping(userId, deviceId, schedule, options = {}) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Schedule recurring scraping job
      const job = await this.queueManager.scheduleRecurringJob(
        'contactScrape',
        {
          type: 'scrape_contacts',
          deviceId: deviceId,
          userId: userId,
          sources: options.sources || ['private_chats', 'group_members'],
          options: options
        },
        schedule // Cron pattern
      );

      logger.info(`ContactService: Scheduled auto scraping for device ${deviceId}, job ${job.id}`);

      return {
        success: true,
        jobId: job.id,
        schedule: schedule,
        message: 'Auto scraping scheduled successfully'
      };

    } catch (error) {
      logger.error(`ContactService: Error scheduling auto scraping for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(userId, deviceId, contactId) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Find and validate contact
      const contact = await this.contactRepository.findById(contactId);
      if (!contact || contact.device_id !== deviceId) {
        throw new Error('Contact not found or access denied');
      }

      // Delete contact
      const deleted = await this.contactRepository.delete(contactId);

      if (deleted) {
        logger.info(`ContactService: Deleted contact ${contactId} from device ${deviceId}`);
        
        // Emit event
        this.socketManager.emitToDevice(deviceId, 'contact:deleted', {
          contactId: contactId,
          phoneNumber: contact.phone_number,
          timestamp: new Date()
        });
      }

      return {
        success: deleted,
        message: deleted ? 'Contact deleted successfully' : 'Contact not found'
      };

    } catch (error) {
      logger.error(`ContactService: Error deleting contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(userId, deviceId, contactId, updateData) {
    try {
      // Validate device ownership
      const device = await this.deviceRepository.findByIdAndUserId(deviceId, userId);
      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Find and validate contact
      const contact = await this.contactRepository.findById(contactId);
      if (!contact || contact.device_id !== deviceId) {
        throw new Error('Contact not found or access denied');
      }

      // Update contact
      const updatedContact = await this.contactRepository.update(contactId, {
        ...updateData,
        updated_at: new Date()
      });

      if (updatedContact) {
        logger.info(`ContactService: Updated contact ${contactId} from device ${deviceId}`);
        
        // Emit event
        this.socketManager.emitToDevice(deviceId, 'contact:updated', {
          contactId: contactId,
          contact: updatedContact,
          timestamp: new Date()
        });
      }

      return {
        success: !!updatedContact,
        contact: updatedContact,
        message: updatedContact ? 'Contact updated successfully' : 'Contact not found'
      };

    } catch (error) {
      logger.error(`ContactService: Error updating contact ${contactId}:`, error);
      throw error;
    }
  }
}

module.exports = ContactService;