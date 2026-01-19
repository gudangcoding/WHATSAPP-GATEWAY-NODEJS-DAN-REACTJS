const BaseRepository = require('./BaseRepository');

class AIHistoryRepository extends BaseRepository {
  constructor() {
    super('ai_history');
  }

  /**
   * Find AI history by type
   */
  async findByType(type, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'executed_at', orderDirection = 'DESC' } = options;
    
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE type = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, [type, limit, offset]);
    return rows;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(timeframe = '24h') {
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
        COUNT(*) as total,
        SUM(tokens_used) as tokens,
        AVG(tokens_used) as avg_tokens,
        type,
        COUNT(*) as type_count
      FROM ${this.tableName}
      ${timeCondition}
      GROUP BY type
      ORDER BY type_count DESC
    `;
    
    const [rows] = await this.db.execute(query);
    
    // Calculate totals
    const totals = rows.reduce((acc, row) => ({
      total: acc.total + row.type_count,
      tokens: acc.tokens + row.tokens,
      by_type: { ...acc.by_type, [row.type]: row.type_count }
    }), {
      total: 0,
      tokens: 0,
      by_type: {}
    });
    
    return totals;
  }

  /**
   * Get token usage by model
   */
  async getTokenUsageByModel(timeframe = '24h') {
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
        model_used,
        COUNT(*) as request_count,
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens,
        MAX(tokens_used) as max_tokens,
        MIN(tokens_used) as min_tokens
      FROM ${this.tableName}
      ${timeCondition}
      GROUP BY model_used
      ORDER BY total_tokens DESC
    `;
    
    const [rows] = await this.db.execute(query);
    return rows;
  }

  /**
   * Get daily usage trends
   */
  async getDailyUsageTrends(days = 7) {
    const query = `
      SELECT 
        DATE(executed_at) as date,
        COUNT(*) as request_count,
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens,
        COUNT(DISTINCT type) as unique_types
      FROM ${this.tableName}
      WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(executed_at)
      ORDER BY date DESC
    `;
    
    const [rows] = await this.db.execute(query, [days]);
    return rows;
  }

  /**
   * Get hourly usage patterns
   */
  async getHourlyUsagePatterns(days = 7) {
    const query = `
      SELECT 
        HOUR(executed_at) as hour,
        COUNT(*) as request_count,
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens
      FROM ${this.tableName}
      WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY HOUR(executed_at)
      ORDER BY hour
    `;
    
    const [rows] = await this.db.execute(query, [days]);
    return rows;
  }

  /**
   * Get most used AI features
   */
  async getMostUsedFeatures(limit = 10, timeframe = '7d') {
    let timeCondition = '';
    
    switch (timeframe) {
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
        type,
        COUNT(*) as usage_count,
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens,
        MAX(executed_at) as last_used,
        MIN(executed_at) as first_used
      FROM ${this.tableName}
      WHERE 1=1 ${timeCondition}
      GROUP BY type
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, [limit]);
    return rows;
  }

  /**
   * Get expensive requests (high token usage)
   */
  async getExpensiveRequests(limit = 10, timeframe = '24h') {
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
        type,
        tokens_used,
        model_used,
        executed_at,
        SUBSTRING(input_data, 1, 200) as input_preview,
        SUBSTRING(output_data, 1, 200) as output_preview
      FROM ${this.tableName}
      WHERE tokens_used > 0 ${timeCondition}
      ORDER BY tokens_used DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, [limit]);
    return rows;
  }

  /**
   * Get AI performance metrics
   */
  async getPerformanceMetrics(timeframe = '24h') {
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
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens_per_request,
        MAX(tokens_used) as max_tokens_single_request,
        MIN(tokens_used) as min_tokens_single_request,
        COUNT(DISTINCT type) as unique_feature_types,
        COUNT(DISTINCT model_used) as unique_models_used,
        MAX(executed_at) as last_request,
        MIN(executed_at) as first_request
      FROM ${this.tableName}
      ${timeCondition}
    `;
    
    const [rows] = await this.db.execute(query);
    const metrics = rows[0] || {
      total_requests: 0,
      total_tokens: 0,
      avg_tokens_per_request: 0,
      max_tokens_single_request: 0,
      min_tokens_single_request: 0,
      unique_feature_types: 0,
      unique_models_used: 0,
      last_request: null,
      first_request: null
    };
    
    // Calculate estimated cost (rough estimation for GPT-3.5-turbo)
    const costPer1kTokens = 0.002;
    metrics.estimated_cost = (metrics.total_tokens / 1000) * costPer1kTokens;
    
    return metrics;
  }

  /**
   * Search AI history by input content
   */
  async searchByInput(searchTerm, options = {}) {
    const { limit = 20, offset = 0, type = null } = options;
    
    let typeCondition = '';
    let params = [`%${searchTerm}%`];
    
    if (type) {
      typeCondition = 'AND type = ?';
      params.push(type);
    }
    
    params.push(limit, offset);
    
    const query = `
      SELECT 
        id,
        type,
        model_used,
        tokens_used,
        executed_at,
        SUBSTRING(input_data, 1, 300) as input_preview,
        SUBSTRING(output_data, 1, 300) as output_preview
      FROM ${this.tableName}
      WHERE input_data LIKE ? ${typeCondition}
      ORDER BY executed_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }

  /**
   * Get token usage forecast
   */
  async getTokenUsageForecast(days = 30) {
    const query = `
      SELECT 
        DATE(executed_at) as date,
        SUM(tokens_used) as daily_tokens,
        COUNT(*) as daily_requests
      FROM ${this.tableName}
      WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(executed_at)
      ORDER BY date
    `;
    
    const [rows] = await this.db.execute(query, [days]);
    
    if (rows.length < 7) {
      return { forecast: null, message: 'Insufficient data for forecast' };
    }
    
    // Simple linear regression for forecast
    const recentDays = rows.slice(-7); // Last 7 days
    const avgDailyTokens = recentDays.reduce((sum, row) => sum + row.daily_tokens, 0) / recentDays.length;
    const avgDailyRequests = recentDays.reduce((sum, row) => sum + row.daily_requests, 0) / recentDays.length;
    
    return {
      historical_data: rows,
      forecast: {
        avg_daily_tokens: Math.round(avgDailyTokens),
        avg_daily_requests: Math.round(avgDailyRequests),
        projected_monthly_tokens: Math.round(avgDailyTokens * 30),
        projected_monthly_cost: ((avgDailyTokens * 30) / 1000) * 0.002
      }
    };
  }

  /**
   * Clean old AI history
   */
  async cleanOldHistory(daysToKeep = 90) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE executed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const [result] = await this.db.execute(query, [daysToKeep]);
    return result.affectedRows;
  }

  /**
   * Export AI history for analysis
   */
  async exportHistory(options = {}) {
    const { 
      startDate = null, 
      endDate = null, 
      type = null, 
      includeData = false,
      limit = 1000 
    } = options;
    
    let conditions = [];
    let params = [];
    
    if (startDate) {
      conditions.push('executed_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('executed_at <= ?');
      params.push(endDate);
    }
    
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    
    params.push(limit);
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const dataFields = includeData ? ', input_data, output_data' : '';
    
    const query = `
      SELECT 
        id,
        type,
        model_used,
        tokens_used,
        executed_at
        ${dataFields}
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY executed_at DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.execute(query, params);
    return rows;
  }
}

module.exports = AIHistoryRepository;