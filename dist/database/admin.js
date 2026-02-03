"use strict";
/**
 * Administrator Database
 * PostgreSQL database service for server administration features
 * Schema is managed via docker/init/01-schema.sql
 * @module database/admin
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgres = void 0;
exports.initializeDatabase = initializeDatabase;
exports.query = query;
exports.getOne = getOne;
exports.getMany = getMany;
exports.insert = insert;
exports.update = update;
exports.upsert = upsert;
exports.deleteRows = deleteRows;
exports.transaction = transaction;
exports.close = close;
exports.healthCheck = healthCheck;
exports.isReady = isReady;
const postgres_js_1 = __importDefault(require("./postgres.js"));
exports.postgres = postgres_js_1.default;
// STATE
let isInitialized = false;
// INITIALIZATION
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
        await postgres_js_1.default.initialize();
        // Verify tables exist
        const result = await postgres_js_1.default.query(`
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
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ [AdminDB] PostgreSQL initialization failed:', errMsg);
        throw error; // Don't fail silently - DB is required
    }
}
// QUERY HELPERS
/**
 * Execute a query with PostgreSQL-style parameters ($1, $2, etc.)
 */
async function query(sql, params = []) {
    // Cast to unknown first to satisfy constraint
    const result = await postgres_js_1.default.query(sql, params);
    return result;
}
/**
 * Get a single row
 */
async function getOne(sql, params = []) {
    const result = await postgres_js_1.default.getOne(sql, params);
    return result;
}
/**
 * Get all matching rows
 */
async function getMany(sql, params = []) {
    const result = await postgres_js_1.default.getMany(sql, params);
    return result;
}
// CRUD OPERATIONS
/**
 * Insert and return inserted row
 */
async function insert(table, data) {
    const result = await postgres_js_1.default.insert(table, data);
    return result;
}
/**
 * Update and return updated row
 */
async function update(table, data, where) {
    const result = await postgres_js_1.default.update(table, data, where);
    return result;
}
/**
 * Upsert (insert or update on conflict)
 */
async function upsert(table, data, conflictKey) {
    const result = await postgres_js_1.default.upsert(table, data, conflictKey);
    return result;
}
/**
 * Delete rows
 */
async function deleteRows(table, where) {
    return postgres_js_1.default.delete(table, where);
}
/**
 * Execute a transaction
 */
async function transaction(callback) {
    return postgres_js_1.default.transaction(callback);
}
// LIFECYCLE
/**
 * Close database connection
 */
async function close() {
    await postgres_js_1.default.close();
    isInitialized = false;
}
/**
 * Health check
 */
async function healthCheck() {
    return postgres_js_1.default.healthCheck();
}
/**
 * Check if database is initialized
 */
function isReady() {
    return isInitialized;
}
// Default export for CommonJS compatibility
exports.default = {
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
    postgres: postgres_js_1.default
};
//# sourceMappingURL=admin.js.map