/**
 * alterGolden Middleware Module
 * Centralized exports for all middleware
 * Re-exports from services for backward compatibility
 * @module middleware
 */

const restrictions = require('../services/restrictions');
const accessControl = require('../services/accessControl');
const cooldown = require('../services/cooldown');
const unified = require('../services/unified');

module.exports = {
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
