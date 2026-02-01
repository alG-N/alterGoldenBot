/**
 * Administrator Database
 * PostgreSQL database service for server administration features
 * Schema is managed via docker/init/01-schema.sql
 * @module database/admin
 */

const postgres = require('./postgres');

let isInitialized = false;

/**
 * Initialize database connection
 * Tables are created by 01-schema.sql when Docker starts
 */
async function initializeDatabase() {
    if (isInitialized) {
        console.log('⚠️ [AdminDB] Already initialized');
        return;
    }

    try {
        await postgres.initialize();
        
        // Verify tables exist
        const result = await postgres.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('guild_settings', 'moderation_logs', 'snipes')
        `);
        
        if (result.rows.length < 3) {
            console.warn('⚠️ [AdminDB] Some tables missing. Ensure 01-schema.sql has been executed.');
        }
        
        isInitialized = true;
        console.log('✅ [AdminDB] PostgreSQL initialized');
    } catch (error) {
        console.error('❌ [AdminDB] PostgreSQL initialization failed:', error.message);
        throw error; // Don't fail silently - DB is required
    }
}

/**
 * Execute a query with PostgreSQL-style parameters ($1, $2, etc.)
 */
async function query(sql, params = []) {
    return postgres.query(sql, params);
}

/**
 * Get a single row
 */
async function getOne(sql, params = []) {
    return postgres.getOne(sql, params);
}

/**
 * Get all matching rows
 */
async function getMany(sql, params = []) {
    return postgres.getMany(sql, params);
}

/**
 * Insert and return inserted row
 */
async function insert(table, data) {
    return postgres.insert(table, data);
}

/**
 * Update and return updated row
 */
async function update(table, data, where) {
    return postgres.update(table, data, where);
}

/**
 * Upsert (insert or update on conflict)
 */
async function upsert(table, data, conflictKey) {
    return postgres.upsert(table, data, conflictKey);
}

/**
 * Delete rows
 */
async function deleteRows(table, where) {
    return postgres.delete(table, where);
}

/**
 * Execute a transaction
 */
async function transaction(callback) {
    return postgres.transaction(callback);
}

/**
 * Close database connection
 */
async function close() {
    await postgres.close();
    isInitialized = false;
}

/**
 * Health check
 */
async function healthCheck() {
    return postgres.healthCheck();
}

/**
 * Check if database is initialized
 */
function isReady() {
    return isInitialized;
}

module.exports = {
    initializeDatabase,
    query,
    getOne,
    getMany,
    insert,
    update,
    upsert,
    delete: deleteRows,
    transaction,
    close,
    healthCheck,
    isReady,
    postgres
};
