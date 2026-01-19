const BaseRepository = require('./BaseRepository');

class WebhookRepository extends BaseRepository {
    constructor() {
        super('webhooks');
    }

    /**
     * Find webhooks by user ID
     */
    async findByUserId(userId, options = {}) {
        return this.findByFilters({ user_id: userId }, options);
    }

    /**
     * Find active webhooks for specific events
     */
    async findActiveByEvents(events, userId = null) {
        let query = `
            SELECT * FROM ${this.tableName} 
            WHERE status = 'active'
        `;
        
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        if (events && events.length > 0) {
            const eventConditions = events.map(() => 'JSON_CONTAINS(events, ?)').join(' OR ');
            query += ` AND (${eventConditions})`;
            events.forEach(event => params.push(`"${event}"`));
        }

        query += ' ORDER BY created_at DESC';

        return this.executeQuery(query, params);
    }

    /**
     * Update webhook last triggered time
     */
    async updateLastTriggered(webhookId) {
        const query = `
            UPDATE ${this.tableName} 
            SET last_triggered_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;

        return this.executeQuery(query, [webhookId]);
    }

    /**
     * Get webhook statistics
     */
    async getWebhookStats(webhookId, period = '7d') {
        const periodCondition = this.getPeriodCondition(period);
        
        const query = `
            SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_calls,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_calls,
                AVG(response_time) as avg_response_time,
                MAX(response_time) as max_response_time,
                MIN(response_time) as min_response_time
            FROM webhook_logs 
            WHERE webhook_id = ? ${periodCondition}
        `;

        const result = await this.executeQuery(query, [webhookId]);
        return result[0] || {};
    }

    /**
     * Get webhook usage by user
     */
    async getWebhookUsageByUser(userId, period = '30d') {
        const periodCondition = this.getPeriodCondition(period);
        
        const query = `
            SELECT 
                w.id,
                w.name,
                w.url,
                COUNT(wl.id) as total_calls,
                SUM(CASE WHEN wl.status = 'success' THEN 1 ELSE 0 END) as successful_calls,
                SUM(CASE WHEN wl.status = 'failed' THEN 1 ELSE 0 END) as failed_calls,
                AVG(wl.response_time) as avg_response_time
            FROM ${this.tableName} w
            LEFT JOIN webhook_logs wl ON w.id = wl.webhook_id ${periodCondition.replace('WHERE', 'AND')}
            WHERE w.user_id = ?
            GROUP BY w.id, w.name, w.url
            ORDER BY total_calls DESC
        `;

        return this.executeQuery(query, [userId]);
    }

    /**
     * Get period condition for SQL queries
     */
    getPeriodCondition(period) {
        const periodMap = {
            '1h': 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)',
            '24h': 'AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)',
            '7d': 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            '30d': 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
            '90d': 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)'
        };

        return periodMap[period] || periodMap['7d'];
    }
}

module.exports = WebhookRepository;