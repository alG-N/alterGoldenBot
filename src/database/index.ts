/**
 * Database Module
 * Re-exports from infrastructure layer for backward compatibility
 * @module database
 */

import * as adminDb from './admin.js';
import postgres from './postgres.js';
// RE-EXPORTS FROM ADMIN DB
export {
    initializeDatabase,
    query,
    getOne,
    getMany,
    insert,
    update,
    upsert,
    deleteRows,
    transaction,
    close,
    healthCheck,
    isReady,
    type QueryResult,
    type QueuedResponse,
    type TransactionCallback
} from './admin.js';
// RE-EXPORTS FROM POSTGRES
export {
    ALLOWED_TABLES,
    TRANSIENT_ERROR_CODES,
    validateTable,
    type AllowedTable,
    type RetryConfig,
    type QueryOptions,
    type DatabaseStatus,
    type WriteQueueEntry
} from './postgres.js';
// DIRECT MODULE ACCESS
export { postgres };

// Initialize alias
export const initialize = adminDb.initializeDatabase;
// DEFAULT EXPORT
export default {
    // Main exports from admin
    ...adminDb,
    
    // Direct postgres access for advanced queries
    postgres,
    
    // Initialize alias
    initialize: adminDb.initializeDatabase
};
