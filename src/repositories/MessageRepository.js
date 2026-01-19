const BaseRepository = require('./BaseRepository');
const logger = require('../utils/logger');

class MessageRepository extends BaseRepository {
  constructor() {
    super('messages');
  }

  /**
   * Create new message
   */
  async create(messageData) {
    try {
      const result = await this.db.query(
        `INSERT INTO messages (
          device_id, user_id, message_id, to_number, from_number, type, content, 
          direction, is_group, group_id, status, priority, scheduled_at, 
          metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          messageData.device_id,
          messageData.user_id,
          messageData.message_id || null,
          messageData.to_number,
          messageData.from_number || null,
          messageData.type,
          messageData.content,
          messageData.direction,
          messageData.is_group || false,
          messageData.group_id || null,
          messageData.status || 'pending',
          messageData.priority || 0,
          messageData.scheduled_at || null,
          JSON.stringify(messageData.metadata || {}),
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('MessageRepository: Error creating message:', error);
      throw error;
    }
  }

  /**
   * Update message by ID
   */
  async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'metadata') {
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
        `UPDATE messages SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('MessageRepository: Error updating message:', error);
      throw error;
    }
  }

  /**
   * Update message by Baileys message ID
   */
  async updateByMessageId(messageId, updateData) {
    try {
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'metadata') {
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
      values.push(messageId);

      const result = await this.db.query(
        `UPDATE messages SET ${fields.join(', ')} WHERE message_id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('MessageRepository: Error updating message by message_id:', error);
      throw error;
    }
  }

  /**
   * Find message by ID
   */
  async findById(id) {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM messages WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const message = rows[0];
      
      // Parse JSON fields
      if (message.metadata) {
        try {
          message.metadata = JSON.parse(message.metadata);
        } catch (e) {
          message.metadata = {};
        }
      }

      return message;
    } catch (error) {
      logger.error('MessageRepository: Error finding message by ID:', error);
      throw error;
    }
  }

  /**
   * Find message by Baileys message ID
   */
  async findByMessageId(messageId) {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM messages WHERE message_id = ?',
        [messageId]
      );

      if (rows.length === 0) {
        return null;
      }

      const message = rows[0];
      
      if (message.metadata) {
        try {
          message.metadata = JSON.parse(message.metadata);
        } catch (e) {
          message.metadata = {};
        }
      }

      return message;
    } catch (error) {
      logger.error('MessageRepository: Error finding message by message_id:', error);
      throw error;
    }
  }

  /**
   * Find messages with filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      let query = 'SELECT * FROM messages WHERE 1=1';
      const values = [];

      // Apply filters
      if (filters.device_id) {
        query += ' AND device_id = ?';
        values.push(filters.device_id);
      }

      if (filters.user_id) {
        query += ' AND user_id = ?';
        values.push(filters.user_id);
      }

      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }

      if (filters.type) {
        query += ' AND type = ?';
        values.push(filters.type);
      }

      if (filters.direction) {
        query += ' AND direction = ?';
        values.push(filters.direction);
      }

      if (filters.is_group !== undefined) {
        query += ' AND is_group = ?';
        values.push(filters.is_group);
      }

      if (filters.to_number) {
        query += ' AND to_number = ?';
        values.push(filters.to_number);
      }

      if (filters.from_number) {
        query += ' AND from_number = ?';
        values.push(filters.from_number);
      }

      if (filters.start_date) {
        query += ' AND created_at >= ?';
        values.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND created_at <= ?';
        values.push(filters.end_date);
      }

      // Add ordering and pagination
      query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      // Parse JSON fields
      return rows.map(message => {
        if (message.metadata) {
          try {
            message.metadata = JSON.parse(message.metadata);
          } catch (e) {
            message.metadata = {};
          }
        }
        return message;
      });
    } catch (error) {
      logger.error('MessageRepository: Error finding messages:', error);
      throw error;
    }
  }

  /**
   * Search messages by content or phone number
   */
  async search(searchTerm, deviceId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null,
        type = null,
        direction = null
      } = options;

      let query = `
        SELECT * FROM messages 
        WHERE device_id = ? 
        AND (
          content LIKE ? 
          OR to_number LIKE ? 
          OR from_number LIKE ?
        )
      `;
      
      const values = [
        deviceId,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`
      ];

      // Apply additional filters
      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      if (type) {
        query += ' AND type = ?';
        values.push(type);
      }

      if (direction) {
        query += ' AND direction = ?';
        values.push(direction);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(message => {
        if (message.metadata) {
          try {
            message.metadata = JSON.parse(message.metadata);
          } catch (e) {
            message.metadata = {};
          }
        }
        return message;
      });
    } catch (error) {
      logger.error('MessageRepository: Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Count messages with filters
   */
  async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM messages WHERE 1=1';
      const values = [];

      // Apply same filters as findAll
      if (filters.device_id) {
        query += ' AND device_id = ?';
        values.push(filters.device_id);
      }

      if (filters.user_id) {
        query += ' AND user_id = ?';
        values.push(filters.user_id);
      }

      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }

      if (filters.type) {
        query += ' AND type = ?';
        values.push(filters.type);
      }

      if (filters.direction) {
        query += ' AND direction = ?';
        values.push(filters.direction);
      }

      if (filters.is_group !== undefined) {
        query += ' AND is_group = ?';
        values.push(filters.is_group);
      }

      if (filters.start_date) {
        query += ' AND created_at >= ?';
        values.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND created_at <= ?';
        values.push(filters.end_date);
      }

      const [rows] = await this.db.query(query, values);
      return rows[0].total;
    } catch (error) {
      logger.error('MessageRepository: Error counting messages:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getStatistics(deviceId, timeframe = '24h') {
    try {
      let timeCondition = '';
      
      switch (timeframe) {
        case '1h':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
          break;
        case '24h':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
          break;
        case '7d':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        default:
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
      }

      // Overall statistics
      const [overallStats] = await this.db.query(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as sent_messages,
          COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as received_messages,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_sent,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read_messages,
          COUNT(CASE WHEN is_group = 1 THEN 1 END) as group_messages,
          COUNT(CASE WHEN is_group = 0 THEN 1 END) as private_messages
        FROM messages 
        WHERE device_id = ? ${timeCondition}
      `, [deviceId]);

      // Message types breakdown
      const [typeStats] = await this.db.query(`
        SELECT 
          type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
        FROM messages 
        WHERE device_id = ? ${timeCondition}
        GROUP BY type
        ORDER BY count DESC
      `, [deviceId]);

      // Hourly distribution (last 24 hours)
      const [hourlyStats] = await this.db.query(`
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as count
        FROM messages 
        WHERE device_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(created_at)
        ORDER BY hour
      `, [deviceId]);

      return {
        overall: overallStats[0],
        by_type: typeStats,
        hourly_distribution: hourlyStats,
        timeframe: timeframe
      };
    } catch (error) {
      logger.error('MessageRepository: Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(deviceId, limit = 10) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          id, to_number, from_number, type, status, direction, 
          is_group, created_at, sent_at, delivered_at, read_at
        FROM messages 
        WHERE device_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [deviceId, limit]);

      return rows;
    } catch (error) {
      logger.error('MessageRepository: Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Get top recipients
   */
  async getTopRecipients(deviceId, timeframe = '24h', limit = 10) {
    try {
      let timeCondition = '';
      
      switch (timeframe) {
        case '24h':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
          break;
        case '7d':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
      }

      const [rows] = await this.db.query(`
        SELECT 
          to_number,
          COUNT(*) as message_count,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
          MAX(created_at) as last_message_at
        FROM messages 
        WHERE device_id = ? 
        AND direction = 'outgoing'
        ${timeCondition}
        GROUP BY to_number
        ORDER BY message_count DESC
        LIMIT ?
      `, [deviceId, limit]);

      return rows;
    } catch (error) {
      logger.error('MessageRepository: Error getting top recipients:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversation(deviceId, phoneNumber, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      const [rows] = await this.db.query(`
        SELECT * FROM messages 
        WHERE device_id = ? 
        AND (
          (direction = 'outgoing' AND to_number = ?) 
          OR (direction = 'incoming' AND from_number = ?)
        )
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT ? OFFSET ?
      `, [deviceId, phoneNumber, phoneNumber, limit, offset]);

      return rows.map(message => {
        if (message.metadata) {
          try {
            message.metadata = JSON.parse(message.metadata);
          } catch (e) {
            message.metadata = {};
          }
        }
        return message;
      });
    } catch (error) {
      logger.error('MessageRepository: Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Delete message
   */
  async delete(id) {
    try {
      const result = await this.db.query(
        'DELETE FROM messages WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('MessageRepository: Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Delete messages by device
   */
  async deleteByDevice(deviceId) {
    try {
      const result = await this.db.query(
        'DELETE FROM messages WHERE device_id = ?',
        [deviceId]
      );

      return result.affectedRows;
    } catch (error) {
      logger.error('MessageRepository: Error deleting messages by device:', error);
      throw error;
    }
  }

  /**
   * Get scheduled messages
   */
  async getScheduledMessages(deviceId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0
      } = options;

      const [rows] = await this.db.query(`
        SELECT * FROM messages 
        WHERE device_id = ? 
        AND status = 'scheduled'
        AND scheduled_at > NOW()
        ORDER BY scheduled_at ASC
        LIMIT ? OFFSET ?
      `, [deviceId, limit, offset]);

      return rows.map(message => {
        if (message.metadata) {
          try {
            message.metadata = JSON.parse(message.metadata);
          } catch (e) {
            message.metadata = {};
          }
        }
        return message;
      });
    } catch (error) {
      logger.error('MessageRepository: Error getting scheduled messages:', error);
      throw error;
    }
  }

  /**
   * Get failed messages
   */
  async getFailedMessages(deviceId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0
      } = options;

      const [rows] = await this.db.query(`
        SELECT * FROM messages 
        WHERE device_id = ? 
        AND status = 'failed'
        ORDER BY failed_at DESC
        LIMIT ? OFFSET ?
      `, [deviceId, limit, offset]);

      return rows.map(message => {
        if (message.metadata) {
          try {
            message.metadata = JSON.parse(message.metadata);
          } catch (e) {
            message.metadata = {};
          }
        }
        return message;
      });
    } catch (error) {
      logger.error('MessageRepository: Error getting failed messages:', error);
      throw error;
    }
  }

  /**
   * Bulk create messages
   */
  async bulkCreate(messages) {
    try {
      if (!messages || messages.length === 0) {
        return [];
      }

      const values = [];
      const placeholders = [];

      for (const messageData of messages) {
        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        values.push(
          messageData.device_id,
          messageData.user_id,
          messageData.message_id || null,
          messageData.to_number,
          messageData.from_number || null,
          messageData.type,
          messageData.content,
          messageData.direction,
          messageData.is_group || false,
          messageData.group_id || null,
          messageData.status || 'pending',
          messageData.priority || 0,
          messageData.scheduled_at || null,
          JSON.stringify(messageData.metadata || {})
        );
      }

      const result = await this.db.query(`
        INSERT INTO messages (
          device_id, user_id, message_id, to_number, from_number, type, content, 
          direction, is_group, group_id, status, priority, scheduled_at, 
          metadata, created_at
        ) VALUES ${placeholders.join(', ')}
      `, values);

      // Return created message IDs
      const insertId = result.insertId;
      const createdIds = [];
      for (let i = 0; i < messages.length; i++) {
        createdIds.push(insertId + i);
      }

      return createdIds;
    } catch (error) {
      logger.error('MessageRepository: Error bulk creating messages:', error);
      throw error;
    }
  }

  /**
   * Update message status by job ID
   */
  async updateByJobId(jobId, updateData) {
    try {
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'metadata') {
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
      values.push(jobId);

      const result = await this.db.query(
        `UPDATE messages SET ${fields.join(', ')} WHERE JSON_EXTRACT(metadata, '$.job_id') = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('MessageRepository: Error updating message by job ID:', error);
      throw error;
    }
  }
}

module.exports = MessageRepository;