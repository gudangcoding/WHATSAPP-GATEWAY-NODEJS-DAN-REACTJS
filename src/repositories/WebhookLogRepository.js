const BaseRepository = require('./BaseRepository');

class WebhookLogRepository extends BaseRepository {
  constructor() {
    super('webhook_logs');
  }

  /**
   * Find logs by webhook URL
   */
  async findByWebhookUrl(webhookUrl, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'executed_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE webhook_url = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [webhookUrl, limit, offset]);
    return rows;
  }

  /**
   * Get statistics by webhook URL
   */
  async getStatsByUrl(webhookUrl, timeframe = '24h') {
    let timeCondition = '';
    
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
    
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
        AVG(CASE WHEN success = 1 THEN response_time_ms ELSE NULL END) as avg_response_time,
        MAX(executed_at) as last_request,
        MIN(executed_at) as first_request
      FROM ${this.tableName}
      WHERE webhook_url = ? ${timeCondition}
    `;
    
    const [rows] = await this.db.execute(query, [webhookUrl]);
    return rows[0] || {
      total: 0,
      success: 0,
      failed: 0,
      avg_response_time: 0,
      last_request: null,
      first_request: null
    };
  }

  /**
   * Get overall webhook statistics
   */
  async getOverallStats(timeframe = '24h') {
    let timeCondition = '';
    
    switch (timeframe) {
      case '1h':
        timeCondition = 'WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
        break;
      case '24h':
        timeCondition = 'WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        break;
      case '7d':
        timeCondition = 'WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        timeCondition = 'WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      default:
        timeCondition = '';
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
        COUNT(DISTINCT webhook_url) as unique_webhooks,
        AVG(CASE WHEN success = 1 THEN response_time_ms ELSE NULL END) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        MIN(response_time_ms) as min_response_time
      FROM ${this.tableName}
      ${timeCondition}
    `;
    
    const [rows] = await this.db.execute(query);
    const stats = rows[0] || {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      unique_webhooks: 0,
      avg_response_time: 0,
      max_response_time: 0,
      min_response_time: 0
    };
    
    // Calculate success rate
    stats.success_rate = stats.total_requests > 0 ? 
      ((stats.successful_requests / stats.total_requests) * 100).toFixed(2) : 0;
    
    return stats;
  }

  /**
   * Get webhook performance by status code
   */
  async getStatusCodeStats(webhookUrl = null, timeframe = '24h') {
    let timeCondition = '';
    let webhookCondition = '';
    let params = [];
    
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
    
    if (webhookUrl) {
      webhookCondition = 'AND webhook_url = ?';
      params.push(webhookUrl);
    }
    
    const query = `
      SELECT 
        status_code,
        COUNT(*) as count,
        AVG(response_time_ms) as avg_response_time,
        MAX(executed_at) as last_occurrence
      FROM ${this.tableName}
      WHERE 1=1 ${webhookCondition} ${timeCondition}
      GROUP BY status_code
      ORDER BY count DESC
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get failed webhook requests
   */
  async getFailedRequests(limit = 50, timeframe = '24h') {
    let timeCondition = '';
    
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
    
    const query = `
      SELECT 
        webhook_url,
        status_code,
        error_message,
        payload,
        executed_at,
        response_time_ms
      FROM ${this.tableName}
      WHERE success = 0 ${timeCondition}
      ORDER BY executed_at DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, [limit]);
    return rows;
  }

  /**
   * Get webhook performance trends
   */
  async getPerformanceTrends(webhookUrl = null, days = 7) {
    let webhookCondition = '';
    let params = [days];
    
    if (webhookUrl) {
      webhookCondition = 'AND webhook_url = ?';
      params.push(webhookUrl);
    }
    
    const query = `
      SELECT 
        DATE(executed_at) as date,
        COUNT(*) as total_requests,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
        AVG(CASE WHEN success = 1 THEN response_time_ms ELSE NULL END) as avg_response_time,
        MAX(response_time_ms) as max_response_time
      FROM ${this.tableName}
      WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ${webhookCondition}
      GROUP BY DATE(executed_at)
      ORDER BY date DESC
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get slowest webhook requests
   */
  async getSlowestRequests(limit = 10, timeframe = '24h') {
    let timeCondition = '';
    
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
    
    const query = `
      SELECT 
        webhook_url,
        status_code,
        response_time_ms,
        executed_at,
        SUBSTRING(payload, 1, 100) as payload_preview
      FROM ${this.tableName}
      WHERE response_time_ms IS NOT NULL ${timeCondition}
      ORDER BY response_time_ms DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, [limit]);
    return rows;
  }

  /**
   * Get webhook URLs with most failures
   */
  async getMostFailedWebhooks(limit = 10, timeframe = '24h') {
    let timeCondition = '';
    
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
    
    const query = `
      SELECT 
        webhook_url,
        COUNT(*) as total_requests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
        (SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as failure_rate,
        MAX(executed_at) as last_failure
      FROM ${this.tableName}
      WHERE 1=1 ${timeCondition}
      GROUP BY webhook_url
      HAVING failed_requests > 0
      ORDER BY failure_rate DESC, failed_requests DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, [limit]);
    return rows;
  }

  /**
   * Clean old webhook logs
   */
  async cleanOldLogs(daysToKeep = 30) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE executed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const [result] = await this.db.execute(query, [daysToKeep]);
    return result.affectedRows;
  }

  /**
   * Create webhook log with response time
   */
  async createWithTiming(logData, startTime) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const dataWithTiming = {
      ...logData,
      response_time_ms: responseTime,
      executed_at: new Date()
    };
    
    return await this.create(dataWithTiming);
  }
}

module.exports = WebhookLogRepository;