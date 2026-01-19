const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        const query = `SELECT * FROM ${this.tableName} WHERE email = ? LIMIT 1`;
        const result = await this.executeQuery(query, [email]);
        return result[0] || null;
    }

    /**
     * Find user by verification token
     */
    async findByVerificationToken(token) {
        const query = `SELECT * FROM ${this.tableName} WHERE verification_token = ? LIMIT 1`;
        const result = await this.executeQuery(query, [token]);
        return result[0] || null;
    }

    /**
     * Find user by reset token
     */
    async findByResetToken(token) {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE reset_token = ? AND reset_token_expires > NOW() 
            LIMIT 1
        `;
        const result = await this.executeQuery(query, [token]);
        return result[0] || null;
    }

    /**
     * Find active users
     */
    async findActiveUsers(options = {}) {
        return this.findByFilters({ status: 'active' }, options);
    }

    /**
     * Get user statistics
     */
    async getUserStats(period = '30d') {
        const periodCondition = this.getPeriodCondition(period);
        
        const query = `
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
                SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN two_factor_enabled = 1 THEN 1 ELSE 0 END) as two_factor_users,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as new_users_today,
                COUNT(CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as active_users_today
            FROM ${this.tableName}
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${this.getPeriodDays(period)} DAY)
        `;

        const result = await this.executeQuery(query);
        return result[0] || {};
    }

    /**
     * Get user growth statistics
     */
    async getUserGrowth(period = '30d', interval = 'day') {
        const intervalFormat = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';
        const periodDays = this.getPeriodDays(period);

        const query = `
            SELECT 
                DATE_FORMAT(created_at, '${intervalFormat}') as date,
                COUNT(*) as new_users,
                SUM(COUNT(*)) OVER (ORDER BY DATE_FORMAT(created_at, '${intervalFormat}')) as total_users
            FROM ${this.tableName}
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${periodDays} DAY)
            GROUP BY DATE_FORMAT(created_at, '${intervalFormat}')
            ORDER BY date ASC
        `;

        return this.executeQuery(query);
    }

    /**
     * Update last login information
     */
    async updateLastLogin(userId, ipAddress) {
        const query = `
            UPDATE ${this.tableName} 
            SET last_login_at = NOW(), last_login_ip = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        return this.executeQuery(query, [ipAddress, userId]);
    }

    /**
     * Get users by role
     */
    async findByRole(role, options = {}) {
        return this.findByFilters({ role }, options);
    }

    /**
     * Search users
     */
    async searchUsers(searchTerm, options = {}) {
        const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'DESC' } = options;
        const offset = (page - 1) * limit;

        const query = `
            SELECT * FROM ${this.tableName}
            WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)
            AND status != 'deleted'
            ORDER BY ${orderBy} ${orderDirection}
            LIMIT ? OFFSET ?
        `;

        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern, searchPattern, limit, offset];

        return this.executeQuery(query, params);
    }

    /**
     * Count search results
     */
    async countSearchResults(searchTerm) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)
            AND status != 'deleted'
        `;

        const searchPattern = `%${searchTerm}%`;
        const result = await this.executeQuery(query, [searchPattern, searchPattern, searchPattern]);
        return result[0]?.count || 0;
    }

    /**
     * Soft delete user
     */
    async softDelete(userId) {
        const query = `
            UPDATE ${this.tableName} 
            SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        
        return this.executeQuery(query, [userId]);
    }

    /**
     * Restore soft deleted user
     */
    async restore(userId) {
        const query = `
            UPDATE ${this.tableName} 
            SET status = 'active', deleted_at = NULL, updated_at = NOW()
            WHERE id = ?
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

        return periodMap[period] || periodMap['30d'];
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

module.exports = UserRepository;