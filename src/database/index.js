/**
 * Database Module
 * @module database
 */

const adminDb = require('./admin');
const postgres = require('./postgres');

module.exports = {
    // Main exports
    ...adminDb,
    
    // Direct postgres access for advanced queries
    postgres,
    
    // Initialize alias
    initialize: adminDb.initializeDatabase
};
