const BaseRepository = require('./BaseRepository');

class AutoReplyLogRepository extends BaseRepository {
  constructor() {
    super('auto_reply_logs');
  }

  /**
   * Find logs by auto reply ID
   */
  async findByAutoReplyId(autoReplyId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'executed_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT arl.*, ar.name as auto_reply_name, d.name as device_name
      FROM ${this.tableName} arl
      LEFT JOIN auto_replies ar ON arl.auto_reply_id = ar.id
      LEFT JOIN devices d ON arl.device_id = d.id
      WHERE arl.auto_reply_id = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [autoReplyId, limit, offset]);
    return rows;
  }

  /**
   * Find logs by device ID
   */
  async findByDeviceId(deviceId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'executed_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT arl.*, ar.name as auto_reply_name
      FROM ${this.tableName} arl
      LEFT JOIN auto_replies ar ON arl.auto_reply_id = ar.id
      WHERE arl.device_id = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [deviceId, limit, offset]);
    return rows;
  }

  /**
   * Get statistics for auto reply logs
   */
  async getStatistics(deviceId = null, timeframe = '24h') {
    let timeCondition = '';
    let params = [];
    
    // Add time condition
    switch (timeframe) {
      case '1h':
        timeCondition = 'AND executed_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
        break;
      case '24h':
        timeCondition = 'AND executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        break;
      case '7d':
        timeCondition = 'AND executed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        timeCondition = 'AND executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
    }
    
    let deviceCondition = '';
    if (deviceId) {
      deviceCondition = 'WHERE device_id = ?';
      params.push(deviceId);
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_executions,
        SUM(CASE WHEN reply_sent = 1 THEN 1 ELSE 0 END) as successful_replies,
        SUM(CASE WHEN reply_sent = 0 THEN 1 ELSE 0 END) as failed_replies,
        COUNT(DISTINCT auto_reply_id) as unique_rules_triggered,
        COUNT(DISTINCT from_number) as unique_senders,
        DATE(executed_at) as execution_date,
        COUNT(*) as daily_count
      FROM ${this.tableName}
      ${deviceCondition}
      ${timeCondition}
      GROUP BY DATE(executed_at)
      ORDER BY execution_date DESC
    `;
    
    const [rows] = await this.db.execute(query, params);
    
    // Calculate totals
    const totals = rows.reduce((acc, row) => ({
      total_executions: acc.total_executions + row.total_executions,
      successful_replies: acc.successful_replies + row.successful_replies,
      failed_replies: acc.failed_replies + row.failed_replies,
      unique_rules_triggered: Math.max(acc.unique_rules_triggered, row.unique_rules_triggered),
      unique_senders: Math.max(acc.unique_senders, row.unique_senders)
    }), {
      total_executions: 0,
      successful_replies: 0,
      failed_replies: 0,
      unique_rules_triggered: 0,
      unique_senders: 0
    });
    
    return {
      ...totals,
      success_rate: totals.total_executions > 0 ? 
        ((totals.successful_replies / totals.total_executions) * 100).toFixed(2) : 0,
      daily_breakdown: rows,
      timeframe
    };
  }

  /**
   * Get most triggered auto replies
   */
  async getMostTriggeredRules(deviceId = null, limit = 10, timeframe = '7d') {
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
      deviceCondition = 'AND arl.device_id = ?';
      params.push(deviceId);
    }
    
    params.push(limit);
    
    const query = `
      SELECT 
        ar.id,
        ar.name,
        ar.keywords,
        ar.match_type,
        COUNT(*) as trigger_count,
        SUM(CASE WHEN arl.reply_sent = 1 THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN arl.reply_sent = 0 THEN 1 ELSE 0 END) as failed_count,
        MAX(arl.executed_at) as last_triggered
      FROM ${this.tableName} arl
      JOIN auto_replies ar ON arl.auto_reply_id = ar.id
      WHERE 1=1 ${deviceCondition} ${timeCondition}
      GROUP BY ar.id, ar.name, ar.keywords, ar.match_type
      ORDER BY trigger_count DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get auto reply performance by hour
   */
  async getHourlyPerformance(deviceId = null, days = 7) {
    let deviceCondition = '';
    let params = [days];
    
    if (deviceId) {
      deviceCondition = 'AND device_id = ?';
      params.push(deviceId);
    }
    
    const query = `
      SELECT 
        HOUR(executed_at) as hour,
        COUNT(*) as total_executions,
        SUM(CASE WHEN reply_sent = 1 THEN 1 ELSE 0 END) as successful_replies,
        AVG(CASE WHEN reply_sent = 1 THEN 1 ELSE 0 END) * 100 as success_rate
      FROM ${this.tableName}
      WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ${deviceCondition}
      GROUP BY HOUR(executed_at)
      ORDER BY hour
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Clean old logs
   */
  async cleanOldLogs(daysToKeep = 30) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE executed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const [result] = await this.db.execute(query, [daysToKeep]);
    return result.affectedRows;
  }
}

module.exports = AutoReplyLogRepository;