const BaseRepository = require('./BaseRepository');

class ContactRepository extends BaseRepository {
  constructor() {
    super('contacts');
  }

  /**
   * Find contact by phone number and device
   */
  async findByPhoneAndDevice(phoneNumber, deviceId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE phone_number = ? AND device_id = ?
      LIMIT 1
    `;
    
    const [rows] = await this.db.execute(query, [phoneNumber, deviceId]);
    return rows[0] || null;
  }

  /**
   * Find contacts by device ID
   */
  async findByDeviceId(deviceId, options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      orderBy = 'created_at', 
      orderDirection = 'DESC',
      source = null,
      minQualityScore = null
    } = options;
    
    let query = `SELECT * FROM ${this.tableName} WHERE device_id = ?`;
    let params = [deviceId];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    if (minQualityScore !== null) {
      query += ' AND quality_score >= ?';
      params.push(minQualityScore);
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Find contacts by user ID
   */
  async findByUserId(userId, options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      orderBy = 'created_at', 
      orderDirection = 'DESC',
      source = null,
      deviceId = null
    } = options;
    
    let query = `
      SELECT c.*, d.name as device_name, d.phone_number as device_phone
      FROM ${this.tableName} c
      JOIN devices d ON c.device_id = d.id
      WHERE c.user_id = ?
    `;
    
    let params = [userId];
    
    if (deviceId) {
      query += ' AND c.device_id = ?';
      params.push(deviceId);
    }
    
    if (source) {
      query += ' AND c.source = ?';
      params.push(source);
    }
    
    query += ` ORDER BY c.${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Search contacts by name or phone
   */
  async search(searchTerm, deviceId = null, options = {}) {
    const { limit = 20, offset = 0, source = null } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE (name LIKE ? OR phone_number LIKE ?)
    `;
    
    let params = [`%${searchTerm}%`, `%${searchTerm}%`];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    query += ' ORDER BY quality_score DESC, name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get contact statistics
   */
  async getStatistics(deviceId = null, userId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN source = 'private_chat' THEN 1 END) as private_chats,
        COUNT(CASE WHEN source = 'group_member' THEN 1 END) as group_members,
        COUNT(CASE WHEN source = 'contact_list' THEN 1 END) as contact_list,
        COUNT(CASE WHEN source = 'broadcast' THEN 1 END) as broadcast_lists,
        COUNT(CASE WHEN is_business = 1 THEN 1 END) as business_contacts,
        COUNT(CASE WHEN quality_score >= 70 THEN 1 END) as high_quality,
        COUNT(CASE WHEN quality_score >= 40 AND quality_score < 70 THEN 1 END) as medium_quality,
        COUNT(CASE WHEN quality_score < 40 THEN 1 END) as low_quality,
        AVG(quality_score) as avg_quality_score,
        MAX(created_at) as last_scrape
      FROM ${this.tableName}
    `;
    
    let params = [];
    let conditions = [];
    
    if (deviceId) {
      conditions.push('device_id = ?');
      params.push(deviceId);
    }
    
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const [rows] = await this.db.execute(query, params);
    return rows[0] || {
      total_contacts: 0,
      private_chats: 0,
      group_members: 0,
      contact_list: 0,
      broadcast_lists: 0,
      business_contacts: 0,
      high_quality: 0,
      medium_quality: 0,
      low_quality: 0,
      avg_quality_score: 0,
      last_scrape: null
    };
  }

  /**
   * Get contacts by quality score range
   */
  async findByQualityRange(minScore, maxScore, deviceId = null, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'quality_score', orderDirection = 'DESC' } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE quality_score BETWEEN ? AND ?
    `;
    
    let params = [minScore, maxScore];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get business contacts
   */
  async findBusinessContacts(deviceId = null, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'quality_score', orderDirection = 'DESC' } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE is_business = 1
    `;
    
    let params = [];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get contacts by source
   */
  async findBySource(source, deviceId = null, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE source = ?
    `;
    
    let params = [source];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get recently added contacts
   */
  async getRecentContacts(deviceId = null, days = 7, limit = 20) {
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    let params = [days];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get contacts with chat activity
   */
  async findActiveContacts(deviceId = null, options = {}) {
    const { 
      minMessages = 1, 
      limit = 50, 
      offset = 0,
      orderBy = 'quality_score',
      orderDirection = 'DESC'
    } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE JSON_EXTRACT(chat_stats, '$.message_count') >= ?
    `;
    
    let params = [minMessages];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Update contact quality score
   */
  async updateQualityScore(contactId, qualityScore) {
    const query = `
      UPDATE ${this.tableName}
      SET quality_score = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await this.db.execute(query, [qualityScore, contactId]);
    return result.affectedRows > 0;
  }

  /**
   * Bulk update contacts
   */
  async bulkUpdateContacts(updates) {
    if (!updates || updates.length === 0) {
      return 0;
    }

    let affectedRows = 0;
    
    for (const update of updates) {
      try {
        const { phone_number, device_id, ...updateData } = update;
        
        const result = await this.updateWhere(
          { phone_number, device_id },
          { ...updateData, updated_at: new Date() }
        );
        
        affectedRows += result;
      } catch (error) {
        logger.error(`ContactRepository: Error updating contact ${update.phone_number}:`, error);
      }
    }
    
    return affectedRows;
  }

  /**
   * Find duplicate contacts
   */
  async findDuplicates(deviceId = null) {
    let query = `
      SELECT 
        phone_number,
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id) as contact_ids,
        GROUP_CONCAT(source) as sources
      FROM ${this.tableName}
    `;
    
    let params = [];
    
    if (deviceId) {
      query += ' WHERE device_id = ?';
      params.push(deviceId);
    }
    
    query += `
      GROUP BY phone_number
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Merge duplicate contacts
   */
  async mergeDuplicates(phoneNumber, deviceId, keepContactId) {
    try {
      await this.beginTransaction();
      
      // Get all contacts with this phone number
      const duplicates = await this.findAll({
        phone_number: phoneNumber,
        device_id: deviceId
      });
      
      if (duplicates.length <= 1) {
        await this.rollback();
        return { merged: 0, message: 'No duplicates found' };
      }
      
      // Find the contact to keep
      const keepContact = duplicates.find(c => c.id === keepContactId) || duplicates[0];
      const toDelete = duplicates.filter(c => c.id !== keepContact.id);
      
      // Merge data from duplicates into keep contact
      const mergedData = this.mergeContactData(keepContact, toDelete);
      
      // Update the keep contact
      await this.update(keepContact.id, mergedData);
      
      // Delete duplicate contacts
      for (const duplicate of toDelete) {
        await this.delete(duplicate.id);
      }
      
      await this.commit();
      
      return {
        merged: toDelete.length,
        keepContactId: keepContact.id,
        deletedIds: toDelete.map(c => c.id)
      };
      
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Merge contact data from multiple contacts
   */
  mergeContactData(primary, duplicates) {
    const merged = { ...primary };
    
    for (const duplicate of duplicates) {
      // Merge name (prefer non-null, longer names)
      if (!merged.name || (duplicate.name && duplicate.name.length > merged.name.length)) {
        merged.name = duplicate.name;
      }
      
      // Merge status
      if (!merged.status && duplicate.status) {
        merged.status = duplicate.status;
      }
      
      // Merge profile picture
      if (!merged.profile_picture && duplicate.profile_picture) {
        merged.profile_picture = duplicate.profile_picture;
      }
      
      // Merge business info
      if (!merged.is_business && duplicate.is_business) {
        merged.is_business = duplicate.is_business;
        merged.business_info = duplicate.business_info;
      }
      
      // Use highest quality score
      if (duplicate.quality_score > merged.quality_score) {
        merged.quality_score = duplicate.quality_score;
      }
      
      // Merge metadata
      if (merged.metadata && duplicate.metadata) {
        merged.metadata = {
          ...merged.metadata,
          ...duplicate.metadata,
          sources: [
            ...(merged.metadata.sources || [merged.source]),
            ...(duplicate.metadata.sources || [duplicate.source])
          ].filter((v, i, a) => a.indexOf(v) === i)
        };
      }
    }
    
    merged.updated_at = new Date();
    return merged;
  }

  /**
   * Delete contacts by device
   */
  async deleteByDevice(deviceId) {
    const query = `DELETE FROM ${this.tableName} WHERE device_id = ?`;
    const [result] = await this.db.execute(query, [deviceId]);
    return result.affectedRows;
  }

  /**
   * Get contacts for campaign targeting
   */
  async getContactsForTargeting(deviceId, options = {}) {
    const {
      sources = [],
      minQualityScore = 0,
      maxQualityScore = 100,
      includeBusiness = true,
      excludeNumbers = [],
      limit = 1000,
      offset = 0
    } = options;
    
    let query = `
      SELECT 
        id,
        phone_number,
        name,
        source,
        quality_score,
        is_business,
        created_at
      FROM ${this.tableName}
      WHERE device_id = ?
      AND quality_score BETWEEN ? AND ?
    `;
    
    let params = [deviceId, minQualityScore, maxQualityScore];
    
    if (sources.length > 0) {
      const placeholders = sources.map(() => '?').join(',');
      query += ` AND source IN (${placeholders})`;
      params.push(...sources);
    }
    
    if (!includeBusiness) {
      query += ' AND is_business = 0';
    }
    
    if (excludeNumbers.length > 0) {
      const placeholders = excludeNumbers.map(() => '?').join(',');
      query += ` AND phone_number NOT IN (${placeholders})`;
      params.push(...excludeNumbers);
    }
    
    query += ' ORDER BY quality_score DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Export contacts data
   */
  async exportContacts(deviceId, format = 'json', options = {}) {
    const { source = null, minQualityScore = null } = options;
    
    let query = `
      SELECT 
        phone_number,
        name,
        source,
        quality_score,
        is_business,
        created_at,
        updated_at
      FROM ${this.tableName}
      WHERE device_id = ?
    `;
    
    let params = [deviceId];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    if (minQualityScore !== null) {
      query += ' AND quality_score >= ?';
      params.push(minQualityScore);
    }
    
    query += ' ORDER BY quality_score DESC, name ASC';
    
    const [rows] = await this.db.execute(query, params);
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(rows[0] || {});
      const csvRows = [headers.join(',')];
      
      for (const row of rows) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    }
    
    return rows;
  }

  /**
   * Get contact growth statistics
   */
  async getGrowthStats(deviceId, days = 30) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_contacts,
        COUNT(CASE WHEN source = 'private_chat' THEN 1 END) as private_chats,
        COUNT(CASE WHEN source = 'group_member' THEN 1 END) as group_members,
        COUNT(CASE WHEN source = 'contact_list' THEN 1 END) as contact_list,
        AVG(quality_score) as avg_quality
      FROM ${this.tableName}
      WHERE device_id = ?
      AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const [rows] = await this.db.execute(query, [deviceId, days]);
    return rows;
  }

  /**
   * Clean old contacts
   */
  async cleanOldContacts(deviceId, daysToKeep = 90, minQualityScore = 20) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE device_id = ?
      AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND quality_score < ?
    `;
    
    const [result] = await this.db.execute(query, [deviceId, daysToKeep, minQualityScore]);
    return result.affectedRows;
  }
}

module.exports = ContactRepository;