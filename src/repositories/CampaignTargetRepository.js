const BaseRepository = require('./BaseRepository');
const logger = require('../utils/logger');

class CampaignTargetRepository extends BaseRepository {
  constructor() {
    super('campaign_targets');
  }

  /**
   * Create new campaign target
   */
  async create(targetData) {
    try {
      const result = await this.db.query(
        `INSERT INTO campaign_targets (
          campaign_id, target_number, target_name, target_type, status, 
          max_retries, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          targetData.campaign_id,
          targetData.target_number,
          targetData.target_name || null,
          targetData.target_type,
          targetData.status || 'queued',
          targetData.max_retries || 3,
          JSON.stringify(targetData.metadata || {})
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('CampaignTargetRepository: Error creating campaign target:', error);
      throw error;
    }
  }

  /**
   * Bulk create campaign targets
   */
  async bulkCreate(targets) {
    try {
      if (!targets || targets.length === 0) {
        return [];
      }

      const values = [];
      const placeholders = [];

      for (const targetData of targets) {
        placeholders.push('(?, ?, ?, ?, ?, ?, ?, NOW())');
        values.push(
          targetData.campaign_id,
          targetData.target_number,
          targetData.target_name || null,
          targetData.target_type,
          targetData.status || 'queued',
          targetData.max_retries || 3,
          JSON.stringify(targetData.metadata || {})
        );
      }

      const result = await this.db.query(`
        INSERT INTO campaign_targets (
          campaign_id, target_number, target_name, target_type, status, 
          max_retries, metadata, created_at
        ) VALUES ${placeholders.join(', ')}
      `, values);

      // Return created target IDs
      const insertId = result.insertId;
      const createdIds = [];
      for (let i = 0; i < targets.length; i++) {
        createdIds.push(insertId + i);
      }

      return createdIds;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error bulk creating campaign targets:', error);
      throw error;
    }
  }

  /**
   * Update campaign target
   */
  async update(id, updateData) {
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
      values.push(id);

      const result = await this.db.query(
        `UPDATE campaign_targets SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error updating campaign target:', error);
      throw error;
    }
  }

  /**
   * Find campaign target by ID
   */
  async findById(id) {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM campaign_targets WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const target = rows[0];
      
      if (target.metadata) {
        try {
          target.metadata = JSON.parse(target.metadata);
        } catch (e) {
          target.metadata = {};
        }
      }

      return target;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error finding campaign target by ID:', error);
      throw error;
    }
  }

  /**
   * Find targets by campaign ID
   */
  async findByCampaignId(campaignId, options = {}) {
    try {
      const {
        limit = 1000,
        offset = 0,
        status = null,
        orderBy = 'created_at',
        orderDirection = 'ASC'
      } = options;

      let query = 'SELECT * FROM campaign_targets WHERE campaign_id = ?';
      const values = [campaignId];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(target => {
        if (target.metadata) {
          try {
            target.metadata = JSON.parse(target.metadata);
          } catch (e) {
            target.metadata = {};
          }
        }
        return target;
      });
    } catch (error) {
      logger.error('CampaignTargetRepository: Error finding targets by campaign ID:', error);
      throw error;
    }
  }

  /**
   * Get queued targets for processing
   */
  async getQueuedTargets(campaignId, limit = 100) {
    try {
      const [rows] = await this.db.query(`
        SELECT * FROM campaign_targets 
        WHERE campaign_id = ? 
        AND status = 'queued'
        ORDER BY created_at ASC
        LIMIT ?
      `, [campaignId, limit]);

      return rows.map(target => {
        if (target.metadata) {
          try {
            target.metadata = JSON.parse(target.metadata);
          } catch (e) {
            target.metadata = {};
          }
        }
        return target;
      });
    } catch (error) {
      logger.error('CampaignTargetRepository: Error getting queued targets:', error);
      throw error;
    }
  }

  /**
   * Update target status
   */
  async updateStatus(id, status, additionalData = {}) {
    try {
      const updateData = {
        status: status,
        ...additionalData
      };

      // Add timestamp fields based on status
      if (status === 'sending') updateData.sending_at = new Date();
      if (status === 'sent') updateData.sent_at = new Date();
      if (status === 'delivered') updateData.delivered_at = new Date();
      if (status === 'failed') updateData.failed_at = new Date();

      return await this.update(id, updateData);
    } catch (error) {
      logger.error('CampaignTargetRepository: Error updating target status:', error);
      throw error;
    }
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id) {
    try {
      const result = await this.db.query(
        'UPDATE campaign_targets SET retry_count = retry_count + 1, updated_at = NOW() WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error incrementing retry count:', error);
      throw error;
    }
  }

  /**
   * Get campaign target statistics
   */
  async getStatistics(campaignId) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          COUNT(*) as total_targets,
          COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_count,
          COUNT(CASE WHEN status = 'sending' THEN 1 END) as sending_count,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_count,
          AVG(retry_count) as avg_retry_count,
          MIN(created_at) as first_target_at,
          MAX(sent_at) as last_sent_at
        FROM campaign_targets 
        WHERE campaign_id = ?
      `, [campaignId]);

      return rows[0];
    } catch (error) {
      logger.error('CampaignTargetRepository: Error getting target statistics:', error);
      throw error;
    }
  }

  /**
   * Count targets by status
   */
  async countByStatus(campaignId) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM campaign_targets 
        WHERE campaign_id = ?
        GROUP BY status
      `, [campaignId]);

      const statusCounts = {};
      rows.forEach(row => {
        statusCounts[row.status] = row.count;
      });

      return statusCounts;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error counting targets by status:', error);
      throw error;
    }
  }

  /**
   * Get failed targets for retry
   */
  async getFailedTargetsForRetry(campaignId, maxRetries = 3) {
    try {
      const [rows] = await this.db.query(`
        SELECT * FROM campaign_targets 
        WHERE campaign_id = ? 
        AND status = 'failed'
        AND retry_count < max_retries
        AND retry_count < ?
        ORDER BY failed_at ASC
      `, [campaignId, maxRetries]);

      return rows.map(target => {
        if (target.metadata) {
          try {
            target.metadata = JSON.parse(target.metadata);
          } catch (e) {
            target.metadata = {};
          }
        }
        return target;
      });
    } catch (error) {
      logger.error('CampaignTargetRepository: Error getting failed targets for retry:', error);
      throw error;
    }
  }

  /**
   * Delete targets by campaign ID
   */
  async deleteByCampaignId(campaignId) {
    try {
      const result = await this.db.query(
        'DELETE FROM campaign_targets WHERE campaign_id = ?',
        [campaignId]
      );

      return result.affectedRows;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error deleting targets by campaign ID:', error);
      throw error;
    }
  }

  /**
   * Get target delivery timeline
   */
  async getDeliveryTimeline(campaignId) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          DATE_FORMAT(sent_at, '%Y-%m-%d %H:00:00') as hour,
          COUNT(*) as sent_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
        FROM campaign_targets 
        WHERE campaign_id = ? 
        AND sent_at IS NOT NULL
        GROUP BY DATE_FORMAT(sent_at, '%Y-%m-%d %H:00:00')
        ORDER BY hour ASC
      `, [campaignId]);

      return rows;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error getting delivery timeline:', error);
      throw error;
    }
  }

  /**
   * Get target performance by type
   */
  async getPerformanceByType(campaignId) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          target_type,
          COUNT(*) as total_count,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          ROUND(
            (COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*)) * 100, 2
          ) as success_rate
        FROM campaign_targets 
        WHERE campaign_id = ?
        GROUP BY target_type
        ORDER BY total_count DESC
      `, [campaignId]);

      return rows;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error getting performance by type:', error);
      throw error;
    }
  }

  /**
   * Search targets
   */
  async search(campaignId, searchTerm, options = {}) {
    try {
      const {
        limit = 100,
        offset = 0,
        status = null
      } = options;

      let query = `
        SELECT * FROM campaign_targets 
        WHERE campaign_id = ? 
        AND (target_number LIKE ? OR target_name LIKE ?)
      `;
      
      const values = [campaignId, `%${searchTerm}%`, `%${searchTerm}%`];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.db.query(query, values);

      return rows.map(target => {
        if (target.metadata) {
          try {
            target.metadata = JSON.parse(target.metadata);
          } catch (e) {
            target.metadata = {};
          }
        }
        return target;
      });
    } catch (error) {
      logger.error('CampaignTargetRepository: Error searching targets:', error);
      throw error;
    }
  }

  /**
   * Reset failed targets for retry
   */
  async resetFailedTargets(campaignId) {
    try {
      const result = await this.db.query(`
        UPDATE campaign_targets 
        SET status = 'queued', 
            retry_count = 0,
            error_message = NULL,
            failed_at = NULL,
            updated_at = NOW()
        WHERE campaign_id = ? 
        AND status = 'failed'
      `, [campaignId]);

      return result.affectedRows;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error resetting failed targets:', error);
      throw error;
    }
  }

  /**
   * Get duplicate targets
   */
  async getDuplicateTargets(campaignId) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          target_number,
          COUNT(*) as duplicate_count,
          GROUP_CONCAT(id) as target_ids
        FROM campaign_targets 
        WHERE campaign_id = ?
        GROUP BY target_number
        HAVING COUNT(*) > 1
      `, [campaignId]);

      return rows;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error getting duplicate targets:', error);
      throw error;
    }
  }

  /**
   * Remove duplicate targets (keep first one)
   */
  async removeDuplicateTargets(campaignId) {
    try {
      const result = await this.db.query(`
        DELETE ct1 FROM campaign_targets ct1
        INNER JOIN campaign_targets ct2 
        WHERE ct1.campaign_id = ? 
        AND ct1.campaign_id = ct2.campaign_id
        AND ct1.target_number = ct2.target_number
        AND ct1.id > ct2.id
      `, [campaignId]);

      return result.affectedRows;
    } catch (error) {
      logger.error('CampaignTargetRepository: Error removing duplicate targets:', error);
      throw error;
    }
  }
}

module.exports = CampaignTargetRepository;