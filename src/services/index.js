/**
 * alterGolden Services Module
 * Centralized exports for all services and middleware
 * @module services
 */

// Services
const GuildSettingsService = require('./GuildSettingsService');
const ModerationService = require('./ModerationService');
const SnipeService = require('./SnipeService');
const CommandRegistry = require('./CommandRegistry');
const EventRegistry = require('./EventRegistry');

// Middleware
const restrictions = require('./restrictions');
const accessControl = require('./accessControl');
const cooldown = require('./cooldown');
const unified = require('./unified');

module.exports = {
    // ============================================
    // Core Services
    // ============================================
    GuildSettingsService,
    ModerationService,
    SnipeService,
    CommandRegistry,
    EventRegistry,
    
    // ============================================
    // Unified Middleware (RECOMMENDED)
    // ============================================
    AccessType: unified.AccessType,
    checkAccess: unified.checkAccess,
    checkMaintenance: unified.checkMaintenance,
    checkDJAccess: unified.checkDJAccess,
    createErrorEmbed: unified.createErrorEmbed,
    createWarningEmbed: unified.createWarningEmbed,
    
    // ============================================
    // Legacy Access Control (for backward compat)
    // ============================================
    hasPermissions: accessControl.hasPermissions,
    isServerAdmin: accessControl.isServerAdmin,
    isServerOwner: accessControl.isServerOwner,
    isBotOwner: accessControl.isBotOwner,
    isBotDeveloper: accessControl.isBotDeveloper,
    canModerate: accessControl.canModerate,
    botCanModerate: accessControl.botCanModerate,
    
    // ============================================
    // Restrictions
    // ============================================
    canExecute: restrictions.canExecute,
    withRestrictions: restrictions.withRestrictions,
    isInMaintenance: restrictions.isInMaintenance,
    
    // ============================================
    // Cooldown
    // ============================================
    checkCooldown: cooldown.checkCooldown,
    clearCooldown: cooldown.clearCooldown,
    clearUserCooldowns: cooldown.clearUserCooldowns,
    withCooldown: cooldown.withCooldown
};
