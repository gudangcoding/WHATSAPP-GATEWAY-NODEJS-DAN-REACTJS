const BaseRepository = require('./BaseRepository');
const logger = require('../utils/logger');

class AutoReplyRepository extends BaseRepository {
  constructor() {
    super('auto_replies');
  }

  /**
   * Create new auto reply rule
   */
  async create(autoReplyData) {
    try {
      const result = await this.db.query(
        `INSERT INTO auto_replies (
          device_id, user_id, name, match_type, keywords, reply_type, reply_text, 
          reply_media_url, reply_media_type, is_active, priority, cooldown_minutes, 
          max_daily_replies, is_group_enabled, time_start, time_end, delay_seconds, 
          conditions, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          autoReplyData.device_id,
          autoReplyData.user_id,
          autoReplyData.name,
          autoReplyData.match_type,
          autoReplyData.keywords,
          autoReplyData.reply_type,
          autoReplyData.reply_text || null,
          autoReplyData.reply_media_url || null,
          autoReplyData.reply_media_type || null,
          autoReplyData.is_active !== undefined ? autoReplyData.is_active : true,
          autoReplyData.priority || 1,
          autoReplyData.cooldown_minutes || 0,
          autoReplyData.max_daily_replies || 0,
          autoReplyData.is_group_enabled !== undefined ? autoReplyData.is_group_enabled : false,
          autoReplyData.time_start || null,
          autoReplyData.time_end || null,
          autoReplyData.delay_seconds || 0,
          JSON.stringify(autoReplyData.conditions || {}),
          JSON.stringify(autoReplyData.metadata || {})
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('AutoReplyRepository: Error creating auto reply:', error);
      throw error;
    }
  }

  /**
   * Update auto reply rule
   */
  async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'conditions' || key === 'metadata') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        return false;
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      const result = await this.db.query(
        `UPDATE auto_replies SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('AutoReplyRepository: Error updating auto reply:', error);
      throw error;
    }
  }

  /**
   * Find auto reply by ID
   */
  async findById(id) {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM auto_replies WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const autoReply = rows[0];
      
      // Parse JSON fields
      if (autoReply.conditions) {
        try {
          autoReply.conditions = JSON.parse(autoReply.conditions);
        } catch (e) {
          autoReply.conditions = {};
        }
      }

      if (autoReply.metadata) {
        try {
          autoReply.metadata = JSON.parse(autoReply.metadata);
        } catch (e) {
          autoReply.metadata = {};
        }
      }

      return autoReply;
    } catch (error) {
      logger.error('AutoReplyRepository: Error finding auto reply by ID:', error);
      throw error;
    }
  }

  /**
   * Find auto replies by device ID
   */
  async findByDeviceId(deviceId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'priority',
        orderDirection = 'ASC',
        isActive = null
      } = options;

      let query = 'SELECT * FROM auto_replies WHERE device_id = ?';
      const values = [deviceId];

      if (isActive !== null) {
        query += ' AND is_active = ?';
        values.push(isActive);
      }

      query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(autoReply => {
        // Parse JSON fields
        if (autoReply.conditions) {
          try {
            autoReply.conditions = JSON.parse(autoReply.conditions);
          } catch (e) {
            autoReply.conditions = {};
          }
        }

        if (autoReply.metadata) {
          try {
            autoReply.metadata = JSON.parse(autoReply.metadata);
          } catch (e) {
            autoReply.metadata = {};
          }
        }

        return autoReply;
      });
    } catch (error) {
      logger.error('AutoReplyRepository: Error finding auto replies by device ID:', error);
      throw error;
    }
  }

  /**
   * Get active auto replies for device (ordered by priority)
   */
  async getActiveByDeviceId(deviceId) {
    try {
      const [rows] = await this.db.query(`
        SELECT * FROM auto_replies 
        WHERE device_id = ? AND is_active = 1 
        ORDER BY priority ASC, created_at ASC
      `, [deviceId]);

      return rows.map(autoReply => {
        // Parse JSON fields
        if (autoReply.conditions) {
          try {
            autoReply.conditions = JSON.parse(autoReply.conditions);
          } catch (e) {
            autoReply.conditions = {};
          }
        }

        if (autoReply.metadata) {
          try {
            autoReply.metadata = JSON.parse(autoReply.metadata);
          } catch (e) {
            autoReply.metadata = {};
          }
        }

        return autoReply;
      });
    } catch (error) {
      logger.error('AutoReplyRepository: Error getting active auto replies:', error);
      throw error;
    }
  }

  /**
   * Find auto replies by user ID
   */
  async findByUserId(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        deviceId = null,
        isActive = null
      } = options;

      let query = 'SELECT ar.*, d.name as device_name FROM auto_replies ar LEFT JOIN devices d ON ar.device_id = d.id WHERE ar.user_id = ?';
      const values = [userId];

      if (deviceId) {
        query += ' AND ar.device_id = ?';
        values.push(deviceId);
      }

      if (isActive !== null) {
        query += ' AND ar.is_active = ?';
        values.push(isActive);
      }

      query += ` ORDER BY ar.${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(autoReply => {
        // Parse JSON fields
        if (autoReply.conditions) {
          try {
            autoReply.conditions = JSON.parse(autoReply.conditions);
          } catch (e) {
            autoReply.conditions = {};
          }
        }

        if (autoReply.metadata) {
          try {
            autoReply.metadata = JSON.parse(autoReply.metadata);
          } catch (e) {
            autoReply.metadata = {};
          }
        }

        return autoReply;
      });
    } catch (error) {
      logger.error('AutoReplyRepository: Error finding auto replies by user ID:', error);
      throw error;
    }
  }

  /**
   * Count auto replies
   */
  async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM auto_replies WHERE 1=1';
      const values = [];

      if (filters.device_id) {
        query += ' AND device_id = ?';
        values.push(filters.device_id);
      }

      if (filters.user_id) {
        query += ' AND user_id = ?';
        values.push(filters.user_id);
      }

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        values.push(filters.is_active);
      }

      const [rows] = await this.db.query(query, values);
      return rows[0].total;
    } catch (error) {
      logger.error('AutoReplyRepository: Error counting auto replies:', error);
      throw error;
    }
  }

  /**
   * Delete auto reply
   */
  async delete(id) {
    try {
      const result = await this.db.query(
        'DELETE FROM auto_replies WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('AutoReplyRepository: Error deleting auto reply:', error);
      throw error;
    }
  }

  /**
   * Toggle auto reply status
   */
  async toggleStatus(id) {
    try {
      const result = await this.db.query(
        'UPDATE auto_replies SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('AutoReplyRepository: Error toggling auto reply status:', error);
      throw error;
    }
  }

  /**
   * Update priority
   */
  async updatePriority(id, priority) {
    try {
      const result = await this.db.query(
        'UPDATE auto_replies SET priority = ?, updated_at = NOW() WHERE id = ?',
        [priority, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('AutoReplyRepository: Error updating priority:', error);
      throw error;
    }
  }

  /**
   * Get auto reply statistics
   */
  async getStatistics(deviceId = null, timeframe = '24h') {
    try {
      let timeCondition = '';
      let params = [];
      
      switch (timeframe) {
        case '1h':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
          break;
        case '24h':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
          break;
        case '7d':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        default:
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
      }

      let deviceCondition = '';
      if (deviceId) {
        deviceCondition = 'AND ar.device_id = ?';
        params.push(deviceId);
      }

      // Overall statistics
      const [overallStats] = await this.db.query(`
        SELECT 
          COUNT(DISTINCT ar.id) as total_rules,
          COUNT(DISTINCT CASE WHEN ar.is_active = 1 THEN ar.id END) as active_rules,
          COUNT(DISTINCT CASE WHEN ar.is_active = 0 THEN ar.id END) as inactive_rules,
          COALESCE(SUM(arl_stats.total_executions), 0) as total_executions,
          COALESCE(SUM(arl_stats.successful_replies), 0) as successful_replies,
          COALESCE(SUM(arl_stats.failed_replies), 0) as failed_replies
        FROM auto_replies ar
        LEFT JOIN (
          SELECT 
            auto_reply_id,
            COUNT(*) as total_executions,
            SUM(CASE WHEN reply_sent = 1 THEN 1 ELSE 0 END) as successful_replies,
            SUM(CASE WHEN reply_sent = 0 THEN 1 ELSE 0 END) as failed_replies
          FROM auto_reply_logs arl
          WHERE 1=1 ${timeCondition}
          GROUP BY auto_reply_id
        ) arl_stats ON ar.id = arl_stats.auto_reply_id
        WHERE 1=1 ${deviceCondition}
      `, params);

      // Rule type breakdown
      const [typeStats] = await this.db.query(`
        SELECT 
          match_type,
          COUNT(*) as count,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count
        FROM auto_replies ar
        WHERE 1=1 ${deviceCondition}
        GROUP BY match_type
        ORDER BY count DESC
      `, params);

      // Reply type breakdown
      const [replyTypeStats] = await this.db.query(`
        SELECT 
          reply_type,
          COUNT(*) as count,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count
        FROM auto_replies ar
        WHERE 1=1 ${deviceCondition}
        GROUP BY reply_type
        ORDER BY count DESC
      `, params);

      return {
        overall: overallStats[0],
        by_match_type: typeStats,
        by_reply_type: replyTypeStats,
        timeframe: timeframe
      };
    } catch (error) {
      logger.error('AutoReplyRepository: Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get most triggered rules
   */
  async getMostTriggeredRules(deviceId = null, limit = 10, timeframe = '7d') {
    try {
      let timeCondition = '';
      let params = [];
      
      switch (timeframe) {
        case '24h':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
          break;
        case '7d':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          timeCondition = 'AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
      }

      let deviceCondition = '';
      if (deviceId) {
        deviceCondition = 'AND ar.device_id = ?';
        params.push(deviceId);
      }

      params.push(limit);

      const [rows] = await this.db.query(`
        SELECT 
          ar.id,
          ar.name,
          ar.keywords,
          ar.match_type,
          ar.reply_type,
          ar.is_active,
          COUNT(arl.id) as trigger_count,
          SUM(CASE WHEN arl.reply_sent = 1 THEN 1 ELSE 0 END) as successful_count,
          SUM(CASE WHEN arl.reply_sent = 0 THEN 1 ELSE 0 END) as failed_count,
          MAX(arl.executed_at) as last_triggered
        FROM auto_replies ar
        LEFT JOIN auto_reply_logs arl ON ar.id = arl.auto_reply_id ${timeCondition}
        WHERE 1=1 ${deviceCondition}
        GROUP BY ar.id, ar.name, ar.keywords, ar.match_type, ar.reply_type, ar.is_active
        HAVING trigger_count > 0
        ORDER BY trigger_count DESC
        LIMIT ?
      `, params);

      return rows;
    } catch (error) {
      logger.error('AutoReplyRepository: Error getting most triggered rules:', error);
      throw error;
    }
  }

  /**
   * Search auto replies
   */
  async search(searchTerm, deviceId = null, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        isActive = null
      } = options;

      let query = `
        SELECT ar.*, d.name as device_name 
        FROM auto_replies ar 
        LEFT JOIN devices d ON ar.device_id = d.id 
        WHERE (ar.name LIKE ? OR ar.keywords LIKE ? OR ar.reply_text LIKE ?)
      `;
      
      const values = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

      if (deviceId) {
        query += ' AND ar.device_id = ?';
        values.push(deviceId);
      }

      if (isActive !== null) {
        query += ' AND ar.is_active = ?';
        values.push(isActive);
      }

      query += ' ORDER BY ar.priority ASC, ar.created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(autoReply => {
        // Parse JSON fields
        if (autoReply.conditions) {
          try {
            autoReply.conditions = JSON.parse(autoReply.conditions);
          } catch (e) {
            autoReply.conditions = {};
          }
        }

        if (autoReply.metadata) {
          try {
            autoReply.metadata = JSON.parse(autoReply.metadata);
          } catch (e) {
            autoReply.metadata = {};
          }
        }

        return autoReply;
      });
    } catch (error) {
      logger.error('AutoReplyRepository: Error searching auto replies:', error);
      throw error;
    }
  }

  /**
   * Bulk update priorities
   */
  async bulkUpdatePriorities(priorityUpdates) {
    try {
      const promises = priorityUpdates.map(({ id, priority }) => 
        this.updatePriority(id, priority)
      );

      const results = await Promise.all(promises);
      return results.every(result => result === true);
    } catch (error) {
      logger.error('AutoReplyRepository: Error bulk updating priorities:', error);
      throw error;
    }
  }

  /**
   * Duplicate auto reply rule
   */
  async duplicate(id, newName = null) {
    try {
      const original = await this.findById(id);
      if (!original) {
        throw new Error('Auto reply rule not found');
      }

      // Create duplicate with modified name
      const duplicateData = {
        ...original,
        name: newName || `${original.name} (Copy)`,
        is_active: false // Start as inactive
      };

      // Remove fields that shouldn't be copied
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      return await this.create(duplicateData);
    } catch (error) {
      logger.error('AutoReplyRepository: Error duplicating auto reply:', error);
      throw error;
    }
  }

  /**
   * Get auto reply performance metrics
   */
  async getPerformanceMetrics(deviceId = null, days = 30) {
    try {
      let deviceCondition = '';
      let params = [days];

      if (deviceId) {
        deviceCondition = 'AND ar.device_id = ?';
        params.push(deviceId);
      }

      const [rows] = await this.db.query(`
        SELECT 
          ar.id,
          ar.name,
          ar.match_type,
          ar.reply_type,
          ar.is_active,
          COUNT(arl.id) as total_triggers,
          SUM(CASE WHEN arl.reply_sent = 1 THEN 1 ELSE 0 END) as successful_replies,
          SUM(CASE WHEN arl.reply_sent = 0 THEN 1 ELSE 0 END) as failed_replies,
          ROUND(
            (SUM(CASE WHEN arl.reply_sent = 1 THEN 1 ELSE 0 END) / COUNT(arl.id)) * 100, 2
          ) as success_rate,
          MIN(arl.executed_at) as first_trigger,
          MAX(arl.executed_at) as last_trigger,
          COUNT(DISTINCT arl.from_number) as unique_senders
        FROM auto_replies ar
        LEFT JOIN auto_reply_logs arl ON ar.id = arl.auto_reply_id 
          AND arl.executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE 1=1 ${deviceCondition}
        GROUP BY ar.id, ar.name, ar.match_type, ar.reply_type, ar.is_active
        ORDER BY total_triggers DESC
      `, params);

      return rows;
    } catch (error) {
      logger.error('AutoReplyRepository: Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive rules
   */
  async cleanupInactiveRules(daysInactive = 30) {
    try {
      const result = await this.db.query(`
        DELETE FROM auto_replies 
        WHERE is_active = 0 
        AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND id NOT IN (
          SELECT DISTINCT auto_reply_id 
          FROM auto_reply_logs 
          WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        )
      `, [daysInactive, daysInactive]);

      return result.affectedRows;
    } catch (error) {
      logger.error('AutoReplyRepository: Error cleaning up inactive rules:', error);
      throw error;
    }
  }
}

module.exports = AutoReplyRepository;