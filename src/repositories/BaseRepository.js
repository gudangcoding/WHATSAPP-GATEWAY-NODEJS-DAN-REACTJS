const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Create a connection pool (singleton)
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'whatsapp_gateway',
      charset: 'utf8mb4',
      timezone: '+00:00',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = getPool();
  }

  /**
   * Execute query with connection from pool
   */
  async executeQuery(query, params = []) {
    try {
      const [rows] = await this.pool.execute(query, params);
      return rows;
    } catch (error) {
      logger.error(`BaseRepository: Query execution failed for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      
      const [result] = await this.pool.execute(query, values);
      
      // Return the created record
      return await this.findById(result.insertId);
      
    } catch (error) {
      logger.error(`BaseRepository: Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const [rows] = await this.pool.execute(query, [id]);
      
      return rows[0] || null;
      
    } catch (error) {
      logger.error(`BaseRepository: Error finding record by ID in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find records by filters with pagination
   */
  async findByFilters(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, orderBy = 'id', orderDirection = 'DESC' } = options;
      const offset = (page - 1) * limit;
      
      let query = `SELECT * FROM ${this.tableName}`;
      let params = [];
      
      // Build WHERE clause
      if (Object.keys(filters).length > 0) {
        const conditions = [];
        
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Handle IN clause for arrays
            const placeholders = value.map(() => '?').join(', ');
            conditions.push(`${key} IN (${placeholders})`);
            params.push(...value);
          } else if (value !== null && value !== undefined) {
            conditions.push(`${key} = ?`);
            params.push(value);
          }
        });
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      // Add ORDER BY
      query += ` ORDER BY ${orderBy} ${orderDirection}`;
      
      // Add LIMIT and OFFSET
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const rows = await this.executeQuery(query, params);
      return rows;
      
    } catch (error) {
      logger.error(`BaseRepository: Error finding records by filters in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Count records by filters
   */
  async countByFilters(filters = {}) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      let params = [];
      
      // Build WHERE clause
      if (Object.keys(filters).length > 0) {
        const conditions = [];
        
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            const placeholders = value.map(() => '?').join(', ');
            conditions.push(`${key} IN (${placeholders})`);
            params.push(...value);
          } else if (value !== null && value !== undefined) {
            conditions.push(`${key} = ?`);
            params.push(value);
          }
        });
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const rows = await this.executeQuery(query, params);
      return rows[0]?.count || 0;
      
    } catch (error) {
      logger.error(`BaseRepository: Error counting records by filters in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      values.push(id);
      
      const [result] = await this.pool.execute(query, values);
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      // Return the updated record
      return await this.findById(id);
      
    } catch (error) {
      logger.error(`BaseRepository: Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const [result] = await this.pool.execute(query, [id]);
      
      return result.affectedRows > 0;
      
    } catch (error) {
      logger.error(`BaseRepository: Error deleting record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find all records with optional conditions
   */
  async findAll(conditions = {}, options = {}) {
    try {
      const { limit = 100, offset = 0, orderBy = 'id', orderDirection = 'ASC' } = options;
      
      let query = `SELECT * FROM ${this.tableName}`;
      let params = [];
      
      // Add WHERE conditions
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map(key => `${key} = ?`)
          .join(' AND ');
        
        query += ` WHERE ${whereClause}`;
        params = Object.values(conditions);
      }
      
      // Add ORDER BY
      query += ` ORDER BY ${orderBy} ${orderDirection}`;
      
      // Add LIMIT and OFFSET
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const rows = await this.executeQuery(query, params);
      return rows;
      
    } catch (error) {
      logger.error(`BaseRepository: Error finding records in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Count records with optional conditions
   */
  async count(conditions = {}) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      let params = [];
      
      // Add WHERE conditions
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map(key => `${key} = ?`)
          .join(' AND ');
        
        query += ` WHERE ${whereClause}`;
        params = Object.values(conditions);
      }
      
      const rows = await this.executeQuery(query, params);
      return rows[0]?.count || 0;
      
    } catch (error) {
      logger.error(`BaseRepository: Error counting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(conditions) {
    try {
      const count = await this.count(conditions);
      return count > 0;
      
    } catch (error) {
      logger.error(`BaseRepository: Error checking existence in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find one record with conditions
   */
  async findOne(conditions = {}, options = {}) {
    try {
      const records = await this.findAll(conditions, { ...options, limit: 1 });
      return records[0] || null;
      
    } catch (error) {
      logger.error(`BaseRepository: Error finding one record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Execute raw query
   */
  async query(sql, params = []) {
    try {
      const rows = await this.executeQuery(sql, params);
      return rows;
      
    } catch (error) {
      logger.error(`BaseRepository: Error executing raw query in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Bulk insert records
   */
  async bulkInsert(records) {
    if (!records || records.length === 0) {
      return [];
    }

    try {
      const fields = Object.keys(records[0]);
      const placeholders = fields.map(() => '?').join(', ');
      const valuesPlaceholder = `(${placeholders})`;
      const allValuesPlaceholder = records.map(() => valuesPlaceholder).join(', ');
      
      const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES ${allValuesPlaceholder}`;
      
      const values = records.flatMap(record => Object.values(record));
      
      const [result] = await this.pool.execute(query, values);
      
      return {
        insertedCount: result.affectedRows,
        firstInsertId: result.insertId
      };
      
    } catch (error) {
      logger.error(`BaseRepository: Error bulk inserting records in ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;