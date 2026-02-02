/**
 * PostgreSQL Database Service
 * Connection pool and query helpers for PostgreSQL
 * @module database/postgres
 */

const { Pool } = require('pg');
const logger = require('../core/Logger');

// Whitelist of allowed tables to prevent SQL injection
const ALLOWED_TABLES = [
    'guild_settings',
    'moderation_logs',
    'user_data',
    'guild_user_data',
    'afk_users',
    'snipes',
    'playlists',
    'bot_stats',
    'command_analytics',
    'nhentai_favourites',
    'anime_watchlist',
    'anime_history',
    'anime_favourites',
    'anime_notifications'
];

// Regex for valid SQL identifiers (alphanumeric and underscore only)
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validate table name against whitelist
 * @param {string} table - Table name to validate
 * @throws {Error} If table is not in whitelist
 */
function validateTable(table) {
    if (!ALLOWED_TABLES.includes(table)) {
        throw new Error(`Invalid table name: ${table}. Table not in whitelist.`);
    }
}

/**
 * Validate column/identifier name format
 * @param {string} identifier - Column or identifier name
 * @throws {Error} If identifier format is invalid
 */
function validateIdentifier(identifier) {
    if (!VALID_IDENTIFIER.test(identifier)) {
        throw new Error(`Invalid identifier: ${identifier}. Only alphanumeric and underscore allowed.`);
    }
}

class PostgresDatabase {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize the database connection pool
     * Optimized for production with connection limits and timeouts
     */
    async initialize() {
        if (this.pool) return;

        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'altergolden',
            password: process.env.DB_PASSWORD || 'altergolden_secret',
            database: process.env.DB_NAME || 'altergolden_db',
            
            // Connection pool settings (optimized for production)
            max: parseInt(process.env.DB_POOL_MAX) || 15,           // Max connections
            min: parseInt(process.env.DB_POOL_MIN) || 2,            // Min connections
            idleTimeoutMillis: 30000,                                // Close idle connections after 30s
            connectionTimeoutMillis: 10000,                          // Connection timeout 10s
            
            // Query timeout to prevent long-running queries from blocking pool
            statement_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,  // 30s query timeout
            query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
            
            // Connection health
            allowExitOnIdle: false,                                  // Keep pool alive
        };

        this.pool = new Pool(config);

        // Test connection
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.isConnected = true;
            logger.success('PostgreSQL', 'Connected to database');
        } catch (error) {
            logger.error('PostgreSQL', `Connection failed: ${error.message}`);
            throw error;
        }

        // Handle pool errors
        this.pool.on('error', (err) => {
            logger.error('PostgreSQL', `Pool error: ${err.message}`);
        });
    }

    /**
     * Execute a query
     * @param {string} text - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     */
    async query(text, params = []) {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            // Log slow queries
            if (duration > 1000) {
                logger.warn('PostgreSQL', `Slow query (${duration}ms): ${text.substring(0, 100)}`);
            }
            
            return result;
        } catch (error) {
            logger.error('PostgreSQL', `Query error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a single row
     * @param {string} text - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object|null>} Single row or null
     */
    async getOne(text, params = []) {
        const result = await this.query(text, params);
        return result.rows[0] || null;
    }

    /**
     * Get multiple rows
     * @param {string} text - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Array of rows
     */
    async getMany(text, params = []) {
        const result = await this.query(text, params);
        return result.rows;
    }

    /**
     * Execute an insert and return the inserted row
     * @param {string} table - Table name (must be in whitelist)
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Inserted row
     * @throws {Error} If table or column names are invalid
     */
    async insert(table, data) {
        // Validate table name against whitelist
        validateTable(table);
        
        const keys = Object.keys(data);
        const values = Object.values(data);
        
        // Validate all column names
        keys.forEach(key => validateIdentifier(key));
        
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await this.query(text, values);
        return result.rows[0];
    }

    /**
     * Execute an update
     * @param {string} table - Table name (must be in whitelist)
     * @param {Object} data - Data to update
     * @param {Object} where - Where conditions
     * @returns {Promise<Object>} Updated row
     * @throws {Error} If table or column names are invalid
     */
    async update(table, data, where) {
        // Validate table name against whitelist
        validateTable(table);
        
        const setKeys = Object.keys(data);
        const setValues = Object.values(data);
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        
        // Validate all column names
        setKeys.forEach(key => validateIdentifier(key));
        whereKeys.forEach(key => validateIdentifier(key));
        
        const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const whereClause = whereKeys.map((k, i) => `${k} = $${setKeys.length + i + 1}`).join(' AND ');
        
        const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const result = await this.query(text, [...setValues, ...whereValues]);
        return result.rows[0];
    }

    /**
     * Upsert (insert or update)
     * @param {string} table - Table name (must be in whitelist)
     * @param {Object} data - Data to upsert
     * @param {string} conflictKey - Column for conflict detection
     * @returns {Promise<Object>} Upserted row
     * @throws {Error} If table or column names are invalid
     */
    async upsert(table, data, conflictKey) {
        // Validate table name against whitelist
        validateTable(table);
        
        const keys = Object.keys(data);
        const values = Object.values(data);
        
        // Validate all column names including conflict key
        keys.forEach(key => validateIdentifier(key));
        validateIdentifier(conflictKey);
        
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const updateClause = keys
            .filter(k => k !== conflictKey)
            .map(k => `${k} = EXCLUDED.${k}`)
            .join(', ');
        
        const text = `
            INSERT INTO ${table} (${keys.join(', ')}) 
            VALUES (${placeholders}) 
            ON CONFLICT (${conflictKey}) 
            DO UPDATE SET ${updateClause}
            RETURNING *
        `;
        
        const result = await this.query(text, values);
        return result.rows[0];
    }

    /**
     * Delete rows
     * @param {string} table - Table name (must be in whitelist)
     * @param {Object} where - Where conditions
     * @returns {Promise<number>} Number of deleted rows
     * @throws {Error} If table or column names are invalid
     */
    async delete(table, where) {
        // Validate table name against whitelist
        validateTable(table);
        
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        
        // Validate all column names
        whereKeys.forEach(key => validateIdentifier(key));
        
        const whereClause = whereKeys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
        
        const text = `DELETE FROM ${table} WHERE ${whereClause}`;
        const result = await this.query(text, whereValues);
        return result.rowCount;
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Transaction callback
     * @returns {Promise<any>} Transaction result
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Close the connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
            logger.info('PostgreSQL', 'Connection pool closed');
        }
    }

    /**
     * Health check
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            await this.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
module.exports = new PostgresDatabase();
