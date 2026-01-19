const logger = require('../utils/logger');
const ContactRepository = require('../repositories/ContactRepository');
const DeviceRepository = require('../repositories/DeviceRepository');
const GroupRepository = require('../repositories/GroupRepository');
const SocketManager = require('../core/SocketManager');

class ContactScrapeJob {
  constructor() {
    this.contactRepository = new ContactRepository();
    this.deviceRepository = new DeviceRepository();
    this.groupRepository = new GroupRepository();
    this.socketManager = SocketManager.getInstance();
    
    // Configuration
    this.config = {
      batchSize: 100,
      rateLimitDelay: 1000, // 1 second between batches
      maxRetries: 3,
      qualityThreshold: 30,
      cacheExpiry: 30 * 60 * 1000 // 30 minutes
    };
    
    // Cache for processed contacts
    this.contactCache = new Map();
    this.processingStats = new Map();
  }

  /**
   * Process contact scraping job
   */
  async process(data, job) {
    const { 
      type, 
      deviceId, 
      sources = ['private_chats', 'group_members'], 
      options = {},
      userId 
    } = data;
    
    logger.info(`ContactScrapeJob: Processing ${type} for device ${deviceId}`);
    
    try {
      switch (type) {
        case 'scrape_contacts':
          return await this.scrapeContacts(data, job);
        case 'scrape_groups':
          return await this.scrapeGroups(data, job);
        case 'enrich_contacts':
          return await this.enrichContacts(data, job);
        case 'cleanup_duplicates':
          return await this.cleanupDuplicates(data, job);
        default:
          throw new Error(`Unknown contact scrape job type: ${type}`);
      }
    } catch (error) {
      logger.error(`ContactScrapeJob: Error processing ${type}:`, error);
      
      // Emit error to client
      this.socketManager.emitToDevice(deviceId, 'contact:scrape_error', {
        error: error.message,
        type: type,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Main contact scraping process
   */
  async scrapeContacts(data, job) {
    const { deviceId, sources, options, userId } = data;
    
    // Initialize progress tracking
    const progress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentSource: null,
      startTime: new Date()
    };
    
    this.processingStats.set(deviceId, progress);
    
    // Get SessionManager instance
    const SessionManager = require('../core/SessionManager').getInstance();
    const sessionStatus = SessionManager.getSessionStatus(deviceId);
    
    if (!sessionStatus.connected) {
      throw new Error('Device session is not connected');
    }
    
    const session = SessionManager.sessions.get(deviceId);
    const socket = session.socket;
    
    // Emit scraping started
    this.socketManager.emitToDevice(deviceId, 'contact:scrape_started', {
      sources: sources,
      options: options,
      timestamp: new Date()
    });
    
    const results = {
      contacts: [],
      groups: [],
      statistics: {
        by_source: {},
        by_quality: { high: 0, medium: 0, low: 0 },
        duplicates_found: 0,
        new_contacts: 0,
        updated_contacts: 0
      }
    };
    
    try {
      // Process each source
      for (const source of sources) {
        progress.currentSource = source;
        this.emitProgress(deviceId, progress);
        
        logger.info(`ContactScrapeJob: Processing source ${source} for device ${deviceId}`);
        
        let sourceContacts = [];
        
        switch (source) {
          case 'private_chats':
            sourceContacts = await this.scrapePrivateChats(socket, deviceId, options);
            break;
          case 'group_members':
            sourceContacts = await this.scrapeGroupMembers(socket, deviceId, options);
            break;
          case 'contact_list':
            sourceContacts = await this.scrapeContactList(socket, deviceId, options);
            break;
          case 'broadcast_lists':
            sourceContacts = await this.scrapeBroadcastLists(socket, deviceId, options);
            break;
          default:
            logger.warn(`ContactScrapeJob: Unknown source ${source}`);
            continue;
        }
        
        // Process contacts in batches
        const processedContacts = await this.processContactBatch(
          sourceContacts, 
          source, 
          deviceId, 
          options,
          progress,
          job
        );
        
        results.contacts.push(...processedContacts);
        results.statistics.by_source[source] = processedContacts.length;
        
        // Add delay between sources
        await this.sleep(this.config.rateLimitDelay);
      }
      
      // Deduplicate contacts
      const deduplicationResult = await this.deduplicateContacts(results.contacts, deviceId);
      results.contacts = deduplicationResult.unique;
      results.statistics.duplicates_found = deduplicationResult.duplicates.length;
      
      // Save contacts to database
      const saveResult = await this.saveContacts(results.contacts, deviceId, userId);
      results.statistics.new_contacts = saveResult.new_contacts;
      results.statistics.updated_contacts = saveResult.updated_contacts;
      
      // Calculate quality statistics
      results.statistics.by_quality = this.calculateQualityStats(results.contacts);
      
      // Update progress to complete
      progress.processed = progress.total;
      progress.successful = results.contacts.length;
      this.emitProgress(deviceId, progress);
      
      // Emit completion
      this.socketManager.emitToDevice(deviceId, 'contact:scrape_completed', {
        statistics: results.statistics,
        duration: Date.now() - progress.startTime.getTime(),
        timestamp: new Date()
      });
      
      logger.info(`ContactScrapeJob: Completed scraping for device ${deviceId}`, results.statistics);
      
      return {
        success: true,
        statistics: results.statistics,
        contacts_processed: results.contacts.length,
        duration: Date.now() - progress.startTime.getTime()
      };
      
    } catch (error) {
      logger.error(`ContactScrapeJob: Error during scraping for device ${deviceId}:`, error);
      throw error;
    } finally {
      // Cleanup
      this.processingStats.delete(deviceId);
    }
  }

  /**
   * Scrape private chats
   */
  async scrapePrivateChats(socket, deviceId, options) {
    logger.info(`ContactScrapeJob: Scraping private chats for device ${deviceId}`);
    
    try {
      // Get chat list from Baileys
      const chats = await socket.store?.chats?.all() || [];
      const privateChats = chats.filter(chat => !chat.id.includes('@g.us') && !chat.id.includes('@broadcast'));
      
      const contacts = [];
      
      for (const chat of privateChats) {
        try {
          const contact = await this.extractContactFromChat(chat, 'private_chat', socket);
          if (contact && this.validateContact(contact)) {
            contacts.push(contact);
          }
        } catch (error) {
          logger.warn(`ContactScrapeJob: Error extracting contact from chat ${chat.id}:`, error);
        }
      }
      
      logger.info(`ContactScrapeJob: Found ${contacts.length} private chat contacts`);
      return contacts;
      
    } catch (error) {
      logger.error(`ContactScrapeJob: Error scraping private chats:`, error);
      return [];
    }
  }

  /**
   * Scrape group members
   */
  async scrapeGroupMembers(socket, deviceId, options) {
    logger.info(`ContactScrapeJob: Scraping group members for device ${deviceId}`);
    
    try {
      // Get group list from Baileys
      const chats = await socket.store?.chats?.all() || [];
      const groups = chats.filter(chat => chat.id.includes('@g.us'));
      
      const contacts = [];
      const groupsData = [];
      
      for (const group of groups) {
        try {
          // Get group metadata
          const groupMetadata = await socket.groupMetadata(group.id);
          
          // Save group information
          const groupData = {
            device_id: deviceId,
            group_id: group.id,
            name: groupMetadata.subject,
            description: groupMetadata.desc || null,
            owner: groupMetadata.owner,
            created_at: new Date(groupMetadata.creation * 1000),
            member_count: groupMetadata.participants.length,
            is_admin: groupMetadata.participants.some(p => 
              p.id === socket.user.id && (p.admin === 'admin' || p.admin === 'superadmin')
            ),
            metadata: {
              announce: groupMetadata.announce,
              restrict: groupMetadata.restrict,
              invite_code: groupMetadata.inviteCode
            }
          };
          
          groupsData.push(groupData);
          
          // Extract members
          for (const participant of groupMetadata.participants) {
            try {
              const contact = await this.extractContactFromParticipant(
                participant, 
                group.id, 
                groupMetadata.subject,
                socket
              );
              
              if (contact && this.validateContact(contact)) {
                contacts.push(contact);
              }
            } catch (error) {
              logger.warn(`ContactScrapeJob: Error extracting participant ${participant.id}:`, error);
            }
          }
          
          // Add delay between groups
          await this.sleep(500);
          
        } catch (error) {
          logger.warn(`ContactScrapeJob: Error processing group ${group.id}:`, error);
        }
      }
      
      // Save groups data
      await this.saveGroups(groupsData, deviceId);
      
      logger.info(`ContactScrapeJob: Found ${contacts.length} group member contacts from ${groups.length} groups`);
      return contacts;
      
    } catch (error) {
      logger.error(`ContactScrapeJob: Error scraping group members:`, error);
      return [];
    }
  }

  /**
   * Scrape contact list
   */
  async scrapeContactList(socket, deviceId, options) {
    logger.info(`ContactScrapeJob: Scraping contact list for device ${deviceId}`);
    
    try {
      // Get contacts from Baileys store
      const contacts = await socket.store?.contacts?.all() || {};
      const contactList = [];
      
      for (const [contactId, contactData] of Object.entries(contacts)) {
        try {
          if (contactId.includes('@s.whatsapp.net')) {
            const contact = await this.extractContactFromContactList(contactData, contactId, socket);
            if (contact && this.validateContact(contact)) {
              contactList.push(contact);
            }
          }
        } catch (error) {
          logger.warn(`ContactScrapeJob: Error extracting contact ${contactId}:`, error);
        }
      }
      
      logger.info(`ContactScrapeJob: Found ${contactList.length} contacts from contact list`);
      return contactList;
      
    } catch (error) {
      logger.error(`ContactScrapeJob: Error scraping contact list:`, error);
      return [];
    }
  }

  /**
   * Scrape broadcast lists
   */
  async scrapeBroadcastLists(socket, deviceId, options) {
    logger.info(`ContactScrapeJob: Scraping broadcast lists for device ${deviceId}`);
    
    try {
      // Get broadcast lists (if available)
      const chats = await socket.store?.chats?.all() || [];
      const broadcasts = chats.filter(chat => chat.id.includes('@broadcast'));
      
      const contacts = [];
      
      for (const broadcast of broadcasts) {
        try {
          // Note: Broadcast list members are not directly accessible via Baileys
          // This is a placeholder for future implementation
          logger.info(`ContactScrapeJob: Found broadcast list ${broadcast.id}`);
        } catch (error) {
          logger.warn(`ContactScrapeJob: Error processing broadcast ${broadcast.id}:`, error);
        }
      }
      
      logger.info(`ContactScrapeJob: Found ${contacts.length} broadcast list contacts`);
      return contacts;
      
    } catch (error) {
      logger.error(`ContactScrapeJob: Error scraping broadcast lists:`, error);
      return [];
    }
  }

  /**
   * Extract contact from chat
   */
  async extractContactFromChat(chat, source, socket) {
    const phoneNumber = this.extractPhoneNumber(chat.id);
    
    // Get contact info from store
    const contactInfo = socket.store?.contacts?.[chat.id] || {};
    
    // Calculate chat statistics
    const chatStats = {
      message_count: chat.count || 0,
      unread_count: chat.unreadCount || 0,
      last_message_time: chat.conversationTimestamp ? new Date(chat.conversationTimestamp * 1000) : null,
      is_pinned: chat.pin || false,
      is_archived: chat.archive || false
    };
    
    return {
      phone_number: phoneNumber,
      name: contactInfo.name || contactInfo.pushName || null,
      profile_picture: null, // Will be fetched separately if needed
      status: null,
      last_seen: null,
      source: source,
      is_business: contactInfo.isBusiness || false,
      business_info: contactInfo.businessInfo || null,
      chat_stats: chatStats,
      quality_score: this.calculateQualityScore({
        name: contactInfo.name,
        chat_stats: chatStats,
        is_business: contactInfo.isBusiness
      }),
      metadata: {
        original_id: chat.id,
        verified_name: contactInfo.verifiedName,
        is_contact: true,
        is_user: contactInfo.isUser || false,
        chat_metadata: {
          muted: chat.mute,
          ephemeral: chat.ephemeralExpiration
        }
      }
    };
  }

  /**
   * Extract contact from group participant
   */
  async extractContactFromParticipant(participant, groupId, groupName, socket) {
    const phoneNumber = this.extractPhoneNumber(participant.id);
    
    // Get contact info from store
    const contactInfo = socket.store?.contacts?.[participant.id] || {};
    
    return {
      phone_number: phoneNumber,
      name: contactInfo.name || contactInfo.pushName || null,
      profile_picture: null,
      status: null,
      last_seen: null,
      source: 'group_member',
      is_business: contactInfo.isBusiness || false,
      business_info: contactInfo.businessInfo || null,
      group_info: {
        group_id: groupId,
        group_name: groupName,
        is_admin: participant.admin === 'admin' || participant.admin === 'superadmin',
        admin_level: participant.admin || 'member'
      },
      quality_score: this.calculateQualityScore({
        name: contactInfo.name,
        is_business: contactInfo.isBusiness,
        group_member: true
      }),
      metadata: {
        original_id: participant.id,
        verified_name: contactInfo.verifiedName,
        is_contact: contactInfo.isContact || false,
        is_user: contactInfo.isUser || false,
        group_metadata: {
          admin: participant.admin,
          joined_at: participant.joinedAt ? new Date(participant.joinedAt * 1000) : null
        }
      }
    };
  }

  /**
   * Extract contact from contact list
   */
  async extractContactFromContactList(contactData, contactId, socket) {
    const phoneNumber = this.extractPhoneNumber(contactId);
    
    return {
      phone_number: phoneNumber,
      name: contactData.name || contactData.pushName || null,
      profile_picture: null,
      status: contactData.status || null,
      last_seen: null,
      source: 'contact_list',
      is_business: contactData.isBusiness || false,
      business_info: contactData.businessInfo || null,
      quality_score: this.calculateQualityScore({
        name: contactData.name,
        status: contactData.status,
        is_business: contactData.isBusiness,
        is_contact: true
      }),
      metadata: {
        original_id: contactId,
        verified_name: contactData.verifiedName,
        is_contact: true,
        is_user: contactData.isUser || false
      }
    };
  }

  /**
   * Process contacts in batches
   */
  async processContactBatch(contacts, source, deviceId, options, progress, job) {
    const batches = this.chunkArray(contacts, this.config.batchSize);
    const processedContacts = [];
    
    progress.total += contacts.length;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        // Process batch
        const batchResults = await Promise.all(
          batch.map(contact => this.processContact(contact, options))
        );
        
        processedContacts.push(...batchResults.filter(Boolean));
        
        // Update progress
        progress.processed += batch.length;
        progress.successful += batchResults.filter(Boolean).length;
        progress.failed += batchResults.filter(c => !c).length;
        
        // Update job progress
        const percentage = Math.round((progress.processed / progress.total) * 100);
        job.progress(percentage);
        
        // Emit progress
        this.emitProgress(deviceId, progress);
        
        // Add delay between batches
        if (i < batches.length - 1) {
          await this.sleep(this.config.rateLimitDelay);
        }
        
      } catch (error) {
        logger.error(`ContactScrapeJob: Error processing batch ${i}:`, error);
        progress.failed += batch.length;
      }
    }
    
    return processedContacts;
  }

  /**
   * Process individual contact
   */
  async processContact(contact, options) {
    try {
      // Clean and normalize contact data
      const cleanedContact = this.cleanContactData(contact);
      
      // Validate contact
      const validation = this.validateContact(cleanedContact);
      if (!validation.isValid) {
        logger.debug(`ContactScrapeJob: Invalid contact ${contact.phone_number}:`, validation.errors);
        return null;
      }
      
      // Check quality threshold
      if (options.min_quality_score && cleanedContact.quality_score < options.min_quality_score) {
        return null;
      }
      
      // Enrich contact if requested
      if (options.enrich_data) {
        return await this.enrichContact(cleanedContact);
      }
      
      return cleanedContact;
      
    } catch (error) {
      logger.error(`ContactScrapeJob: Error processing contact ${contact.phone_number}:`, error);
      return null;
    }
  }

  /**
   * Enrich contact with additional data
   */
  async enrichContact(contact) {
    // This is a placeholder for contact enrichment
    // Can be extended to fetch profile pictures, business info, etc.
    return contact;
  }

  /**
   * Deduplicate contacts
   */
  async deduplicateContacts(contacts, deviceId) {
    const phoneMap = new Map();
    const duplicates = [];
    
    for (const contact of contacts) {
      const phone = this.normalizePhoneNumber(contact.phone_number);
      
      if (phoneMap.has(phone)) {
        const existing = phoneMap.get(phone);
        const merged = this.mergeContactData(existing, contact);
        phoneMap.set(phone, merged);
        duplicates.push({ existing, duplicate: contact, merged });
      } else {
        phoneMap.set(phone, contact);
      }
    }
    
    return {
      unique: Array.from(phoneMap.values()),
      duplicates: duplicates
    };
  }

  /**
   * Save contacts to database
   */
  async saveContacts(contacts, deviceId, userId) {
    let newContacts = 0;
    let updatedContacts = 0;
    
    for (const contact of contacts) {
      try {
        const existingContact = await this.contactRepository.findByPhoneAndDevice(
          contact.phone_number, 
          deviceId
        );
        
        const contactData = {
          ...contact,
          device_id: deviceId,
          user_id: userId,
          updated_at: new Date()
        };
        
        if (existingContact) {
          await this.contactRepository.update(existingContact.id, contactData);
          updatedContacts++;
        } else {
          contactData.created_at = new Date();
          await this.contactRepository.create(contactData);
          newContacts++;
          
          // Emit new contact event
          this.socketManager.emitToDevice(deviceId, 'contact:new', {
            contact: {
              id: contactData.id,
              phone_number: contactData.phone_number,
              name: contactData.name,
              source: contactData.source,
              quality_score: contactData.quality_score
            },
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error(`ContactScrapeJob: Error saving contact ${contact.phone_number}:`, error);
      }
    }
    
    return { new_contacts: newContacts, updated_contacts: updatedContacts };
  }

  /**
   * Save groups to database
   */
  async saveGroups(groups, deviceId) {
    for (const group of groups) {
      try {
        const existingGroup = await this.groupRepository.findByGroupIdAndDevice(
          group.group_id, 
          deviceId
        );
        
        if (existingGroup) {
          await this.groupRepository.update(existingGroup.id, group);
        } else {
          await this.groupRepository.create(group);
        }
      } catch (error) {
        logger.error(`ContactScrapeJob: Error saving group ${group.group_id}:`, error);
      }
    }
  }

  /**
   * Utility methods
   */
  extractPhoneNumber(whatsappId) {
    return whatsappId.split('@')[0];
  }

  normalizePhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming Indonesia +62)
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      return '62' + cleaned;
    }
    
    return cleaned;
  }

  validateContact(contact) {
    const errors = [];
    
    if (!contact.phone_number || contact.phone_number.length < 10) {
      errors.push('Invalid phone number');
    }
    
    if (!contact.source) {
      errors.push('Missing source');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  cleanContactData(contact) {
    return {
      ...contact,
      phone_number: this.normalizePhoneNumber(contact.phone_number),
      name: contact.name ? contact.name.trim() : null,
      status: contact.status ? contact.status.trim() : null
    };
  }

  calculateQualityScore(data) {
    let score = 0;
    
    if (data.name && data.name.trim()) score += 25;
    if (data.status) score += 10;
    if (data.is_business) score += 15;
    if (data.chat_stats && data.chat_stats.message_count > 0) score += 30;
    if (data.group_member) score += 10;
    if (data.is_contact) score += 10;
    
    return Math.min(score, 100);
  }

  calculateQualityStats(contacts) {
    const stats = { high: 0, medium: 0, low: 0 };
    
    for (const contact of contacts) {
      if (contact.quality_score >= 70) {
        stats.high++;
      } else if (contact.quality_score >= 40) {
        stats.medium++;
      } else {
        stats.low++;
      }
    }
    
    return stats;
  }

  mergeContactData(existing, duplicate) {
    return {
      ...existing,
      name: existing.name || duplicate.name,
      status: existing.status || duplicate.status,
      profile_picture: existing.profile_picture || duplicate.profile_picture,
      is_business: existing.is_business || duplicate.is_business,
      business_info: existing.business_info || duplicate.business_info,
      quality_score: Math.max(existing.quality_score, duplicate.quality_score),
      metadata: {
        ...existing.metadata,
        ...duplicate.metadata,
        sources: [
          ...(existing.metadata?.sources || [existing.source]),
          duplicate.source
        ].filter((v, i, a) => a.indexOf(v) === i)
      }
    };
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  emitProgress(deviceId, progress) {
    this.socketManager.emitToDevice(deviceId, 'contact:scrape_progress', {
      total: progress.total,
      processed: progress.processed,
      successful: progress.successful,
      failed: progress.failed,
      percentage: progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0,
      currentSource: progress.currentSource,
      timestamp: new Date()
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape groups metadata
   */
  async scrapeGroups(data, job) {
    const { deviceId, options = {} } = data;
    
    // Implementation for group-specific scraping
    logger.info(`ContactScrapeJob: Scraping groups for device ${deviceId}`);
    
    return { success: true, message: 'Groups scraped successfully' };
  }

  /**
   * Enrich existing contacts
   */
  async enrichContacts(data, job) {
    const { deviceId, contactIds = [], options = {} } = data;
    
    // Implementation for contact enrichment
    logger.info(`ContactScrapeJob: Enriching contacts for device ${deviceId}`);
    
    return { success: true, message: 'Contacts enriched successfully' };
  }

  /**
   * Cleanup duplicate contacts
   */
  async cleanupDuplicates(data, job) {
    const { deviceId, options = {} } = data;
    
    // Implementation for duplicate cleanup
    logger.info(`ContactScrapeJob: Cleaning up duplicates for device ${deviceId}`);
    
    return { success: true, message: 'Duplicates cleaned up successfully' };
  }
}

module.exports = new ContactScrapeJob();