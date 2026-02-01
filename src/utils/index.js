/**
 * alterGolden Utilities Module
 * @module utils
 */

// Core utilities
const { createClient, setPresence, ActivityType, CLIENT_OPTIONS } = require('./Client');
const logger = require('./Logger');
const time = require('./time');
const { initializeErrorHandlers } = require('./errorHandler');

// Error classes
const AppErrors = require('./AppError');
const MusicErrors = require('./MusicError');

module.exports = {
    // Client
    createClient,
    setPresence,
    ActivityType,
    CLIENT_OPTIONS,
    
    // Logger
    logger,
    
    // Time utilities
    ...time,
    
    // Error handler
    initializeErrorHandlers,
    
    // Error classes
    ...AppErrors,
    ...MusicErrors,
};
