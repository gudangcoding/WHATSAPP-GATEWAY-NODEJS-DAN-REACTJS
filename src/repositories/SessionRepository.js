const BaseRepository = require('./BaseRepository');

class SessionRepository extends BaseRepository {
    constructor() {
        super('sessions');
    }

    /**
     * Find session by token
     */
    async findByToken(token) {
        const query = `SELECT * FROM ${this.tableName} WHERE token = ? LIMIT 1`;
        const result = await this.executeQuery(query, [token]);
        return result[0] || null;
    }

    /**
     * Find sessions by user ID
     */
    async findByUserId(userId) {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = ? AND expires_at > NOW()
            ORDER BY created_at DESC
        `;
        return this.executeQuery(query, [userId]);
    }

    /**
     * Delete session by token
     */
    async deleteByToken(token) {
        const query = `DELETE FROM ${this.tableName} WHERE token = ?`;
        return this.executeQuery(query, [token]);
    }

    /**
     * Delete all sessions for a user
     */
    async deleteByUserId(userId) {
        const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
        return this.executeQuery(query, [userId]);
    }

    /**
     * Clean expired sessions
     */
    async cleanExpiredSessions() {
        const query = `DELETE FROM ${this.tableName} WHERE expires_at < NOW()`;
        return this.executeQuery(query);
    }

    /**
     * Get active sessions count for user
     */
    async getActiveSessionsCount(userId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName} 
            WHERE user_id = ? AND expires_at > NOW()
        `;
        const result = await this.executeQuery(query, [userId]);
        return result[0]?.count || 0;
    }

    /**
     * Get all active sessions
     */
    async getActiveSessions() {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE expires_at > NOW()
            ORDER BY created_at DESC
        `;
        return this.executeQuery(query);
    }

    /**
     * Update session last activity
     */
    async updateLastActivity(sessionId) {
        const query = `
            UPDATE ${this.tableName} 
            SET last_activity_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        return this.executeQuery(query, [sessionId]);
    }

    /**
     * Get session statistics
     */
    async getSessionStats(period = '30d') {
        const periodDays = this.getPeriodDays(period);
        
        const query = `
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_sessions,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as sessions_today,
                AVG(TIMESTAMPDIFF(MINUTE, created_at, COALESCE(last_activity_at, expires_at))) as avg_duration_minutes
            FROM ${this.tableName}
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${periodDays} DAY)
        `;

        const result = await this.executeQuery(query);
        return result[0] || {};
    }

    /**
     * Get period in days
     */
    getPeriodDays(period) {
        const periodMap = {
            '1h': 1,
            '24h': 1,
            '7d': 7,
            '30d': 30,
            '90d': 90
        };

        return periodMap[period] || 30;
    }
}

module.exports = SessionRepository;