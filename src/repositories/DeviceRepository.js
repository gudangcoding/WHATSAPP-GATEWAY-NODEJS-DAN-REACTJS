const BaseRepository = require('./BaseRepository');

class DeviceRepository extends BaseRepository {
    constructor() {
        super('devices');
    }

    /**
     * Find devices by user ID
     */
    async findByUserId(userId) {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = ? AND status != 'deleted'
            ORDER BY created_at DESC
        `;
        return this.executeQuery(query, [userId]);
    }

    /**
     * Find device by phone number
     */
    async findByPhoneNumber(phoneNumber) {
        const query = `SELECT * FROM ${this.tableName} WHERE phone_number = ? LIMIT 1`;
        const result = await this.executeQuery(query, [phoneNumber]);
        return result[0] || null;
    }

    /**
     * Find active devices
     */
    async findActiveDevices(userId = null) {
        let query = `
            SELECT * FROM ${this.tableName} 
            WHERE status = 'connected'
        `;
        const params = [];

        if (userId) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        query += ` ORDER BY last_seen_at DESC`;
        return this.executeQuery(query, params);
    }

    /**
     * Update device status
     */
    async updateStatus(deviceId, status, connectionInfo = {}) {
        const updateData = {
            status,
            updated_at: new Date()
        };

        if (status === 'connected') {
            updateData.connected_at = new Date();
            updateData.last_seen_at = new Date();
        } else if (status === 'disconnected') {
            updateData.disconnected_at = new Date();
        }

        if (connectionInfo.qr_code) {
            updateData.qr_code = connectionInfo.qr_code;
        }

        if (connectionInfo.session_data) {
            updateData.session_data = JSON.stringify(connectionInfo.session_data);
        }

        return this.update(deviceId, updateData);
    }

    /**
     * Update last seen timestamp
     */
    async updateLastSeen(deviceId) {
        const query = `
            UPDATE ${this.tableName} 
            SET last_seen_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        return this.executeQuery(query, [deviceId]);
    }

    /**
     * Get device statistics
     */
    async getDeviceStats(userId = null, period = '30d') {
        const periodDays = this.getPeriodDays(period);
        let query = `
            SELECT 
                COUNT(*) as total_devices,
                SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as connected_devices,
                SUM(CASE WHEN status = 'disconnected' THEN 1 ELSE 0 END) as disconnected_devices,
                SUM(CASE WHEN status = 'connecting' THEN 1 ELSE 0 END) as connecting_devices,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as new_devices_today,
                AVG(CASE WHEN connected_at IS NOT NULL AND disconnected_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, connected_at, disconnected_at) END) as avg_connection_duration_minutes
            FROM ${this.tableName}
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${periodDays} DAY)
            AND status != 'deleted'
        `;

        const params = [];
        if (userId) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        const result = await this.executeQuery(query, params);
        return result[0] || {};
    }

    /**
     * Get device uptime statistics
     */
    async getUptimeStats(deviceId, period = '7d') {
        const periodDays = this.getPeriodDays(period);
        
        const query = `
            SELECT 
                device_id,
                DATE(created_at) as date,
                SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as connected_count,
                COUNT(*) as total_status_changes
            FROM device_status_logs 
            WHERE device_id = ? 
            AND created_at >= DATE_SUB(NOW(), INTERVAL ${periodDays} DAY)
            GROUP BY device_id, DATE(created_at)
            ORDER BY date DESC
        `;

        return this.executeQuery(query, [deviceId]);
    }

    /**
     * Search devices
     */
    async searchDevices(searchTerm, userId = null, options = {}) {
        const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'DESC' } = options;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM ${this.tableName}
            WHERE (name LIKE ? OR phone_number LIKE ?)
            AND status != 'deleted'
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern];

        if (userId) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return this.executeQuery(query, params);
    }

    /**
     * Count search results
     */
    async countSearchResults(searchTerm, userId = null) {
        let query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE (name LIKE ? OR phone_number LIKE ?)
            AND status != 'deleted'
        `;

        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern];

        if (userId) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        const result = await this.executeQuery(query, params);
        return result[0]?.count || 0;
    }

    /**
     * Soft delete device
     */
    async softDelete(deviceId) {
        const query = `
            UPDATE ${this.tableName} 
            SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        return this.executeQuery(query, [deviceId]);
    }

    /**
     * Get devices requiring reconnection
     */
    async getDevicesRequiringReconnection() {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE status IN ('disconnected', 'error')
            AND auto_reconnect = 1
            AND last_reconnect_attempt < DATE_SUB(NOW(), INTERVAL reconnect_interval MINUTE)
            ORDER BY last_reconnect_attempt ASC
        `;
        return this.executeQuery(query);
    }

    /**
     * Update reconnection attempt
     */
    async updateReconnectionAttempt(deviceId) {
        const query = `
            UPDATE ${this.tableName} 
            SET last_reconnect_attempt = NOW(), 
                reconnect_attempts = reconnect_attempts + 1,
                updated_at = NOW()
            WHERE id = ?
        `;
        return this.executeQuery(query, [deviceId]);
    }

    /**
     * Reset reconnection attempts
     */
    async resetReconnectionAttempts(deviceId) {
        const query = `
            UPDATE ${this.tableName} 
            SET reconnect_attempts = 0, 
                last_reconnect_attempt = NULL,
                updated_at = NOW()
            WHERE id = ?
        `;
        return this.executeQuery(query, [deviceId]);
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

module.exports = DeviceRepository;