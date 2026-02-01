/**
 * Access Control Middleware
 * Handles permission checks for commands
 * @module middleware/accessControl
 */

const { PermissionFlagsBits } = require('discord.js');
const { isOwner, isDeveloper } = require('../config/owner');

/**
 * Check if user has required permissions
 * @param {GuildMember} member - Guild member
 * @param {Array<bigint>} permissions - Required permissions
 * @returns {boolean} Whether user has permissions
 */
function hasPermissions(member, permissions) {
    if (!member || !permissions || permissions.length === 0) return true;
    return permissions.every(perm => member.permissions.has(perm));
}

/**
 * Check if user is server admin
 * @param {GuildMember} member - Guild member
 * @returns {boolean} Whether user is admin
 */
function isServerAdmin(member) {
    if (!member) return false;
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if user is server owner
 * @param {GuildMember} member - Guild member
 * @returns {boolean} Whether user is server owner
 */
function isServerOwner(member) {
    if (!member) return false;
    return member.id === member.guild.ownerId;
}

/**
 * Check if user is bot owner
 * @param {string} userId - User ID
 * @returns {boolean} Whether user is bot owner
 */
function isBotOwner(userId) {
    return isOwner(userId);
}

/**
 * Check if user is bot developer
 * @param {string} userId - User ID
 * @returns {boolean} Whether user is developer
 */
function isBotDeveloper(userId) {
    return isDeveloper(userId);
}

/**
 * Check if user can moderate target
 * @param {GuildMember} moderator - Moderator member
 * @param {GuildMember} target - Target member
 * @returns {Object} Result with allowed status and reason
 */
function canModerate(moderator, target) {
    // Bot owner can always moderate
    if (isBotOwner(moderator.id)) {
        return { allowed: true };
    }

    // Can't moderate server owner
    if (target.id === target.guild.ownerId) {
        return { allowed: false, reason: 'Cannot moderate the server owner.' };
    }

    // Can't moderate self
    if (moderator.id === target.id) {
        return { allowed: false, reason: 'You cannot moderate yourself.' };
    }

    // Check role hierarchy
    if (moderator.roles.highest.position <= target.roles.highest.position) {
        return { allowed: false, reason: 'Your role is not higher than the target\'s role.' };
    }

    return { allowed: true };
}

/**
 * Check if bot can moderate target
 * @param {GuildMember} botMember - Bot member
 * @param {GuildMember} target - Target member
 * @returns {Object} Result with allowed status and reason
 */
function botCanModerate(botMember, target) {
    // Can't moderate server owner
    if (target.id === target.guild.ownerId) {
        return { allowed: false, reason: 'I cannot moderate the server owner.' };
    }

    // Check role hierarchy
    if (botMember.roles.highest.position <= target.roles.highest.position) {
        return { allowed: false, reason: 'My role is not higher than the target\'s role.' };
    }

    return { allowed: true };
}

module.exports = {
    hasPermissions,
    isServerAdmin,
    isServerOwner,
    isBotOwner,
    isBotDeveloper,
    canModerate,
    botCanModerate
};
