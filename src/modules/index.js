/**
 * Modules Index
 * Centralized exports for all feature modules (services, handlers, utilities)
 * NOTE: Commands are loaded from src/commands/ by CommandRegistry
 * @module modules
 */

// API Module (services, handlers, repositories)
const api = require('./api');

// Music Module (services, handlers, utilities)
const music = require('./music');

// Video Module (services, utilities)
const video = require('./video');

// Fun Module (services, utilities)
const fun = require('./fun');

module.exports = {
    // Module exports (services, handlers, etc.)
    api,
    music,
    video,
    fun
};
