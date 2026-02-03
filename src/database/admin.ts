/**
 * Administrator Database
 * PostgreSQL database service for server administration features
 * Schema is managed via docker/init/01-schema.sql
 * @module database/admin
 */

import postgres, { 
    QueuedResponse, 
    TransactionCallback 
} from './postgres.js';
// TYPES
export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number | null;
}

export type { QueuedResponse, TransactionCallback };
// STATE
let isInitialized = false;
// INITIALIZATION
/**
 * Initialize database connection
 * Tables are created by 01-schema.sql when Docker starts
 */
export async function initializeDatabase(): Promise<void> {
    if (isInitialized) {
        console.log('⚠️ [AdminDB] Already initialized');
        return;
    }

    try {
        await postgres.initialize();
        
        // Verify tables exist
        const result = await postgres.query<{ table_name: string }>(`
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
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ [AdminDB] PostgreSQL initialization failed:', errMsg);
        throw error; // Don't fail silently - DB is required
    }
}
// QUERY HELPERS
/**
 * Execute a query with PostgreSQL-style parameters ($1, $2, etc.)
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string, 
    params: unknown[] = []
): Promise<QueryResult<T>> {
    // Cast to unknown first to satisfy constraint
    const result = await postgres.query(sql, params);
    return result as unknown as QueryResult<T>;
}

/**
 * Get a single row
 */
export async function getOne<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string, 
    params: unknown[] = []
): Promise<T | null> {
    const result = await postgres.getOne(sql, params);
    return result as T | null;
}

/**
 * Get all matching rows
 */
export async function getMany<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string, 
    params: unknown[] = []
): Promise<T[]> {
    const result = await postgres.getMany(sql, params);
    return result as T[];
}
// CRUD OPERATIONS
/**
 * Insert and return inserted row
 */
export async function insert<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string, 
    data: Record<string, unknown>
): Promise<T | QueuedResponse | null> {
    const result = await postgres.insert(table, data);
    return result as T | QueuedResponse | null;
}

/**
 * Update and return updated row
 */
export async function update<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string, 
    data: Record<string, unknown>, 
    where: Record<string, unknown>
): Promise<T | QueuedResponse | null> {
    const result = await postgres.update(table, data, where);
    return result as T | QueuedResponse | null;
}

/**
 * Upsert (insert or update on conflict)
 */
export async function upsert<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string, 
    data: Record<string, unknown>, 
    conflictKey: string
): Promise<T | QueuedResponse | null> {
    const result = await postgres.upsert(table, data, conflictKey);
    return result as T | QueuedResponse | null;
}

/**
 * Delete rows
 */
export async function deleteRows(
    table: string, 
    where: Record<string, unknown>
): Promise<number | QueuedResponse> {
    return postgres.delete(table, where);
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
    callback: TransactionCallback<T>
): Promise<T> {
    return postgres.transaction<T>(callback);
}
// LIFECYCLE
/**
 * Close database connection
 */
export async function close(): Promise<void> {
    await postgres.close();
    isInitialized = false;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
    return postgres.healthCheck();
}

/**
 * Check if database is initialized
 */
export function isReady(): boolean {
    return isInitialized;
}
// EXPORTS
export { postgres };

// Default export for CommonJS compatibility
export default {
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
