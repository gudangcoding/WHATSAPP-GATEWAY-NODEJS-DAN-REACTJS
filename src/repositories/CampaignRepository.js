const BaseRepository = require('./BaseRepository');
const logger = require('../utils/logger');

class CampaignRepository extends BaseRepository {
  constructor() {
    super('campaigns');
  }

  /**
   * Create new campaign
   */
  async create(campaignData) {
    try {
      const result = await this.db.query(
        `INSERT INTO campaigns (
          device_id, user_id, name, description, message_type, message_content, 
          media_url, media_type, target_type, target_filters, schedule_type, 
          scheduled_at, recurring_pattern, delay_min, delay_max, randomize_delay, 
          ai_variation, status, total_targets, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          campaignData.device_id,
          campaignData.user_id,
          campaignData.name,
          campaignData.description || null,
          campaignData.message_type,
          JSON.stringify(campaignData.message_content),
          campaignData.media_url || null,
          campaignData.media_type || null,
          campaignData.target_type,
          JSON.stringify(campaignData.target_filters || {}),
          campaignData.schedule_type || 'immediate',
          campaignData.scheduled_at || null,
          JSON.stringify(campaignData.recurring_pattern || {}),
          campaignData.delay_min || 1,
          campaignData.delay_max || 5,
          campaignData.randomize_delay !== undefined ? campaignData.randomize_delay : true,
          campaignData.ai_variation !== undefined ? campaignData.ai_variation : false,
          campaignData.status || 'draft',
          campaignData.total_targets || 0,
          JSON.stringify(campaignData.metadata || {})
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('CampaignRepository: Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (['message_content', 'target_filters', 'recurring_pattern', 'metadata'].includes(key)) {
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
        `UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('CampaignRepository: Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Find campaign by ID
   */
  async findById(id) {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM campaigns WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const campaign = rows[0];
      
      // Parse JSON fields
      if (campaign.message_content) {
        try {
          campaign.message_content = JSON.parse(campaign.message_content);
        } catch (e) {
          campaign.message_content = {};
        }
      }

      if (campaign.target_filters) {
        try {
          campaign.target_filters = JSON.parse(campaign.target_filters);
        } catch (e) {
          campaign.target_filters = {};
        }
      }

      if (campaign.recurring_pattern) {
        try {
          campaign.recurring_pattern = JSON.parse(campaign.recurring_pattern);
        } catch (e) {
          campaign.recurring_pattern = {};
        }
      }

      if (campaign.metadata) {
        try {
          campaign.metadata = JSON.parse(campaign.metadata);
        } catch (e) {
          campaign.metadata = {};
        }
      }

      return campaign;
    } catch (error) {
      logger.error('CampaignRepository: Error finding campaign by ID:', error);
      throw error;
    }
  }

  /**
   * Find campaigns by user ID
   */
  async findByUserId(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        deviceId = null,
        status = null
      } = options;

      let query = `
        SELECT c.*, d.name as device_name 
        FROM campaigns c 
        LEFT JOIN devices d ON c.device_id = d.id 
        WHERE c.user_id = ?
      `;
      const values = [userId];

      if (deviceId) {
        query += ' AND c.device_id = ?';
        values.push(deviceId);
      }

      if (status) {
        query += ' AND c.status = ?';
        values.push(status);
      }

      query += ` ORDER BY c.${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(campaign => {
        // Parse JSON fields
        if (campaign.message_content) {
          try {
            campaign.message_content = JSON.parse(campaign.message_content);
          } catch (e) {
            campaign.message_content = {};
          }
        }

        if (campaign.target_filters) {
          try {
            campaign.target_filters = JSON.parse(campaign.target_filters);
          } catch (e) {
            campaign.target_filters = {};
          }
        }

        if (campaign.recurring_pattern) {
          try {
            campaign.recurring_pattern = JSON.parse(campaign.recurring_pattern);
          } catch (e) {
            campaign.recurring_pattern = {};
          }
        }

        if (campaign.metadata) {
          try {
            campaign.metadata = JSON.parse(campaign.metadata);
          } catch (e) {
            campaign.metadata = {};
          }
        }

        return campaign;
      });
    } catch (error) {
      logger.error('CampaignRepository: Error finding campaigns by user ID:', error);
      throw error;
    }
  }

  /**
   * Find campaigns by device ID
   */
  async findByDeviceId(deviceId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        status = null
      } = options;

      let query = 'SELECT * FROM campaigns WHERE device_id = ?';
      const values = [deviceId];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(campaign => {
        // Parse JSON fields
        if (campaign.message_content) {
          try {
            campaign.message_content = JSON.parse(campaign.message_content);
          } catch (e) {
            campaign.message_content = {};
          }
        }

        if (campaign.target_filters) {
          try {
            campaign.target_filters = JSON.parse(campaign.target_filters);
          } catch (e) {
            campaign.target_filters = {};
          }
        }

        if (campaign.recurring_pattern) {
          try {
            campaign.recurring_pattern = JSON.parse(campaign.recurring_pattern);
          } catch (e) {
            campaign.recurring_pattern = {};
          }
        }

        if (campaign.metadata) {
          try {
            campaign.metadata = JSON.parse(campaign.metadata);
          } catch (e) {
            campaign.metadata = {};
          }
        }

        return campaign;
      });
    } catch (error) {
      logger.error('CampaignRepository: Error finding campaigns by device ID:', error);
      throw error;
    }
  }

  /**
   * Count campaigns
   */
  async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM campaigns WHERE 1=1';
      const values = [];

      if (filters.user_id) {
        query += ' AND user_id = ?';
        values.push(filters.user_id);
      }

      if (filters.device_id) {
        query += ' AND device_id = ?';
        values.push(filters.device_id);
      }

      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }

      if (filters.schedule_type) {
        query += ' AND schedule_type = ?';
        values.push(filters.schedule_type);
      }

      const [rows] = await this.db.query(query, values);
      return rows[0].total;
    } catch (error) {
      logger.error('CampaignRepository: Error counting campaigns:', error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async delete(id) {
    try {
      const result = await this.db.query(
        'DELETE FROM campaigns WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('CampaignRepository: Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign status
   */
  async updateStatus(id, status, additionalData = {}) {
    try {
      const updateData = {
        status: status,
        ...additionalData
      };

      // Add timestamp fields based on status
      if (status === 'running') updateData.started_at = new Date();
      if (status === 'completed') updateData.completed_at = new Date();
      if (status === 'cancelled') updateData.cancelled_at = new Date();
      if (status === 'failed') updateData.failed_at = new Date();

      return await this.update(id, updateData);
    } catch (error) {
      logger.error('CampaignRepository: Error updating campaign status:', error);
      throw error;
    }
  }

  /**
   * Update campaign progress
   */
  async updateProgress(id, progressData) {
    try {
      const updateData = {};

      if (progressData.sent_count !== undefined) {
        updateData.sent_count = progressData.sent_count;
      }

      if (progressData.delivered_count !== undefined) {
        updateData.delivered_count = progressData.delivered_count;
      }

      if (progressData.failed_count !== undefined) {
        updateData.failed_count = progressData.failed_count;
      }

      if (progressData.read_count !== undefined) {
        updateData.read_count = progressData.read_count;
      }

      return await this.update(id, updateData);
    } catch (error) {
      logger.error('CampaignRepository: Error updating campaign progress:', error);
      throw error;
    }
  }

  /**
   * Get scheduled campaigns
   */
  async getScheduledCampaigns(limit = 100) {
    try {
      const [rows] = await this.db.query(`
        SELECT * FROM campaigns 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT ?
      `, [limit]);

      return rows.map(campaign => {
        // Parse JSON fields
        if (campaign.message_content) {
          try {
            campaign.message_content = JSON.parse(campaign.message_content);
          } catch (e) {
            campaign.message_content = {};
          }
        }

        if (campaign.target_filters) {
          try {
            campaign.target_filters = JSON.parse(campaign.target_filters);
          } catch (e) {
            campaign.target_filters = {};
          }
        }

        if (campaign.recurring_pattern) {
          try {
            campaign.recurring_pattern = JSON.parse(campaign.recurring_pattern);
          } catch (e) {
            campaign.recurring_pattern = {};
          }
        }

        if (campaign.metadata) {
          try {
            campaign.metadata = JSON.parse(campaign.metadata);
          } catch (e) {
            campaign.metadata = {};
          }
        }

        return campaign;
      });
    } catch (error) {
      logger.error('CampaignRepository: Error getting scheduled campaigns:', error);
      throw error;
    }
  }

  /**
   * Get running campaigns
   */
  async getRunningCampaigns(deviceId = null) {
    try {
      let query = "SELECT * FROM campaigns WHERE status = 'running'";
      const values = [];

      if (deviceId) {
        query += ' AND device_id = ?';
        values.push(deviceId);
      }

      query += ' ORDER BY started_at ASC';

      const [rows] = await this.db.query(query, values);

      return rows.map(campaign => {
        // Parse JSON fields
        if (campaign.message_content) {
          try {
            campaign.message_content = JSON.parse(campaign.message_content);
          } catch (e) {
            campaign.message_content = {};
          }
        }

        if (campaign.target_filters) {
          try {
            campaign.target_filters = JSON.parse(campaign.target_filters);
          } catch (e) {
            campaign.target_filters = {};
          }
        }

        if (campaign.recurring_pattern) {
          try {
            campaign.recurring_pattern = JSON.parse(campaign.recurring_pattern);
          } catch (e) {
            campaign.recurring_pattern = {};
          }
        }

        if (campaign.metadata) {
          try {
            campaign.metadata = JSON.parse(campaign.metadata);
          } catch (e) {
            campaign.metadata = {};
          }
        }

        return campaign;
      });
    } catch (error) {
      logger.error('CampaignRepository: Error getting running campaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getStatistics(deviceId = null, timeframe = '30d') {
    try {
      let timeCondition = '';
      let params = [];
      
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
        case '90d':
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
          break;
        default:
          timeCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      }

      let deviceCondition = '';
      if (deviceId) {
        deviceCondition = 'AND device_id = ?';
        params.push(deviceId);
      }

      // Overall statistics
      const [overallStats] = await this.db.query(`
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns,
          COUNT(CASE WHEN status = 'running' THEN 1 END) as running_campaigns,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_campaigns,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_campaigns,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_campaigns,
          SUM(total_targets) as total_targets,
          SUM(sent_count) as total_sent,
          SUM(delivered_count) as total_delivered,
          SUM(failed_count) as total_failed,
          AVG(CASE WHEN total_targets > 0 THEN (sent_count / total_targets) * 100 END) as avg_success_rate
        FROM campaigns 
        WHERE 1=1 ${deviceCondition} ${timeCondition}
      `, params);

      // Campaign type breakdown
      const [typeStats] = await this.db.query(`
        SELECT 
          message_type,
          COUNT(*) as count,
          SUM(total_targets) as total_targets,
          SUM(sent_count) as sent_count,
          AVG(CASE WHEN total_targets > 0 THEN (sent_count / total_targets) * 100 END) as success_rate
        FROM campaigns 
        WHERE 1=1 ${deviceCondition} ${timeCondition}
        GROUP BY message_type
        ORDER BY count DESC
      `, params);

      // Daily campaign activity
      const [dailyStats] = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as campaigns_created,
          SUM(total_targets) as targets_added,
          SUM(sent_count) as messages_sent
        FROM campaigns 
        WHERE 1=1 ${deviceCondition} ${timeCondition}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      return {
        overall: overallStats[0],
        by_type: typeStats,
        daily_activity: dailyStats,
        timeframe: timeframe
      };
    } catch (error) {
      logger.error('CampaignRepository: Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Search campaigns
   */
  async search(searchTerm, userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        deviceId = null,
        status = null
      } = options;

      let query = `
        SELECT c.*, d.name as device_name 
        FROM campaigns c 
        LEFT JOIN devices d ON c.device_id = d.id 
        WHERE c.user_id = ? 
        AND (c.name LIKE ? OR c.description LIKE ?)
      `;
      
      const values = [userId, `%${searchTerm}%`, `%${searchTerm}%`];

      if (deviceId) {
        query += ' AND c.device_id = ?';
        values.push(deviceId);
      }

      if (status) {
        query += ' AND c.status = ?';
        values.push(status);
      }

      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(campaign => {
        // Parse JSON fields
        if (campaign.message_content) {
          try {
            campaign.message_content = JSON.parse(campaign.message_content);
          } catch (e) {
            campaign.message_content = {};
          }
        }

        if (campaign.target_filters) {
          try {
            campaign.target_filters = JSON.parse(campaign.target_filters);
          } catch (e) {
            campaign.target_filters = {};
          }
        }

        if (campaign.recurring_pattern) {
          try {
            campaign.recurring_pattern = JSON.parse(campaign.recurring_pattern);
          } catch (e) {
            campaign.recurring_pattern = {};
          }
        }

        if (campaign.metadata) {
          try {
            campaign.metadata = JSON.parse(campaign.metadata);
          } catch (e) {
            campaign.metadata = {};
          }
        }

        return campaign;
      });
    } catch (error) {
      logger.error('CampaignRepository: Error searching campaigns:', error);
      throw error;
    }
  }

  /**
   * Duplicate campaign
   */
  async duplicate(id, newName = null) {
    try {
      const original = await this.findById(id);
      if (!original) {
        throw new Error('Campaign not found');
      }

      // Create duplicate with modified name
      const duplicateData = {
        ...original,
        name: newName || `${original.name} (Copy)`,
        status: 'draft', // Start as draft
        total_targets: 0,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        started_at: null,
        completed_at: null,
        cancelled_at: null,
        failed_at: null
      };

      // Remove fields that shouldn't be copied
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      return await this.create(duplicateData);
    } catch (error) {
      logger.error('CampaignRepository: Error duplicating campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getPerformanceMetrics(deviceId = null, days = 30) {
    try {
      let deviceCondition = '';
      let params = [days];

      if (deviceId) {
        deviceCondition = 'AND device_id = ?';
        params.push(deviceId);
      }

      const [rows] = await this.db.query(`
        SELECT 
          id,
          name,
          message_type,
          target_type,
          status,
          total_targets,
          sent_count,
          delivered_count,
          failed_count,
          ROUND(
            CASE 
              WHEN total_targets > 0 THEN (sent_count / total_targets) * 100 
              ELSE 0 
            END, 2
          ) as send_rate,
          ROUND(
            CASE 
              WHEN sent_count > 0 THEN (delivered_count / sent_count) * 100 
              ELSE 0 
            END, 2
          ) as delivery_rate,
          TIMESTAMPDIFF(MINUTE, started_at, completed_at) as duration_minutes,
          created_at,
          started_at,
          completed_at
        FROM campaigns 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ${deviceCondition}
        ORDER BY created_at DESC
      `, params);

      return rows;
    } catch (error) {
      logger.error('CampaignRepository: Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Clean up old campaigns
   */
  async cleanupOldCampaigns(daysToKeep = 90) {
    try {
      const result = await this.db.query(`
        DELETE FROM campaigns 
        WHERE status IN ('completed', 'cancelled', 'failed')
        AND (completed_at < DATE_SUB(NOW(), INTERVAL ? DAY) 
             OR cancelled_at < DATE_SUB(NOW(), INTERVAL ? DAY)
             OR failed_at < DATE_SUB(NOW(), INTERVAL ? DAY))
      `, [daysToKeep, daysToKeep, daysToKeep]);

      return result.affectedRows;
    } catch (error) {
      logger.error('CampaignRepository: Error cleaning up old campaigns:', error);
      throw error;
    }
  }
}

module.exports = CampaignRepository;