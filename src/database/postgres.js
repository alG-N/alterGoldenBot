/**
 * PostgreSQL Database Service
 * Connection pool and query helpers for PostgreSQL
 * @module database/postgres
 */

const { Pool } = require('pg');

class PostgresDatabase {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize the database connection pool
     */
    async initialize() {
        if (this.pool) return;

        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'altergolden',
            password: process.env.DB_PASSWORD || 'altergolden_secret',
            database: process.env.DB_NAME || 'altergolden_db',
            max: 20, // Maximum connections in pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        };

        this.pool = new Pool(config);

        // Test connection
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.isConnected = true;
            console.log('✅ [PostgreSQL] Connected to database');
        } catch (error) {
            console.error('❌ [PostgreSQL] Connection failed:', error.message);
            throw error;
        }

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('❌ [PostgreSQL] Pool error:', err.message);
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
                console.warn(`[PostgreSQL] Slow query (${duration}ms):`, text.substring(0, 100));
            }
            
            return result;
        } catch (error) {
            console.error('[PostgreSQL] Query error:', error.message);
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
     * @param {string} table - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Inserted row
     */
    async insert(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await this.query(text, values);
        return result.rows[0];
    }

    /**
     * Execute an update
     * @param {string} table - Table name
     * @param {Object} data - Data to update
     * @param {Object} where - Where conditions
     * @returns {Promise<Object>} Updated row
     */
    async update(table, data, where) {
        const setKeys = Object.keys(data);
        const setValues = Object.values(data);
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        
        const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const whereClause = whereKeys.map((k, i) => `${k} = $${setKeys.length + i + 1}`).join(' AND ');
        
        const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const result = await this.query(text, [...setValues, ...whereValues]);
        return result.rows[0];
    }

    /**
     * Upsert (insert or update)
     * @param {string} table - Table name
     * @param {Object} data - Data to upsert
     * @param {string} conflictKey - Column for conflict detection
     * @returns {Promise<Object>} Upserted row
     */
    async upsert(table, data, conflictKey) {
        const keys = Object.keys(data);
        const values = Object.values(data);
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
     * @param {string} table - Table name
     * @param {Object} where - Where conditions
     * @returns {Promise<number>} Number of deleted rows
     */
    async delete(table, where) {
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
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
            console.log('✅ [PostgreSQL] Connection pool closed');
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
