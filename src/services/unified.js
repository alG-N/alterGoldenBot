/**
 * Unified Middleware Module
 * Consolidates all middleware for use across the application
 * @module services/unified
 */

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/constants');

// Try to load maintenance config
let maintenanceConfig = null;
try {
    maintenanceConfig = require('../config/maintenance');
} catch (e) {
    console.log('[Middleware] Maintenance config not found, using defaults');
    maintenanceConfig = {
        getMaintenanceState: () => ({ enabled: false }),
        canBypassMaintenance: () => false
    };
}

// Try to load owner config
let ownerConfig = null;
try {
    ownerConfig = require('../config/owner');
} catch (e) {
    console.log('[Middleware] Owner config not found, using defaults');
    ownerConfig = {
        isOwner: () => false,
        isDeveloper: () => false
    };
}

// ============================================================================
// ACCESS TYPES
// ============================================================================

/**
 * Access types for commands
 */
const AccessType = {
    PUBLIC: 'public',      // Anyone can use
    SUB: 'sub',           // Sub-bot (same as public for now)
    MAIN: 'main',         // Main bot only
    BOTH: 'both',         // Both bots
    ADMIN: 'admin',       // Server admins only
    OWNER: 'owner',       // Bot owners only
    DJ: 'dj',             // DJ role or admin
    NSFW: 'nsfw',         // NSFW channels only
};

// ============================================================================
// MAINTENANCE CHECK
// ============================================================================

/**
 * Check if bot is in maintenance mode
 * @param {string} userId - User ID to check bypass
 * @returns {Object} { inMaintenance, embed }
 */
function checkMaintenance(userId) {
    try {
        const state = maintenanceConfig.getMaintenanceState?.() || 
                      maintenanceConfig.getMaintenanceStatus?.() || 
                      { enabled: false };
        
        if (!state?.enabled) {
            return { inMaintenance: false };
        }
        
        // Check bypass
        if (maintenanceConfig.canBypassMaintenance?.(userId)) {
            return { inMaintenance: false, bypassed: true };
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.WARNING} System Maintenance`)
            .setColor(COLORS.WARNING)
            .setDescription(`alterGolden is currently under maintenance.\n\n**Reason:** ${state.reason || 'Scheduled maintenance'}`)
            .setTimestamp();
        
        if (state.estimatedEnd) {
            embed.addFields({
                name: `${EMOJIS.CLOCK} Estimated Return`,
                value: `<t:${Math.floor(state.estimatedEnd / 1000)}:R>`,
                inline: true
            });
        }
        
        return { inMaintenance: true, embed };
    } catch (error) {
        // Fail open - don't block if check fails
        return { inMaintenance: false };
    }
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

/**
 * Unified access check for commands
 * @param {CommandInteraction} interaction - Discord interaction
 * @param {AccessType} accessType - Type of access required
 * @param {Object} options - Additional options
 * @returns {Object} { blocked, embed, reason }
 */
async function checkAccess(interaction, accessType = AccessType.PUBLIC, options = {}) {
    const userId = interaction.user?.id;
    const member = interaction.member;
    const channel = interaction.channel;
    
    // 1. Maintenance check
    const maintenance = checkMaintenance(userId);
    if (maintenance.inMaintenance) {
        return { blocked: true, embed: maintenance.embed, reason: 'MAINTENANCE' };
    }
    
    // 2. Owner-only check
    if (accessType === AccessType.OWNER) {
        if (!ownerConfig.isOwner(userId)) {
            return {
                blocked: true,
                embed: createErrorEmbed('This command is restricted to bot owners.'),
                reason: 'NOT_OWNER'
            };
        }
    }
    
    // 3. Admin-only check
    if (accessType === AccessType.ADMIN) {
        if (!member?.permissions?.has(PermissionFlagsBits.Administrator) && 
            interaction.guild?.ownerId !== userId &&
            !ownerConfig.isOwner(userId)) {
            return {
                blocked: true,
                embed: createErrorEmbed('This command requires Administrator permission.'),
                reason: 'NOT_ADMIN'
            };
        }
    }
    
    // 4. NSFW check
    if (accessType === AccessType.NSFW || options.nsfw) {
        if (!channel?.nsfw) {
            return {
                blocked: true,
                embed: createErrorEmbed('This command can only be used in NSFW channels.'),
                reason: 'NOT_NSFW'
            };
        }
    }
    
    // 5. DJ check (for music)
    if (accessType === AccessType.DJ) {
        const djCheck = await checkDJAccess(interaction, options.djRole);
        if (!djCheck.allowed) {
            return {
                blocked: true,
                embed: createErrorEmbed(djCheck.reason || 'You need DJ permissions for this action.'),
                reason: 'NOT_DJ'
            };
        }
    }
    
    // 6. Custom permission check
    if (options.permissions && options.permissions.length > 0) {
        const missing = options.permissions.filter(perm => !member?.permissions?.has(perm));
        if (missing.length > 0) {
            return {
                blocked: true,
                embed: createErrorEmbed(`Missing permissions: ${missing.join(', ')}`),
                reason: 'MISSING_PERMISSIONS'
            };
        }
    }
    
    return { blocked: false };
}

/**
 * Check DJ access for music commands
 */
async function checkDJAccess(interaction, djRoleId = null) {
    const member = interaction.member;
    const userId = interaction.user.id;
    
    // Bot owners always have DJ access
    if (ownerConfig.isOwner(userId)) {
        return { allowed: true };
    }
    
    // Server admins have DJ access
    if (member?.permissions?.has(PermissionFlagsBits.Administrator)) {
        return { allowed: true };
    }
    
    // Check DJ role if configured
    if (djRoleId && member?.roles?.cache?.has(djRoleId)) {
        return { allowed: true };
    }
    
    // Check for "DJ" named role
    if (member?.roles?.cache?.some(role => role.name.toLowerCase() === 'dj')) {
        return { allowed: true };
    }
    
    return { allowed: false, reason: 'DJ role required for this action.' };
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if user has required permissions
 */
function hasPermissions(member, permissions) {
    if (!member || !permissions || permissions.length === 0) return true;
    return permissions.every(perm => member.permissions.has(perm));
}

/**
 * Check if user is server admin
 */
function isServerAdmin(member) {
    if (!member) return false;
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if user is server owner
 */
function isServerOwner(member) {
    if (!member) return false;
    return member.id === member.guild.ownerId;
}

/**
 * Check if user is bot owner
 */
function isBotOwner(userId) {
    return ownerConfig.isOwner(userId);
}

/**
 * Check if user can moderate target
 */
function canModerate(moderator, target) {
    if (isBotOwner(moderator.id)) {
        return { allowed: true };
    }

    if (target.id === target.guild.ownerId) {
        return { allowed: false, reason: 'Cannot moderate the server owner.' };
    }

    if (moderator.id === target.id) {
        return { allowed: false, reason: 'You cannot moderate yourself.' };
    }

    if (moderator.roles.highest.position <= target.roles.highest.position && 
        moderator.id !== moderator.guild.ownerId) {
        return { allowed: false, reason: 'You cannot moderate someone with equal or higher role.' };
    }

    return { allowed: true };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setDescription(`${EMOJIS.ERROR} ${message}`);
}

/**
 * Create warning embed
 */
function createWarningEmbed(message) {
    return new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(`${EMOJIS.WARNING} ${message}`);
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Backward compatible checkAccess for modules
 * @deprecated Use checkAccess with AccessType instead
 */
async function checkSubAccess(interaction) {
    return checkAccess(interaction, AccessType.SUB);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Access types
    AccessType,
    
    // Main functions
    checkAccess,
    checkMaintenance,
    checkDJAccess,
    
    // Permission checks
    hasPermissions,
    isServerAdmin,
    isServerOwner,
    isBotOwner,
    canModerate,
    
    // Helpers
    createErrorEmbed,
    createWarningEmbed,
    
    // Legacy
    checkSubAccess,
};
