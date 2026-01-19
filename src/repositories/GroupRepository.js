const BaseRepository = require('./BaseRepository');

class GroupRepository extends BaseRepository {
  constructor() {
    super('groups');
  }

  /**
   * Find group by group ID and device
   */
  async findByGroupIdAndDevice(groupId, deviceId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE group_id = ? AND device_id = ?
      LIMIT 1
    `;
    
    const [rows] = await this.db.execute(query, [groupId, deviceId]);
    return rows[0] || null;
  }

  /**
   * Find groups by device ID
   */
  async findByDeviceId(deviceId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE device_id = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [deviceId, limit, offset]);
    return rows;
  }

  /**
   * Find groups by user ID
   */
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT g.*, d.name as device_name, d.phone_number
      FROM ${this.tableName} g
      JOIN devices d ON g.device_id = d.id
      WHERE d.user_id = ?
      ORDER BY g.${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [userId, limit, offset]);
    return rows;
  }

  /**
   * Search groups by name
   */
  async searchByName(searchTerm, deviceId = null, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE name LIKE ?
    `;
    
    let params = [`%${searchTerm}%`];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get group statistics
   */
  async getStatistics(deviceId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_groups,
        AVG(member_count) as avg_member_count,
        MAX(member_count) as max_member_count,
        MIN(member_count) as min_member_count,
        SUM(CASE WHEN is_admin = 1 THEN 1 ELSE 0 END) as admin_groups,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM ${this.tableName}
    `;
    
    let params = [];
    
    if (deviceId) {
      query += ' WHERE device_id = ?';
      params.push(deviceId);
    }
    
    const [rows] = await this.db.execute(query, params);
    return rows[0] || {
      total_groups: 0,
      avg_member_count: 0,
      max_member_count: 0,
      min_member_count: 0,
      admin_groups: 0,
      active_days: 0
    };
  }

  /**
   * Get groups by member count range
   */
  async findByMemberCountRange(minMembers, maxMembers, deviceId = null, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'member_count', orderDirection = 'DESC' } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE member_count BETWEEN ? AND ?
    `;
    
    let params = [minMembers, maxMembers];
    
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
   * Get admin groups only
   */
  async findAdminGroups(deviceId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE device_id = ? AND is_admin = 1
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [deviceId, limit, offset]);
    return rows;
  }

  /**
   * Get groups created in date range
   */
  async findByDateRange(startDate, endDate, deviceId = null, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE created_at BETWEEN ? AND ?
    `;
    
    let params = [startDate, endDate];
    
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
   * Update group member count
   */
  async updateMemberCount(groupId, deviceId, memberCount) {
    const query = `
      UPDATE ${this.tableName}
      SET member_count = ?, updated_at = NOW()
      WHERE group_id = ? AND device_id = ?
    `;
    
    const [result] = await this.db.execute(query, [memberCount, groupId, deviceId]);
    return result.affectedRows > 0;
  }

  /**
   * Update admin status
   */
  async updateAdminStatus(groupId, deviceId, isAdmin) {
    const query = `
      UPDATE ${this.tableName}
      SET is_admin = ?, updated_at = NOW()
      WHERE group_id = ? AND device_id = ?
    `;
    
    const [result] = await this.db.execute(query, [isAdmin ? 1 : 0, groupId, deviceId]);
    return result.affectedRows > 0;
  }

  /**
   * Get groups with most members
   */
  async getLargestGroups(deviceId = null, limit = 10) {
    let query = `
      SELECT * FROM ${this.tableName}
    `;
    
    let params = [];
    
    if (deviceId) {
      query += ' WHERE device_id = ?';
      params.push(deviceId);
    }
    
    query += ' ORDER BY member_count DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get recently created groups
   */
  async getRecentGroups(deviceId = null, days = 7, limit = 20) {
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
   * Get group activity summary
   */
  async getActivitySummary(deviceId, timeframe = '7d') {
    let timeCondition = '';
    
    switch (timeframe) {
      case '24h':
        timeCondition = 'AND updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        break;
      case '7d':
        timeCondition = 'AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        timeCondition = 'AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
    }
    
    const query = `
      SELECT 
        COUNT(*) as active_groups,
        SUM(member_count) as total_members,
        AVG(member_count) as avg_members,
        COUNT(CASE WHEN is_admin = 1 THEN 1 END) as admin_groups
      FROM ${this.tableName}
      WHERE device_id = ? ${timeCondition}
    `;
    
    const [rows] = await this.db.execute(query, [deviceId]);
    return rows[0] || {
      active_groups: 0,
      total_members: 0,
      avg_members: 0,
      admin_groups: 0
    };
  }

  /**
   * Bulk update groups
   */
  async bulkUpdateGroups(updates) {
    if (!updates || updates.length === 0) {
      return 0;
    }

    let affectedRows = 0;
    
    for (const update of updates) {
      try {
        const { group_id, device_id, ...updateData } = update;
        
        const result = await this.updateWhere(
          { group_id, device_id },
          { ...updateData, updated_at: new Date() }
        );
        
        affectedRows += result;
      } catch (error) {
        logger.error(`GroupRepository: Error updating group ${update.group_id}:`, error);
      }
    }
    
    return affectedRows;
  }

  /**
   * Delete groups by device
   */
  async deleteByDevice(deviceId) {
    const query = `DELETE FROM ${this.tableName} WHERE device_id = ?`;
    const [result] = await this.db.execute(query, [deviceId]);
    return result.affectedRows;
  }

  /**
   * Get groups for contact targeting
   */
  async getGroupsForTargeting(deviceId, options = {}) {
    const { 
      minMembers = 1, 
      maxMembers = 1000, 
      adminOnly = false,
      excludeGroupIds = [],
      limit = 50 
    } = options;
    
    let query = `
      SELECT 
        id,
        group_id,
        name,
        member_count,
        is_admin,
        created_at
      FROM ${this.tableName}
      WHERE device_id = ?
      AND member_count BETWEEN ? AND ?
    `;
    
    let params = [deviceId, minMembers, maxMembers];
    
    if (adminOnly) {
      query += ' AND is_admin = 1';
    }
    
    if (excludeGroupIds.length > 0) {
      const placeholders = excludeGroupIds.map(() => '?').join(',');
      query += ` AND group_id NOT IN (${placeholders})`;
      params.push(...excludeGroupIds);
    }
    
    query += ' ORDER BY member_count DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Export groups data
   */
  async exportGroups(deviceId, format = 'json') {
    const query = `
      SELECT 
        group_id,
        name,
        description,
        member_count,
        is_admin,
        created_at,
        updated_at
      FROM ${this.tableName}
      WHERE device_id = ?
      ORDER BY name ASC
    `;
    
    const [rows] = await this.db.execute(query, [deviceId]);
    
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
}

module.exports = GroupRepository;