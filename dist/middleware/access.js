"use strict";
/**
 * Access Middleware
 * Centralized access control, rate limiting, and validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = exports.DistributedRateLimiter = exports.RateLimiter = exports.AccessType = void 0;
exports.hasPermissions = hasPermissions;
exports.isServerAdmin = isServerAdmin;
exports.isServerOwner = isServerOwner;
exports.canModerate = canModerate;
exports.botCanModerate = botCanModerate;
exports.validateVideoUrl = validateVideoUrl;
exports.checkNSFW = checkNSFW;
exports.checkAccess = checkAccess;
exports.checkMaintenance = checkMaintenance;
exports.createErrorEmbed = createErrorEmbed;
exports.createWarningEmbed = createWarningEmbed;
exports.createSuccessEmbed = createSuccessEmbed;
exports.createInfoEmbed = createInfoEmbed;
exports.createCooldownEmbed = createCooldownEmbed;
const discord_js_1 = require("discord.js");
const constants_js_1 = require("../constants.js");
const CacheService_js_1 = __importDefault(require("../cache/CacheService.js"));
const urlValidator_js_1 = require("./urlValidator.js");
// Access Types
const AccessType = {
    PUBLIC: 'public', // Anyone can use
    SUB: 'sub', // Sub-bot (same as public for now)
    MAIN: 'main', // Main bot only
    BOTH: 'both', // Both bots
    ADMIN: 'admin', // Server admins only
    OWNER: 'owner', // Bot owners only
    DJ: 'dj', // DJ role or admin
    NSFW: 'nsfw', // NSFW channels only
};
exports.AccessType = AccessType;
// Rate Limiter (Redis-backed via CacheService)
/**
 * Shard-safe rate limiter using CacheService (Redis with memory fallback)
 */
class RateLimiter {
    active;
    cooldownMs;
    maxConcurrent;
    name;
    constructor(options = {}) {
        this.active = new Set();
        this.cooldownMs = (options.cooldownSeconds || 30) * 1000;
        this.maxConcurrent = options.maxConcurrent || 5;
        this.name = 'ratelimiter';
    }
    /**
     * Check if user is on cooldown
     */
    async checkCooldown(userId) {
        const remaining = await CacheService_js_1.default.getCooldown(this.name, userId);
        if (remaining !== null && remaining > 0) {
            return Math.ceil(remaining / 1000);
        }
        return 0;
    }
    /**
     * Set cooldown for user
     */
    async setCooldown(userId, customMs) {
        await CacheService_js_1.default.setCooldown(this.name, userId, customMs || this.cooldownMs);
    }
    /**
     * Clear cooldown for user
     */
    async clearCooldown(userId) {
        await CacheService_js_1.default.clearCooldown(this.name, userId);
    }
    /**
     * Check if concurrent limit reached
     */
    isAtLimit() {
        return this.active.size >= this.maxConcurrent;
    }
    /**
     * Add user to active set
     */
    addActive(userId) {
        this.active.add(userId);
    }
    /**
     * Remove user from active set
     */
    removeActive(userId) {
        this.active.delete(userId);
    }
    /**
     * Destroy rate limiter
     */
    destroy() {
        this.active.clear();
    }
}
exports.RateLimiter = RateLimiter;
// Distributed Rate Limiter (Redis)
/**
 * Distributed rate limiter using Redis
 */
class DistributedRateLimiter {
    name;
    limit;
    windowSeconds;
    maxConcurrent;
    active;
    constructor(options = {}) {
        this.name = options.name || 'default';
        this.limit = options.limit || 5;
        this.windowSeconds = options.windowSeconds || 60;
        this.maxConcurrent = options.maxConcurrent || 5;
        this.active = new Set();
    }
    /**
     * Check if user is allowed
     */
    async check(userId) {
        const key = `${this.name}:${userId}`;
        return CacheService_js_1.default.checkRateLimit(key, this.limit, this.windowSeconds);
    }
    /**
     * Check and consume a rate limit slot
     */
    async consume(userId) {
        return this.check(userId);
    }
    /**
     * Get remaining seconds until rate limit resets
     */
    async getRemainingCooldown(userId) {
        const result = await this.check(userId);
        if (!result.allowed) {
            return Math.ceil(result.resetIn / 1000);
        }
        return 0;
    }
    /**
     * Check if concurrent limit reached
     */
    isAtLimit() {
        return this.active.size >= this.maxConcurrent;
    }
    /**
     * Add user to active set
     */
    addActive(userId) {
        this.active.add(userId);
    }
    /**
     * Remove user from active set
     */
    removeActive(userId) {
        this.active.delete(userId);
    }
    /**
     * Destroy rate limiter
     */
    destroy() {
        this.active.clear();
    }
}
exports.DistributedRateLimiter = DistributedRateLimiter;
// Permission Checks
/**
 * Check if user has required permissions
 */
function hasPermissions(member, permissions) {
    if (!member || !permissions || permissions.length === 0)
        return true;
    return permissions.every(perm => member.permissions.has(perm));
}
/**
 * Check if user is server admin
 */
function isServerAdmin(member) {
    if (!member)
        return false;
    return member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
}
/**
 * Check if user is server owner
 */
function isServerOwner(member) {
    if (!member)
        return false;
    return member.id === member.guild.ownerId;
}
/**
 * Check if user can moderate target
 */
function canModerate(moderator, target) {
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
// URL Validation
/**
 * Validate URL for video downloads
 */
function validateVideoUrl(url) {
    // Basic protocol check
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return { valid: false, error: 'URL must start with http:// or https://' };
    }
    // Try to parse URL
    try {
        const parsedUrl = new URL(url);
        // Block non-http protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return { valid: false, error: 'Only HTTP/HTTPS URLs are supported.' };
        }
        // SSRF Protection
        if ((0, urlValidator_js_1.isBlockedHost)(parsedUrl.hostname)) {
            return { valid: false, error: 'This URL is not allowed for security reasons.' };
        }
        // Block URLs with credentials
        if (parsedUrl.username || parsedUrl.password) {
            return { valid: false, error: 'URLs with credentials are not allowed.' };
        }
    }
    catch (error) {
        return { valid: false, error: 'Invalid URL format.' };
    }
    return { valid: true };
}
// NSFW Check
/**
 * Check if channel is NSFW
 */
function checkNSFW(channel) {
    if (!channel?.nsfw) {
        return {
            valid: false,
            error: 'This command can only be used in NSFW channels.'
        };
    }
    return { valid: true };
}
// Embed Helpers
/**
 * Create error embed
 */
function createErrorEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(constants_js_1.COLORS.ERROR)
        .setTitle(`${constants_js_1.EMOJIS?.ERROR || '❌'} ${title}`)
        .setDescription(description);
}
/**
 * Create warning embed
 */
function createWarningEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(constants_js_1.COLORS.WARNING)
        .setTitle(`${constants_js_1.EMOJIS?.WARNING || '⚠️'} ${title}`)
        .setDescription(description);
}
/**
 * Create success embed
 */
function createSuccessEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(constants_js_1.COLORS.SUCCESS)
        .setTitle(`${constants_js_1.EMOJIS?.SUCCESS || '✅'} ${title}`)
        .setDescription(description);
}
/**
 * Create info embed
 */
function createInfoEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(constants_js_1.COLORS.INFO || constants_js_1.COLORS.PRIMARY)
        .setTitle(`${constants_js_1.EMOJIS?.INFO || 'ℹ️'} ${title}`)
        .setDescription(description);
}
/**
 * Create cooldown embed
 */
function createCooldownEmbed(remainingSeconds) {
    return new discord_js_1.EmbedBuilder()
        .setColor(constants_js_1.COLORS.WARNING)
        .setTitle('⏳ Cooldown Active')
        .setDescription(`Please wait **${remainingSeconds} seconds** before using this command again.`)
        .setFooter({ text: 'This helps prevent server overload' });
}
// Access Control
/**
 * Check access for a command
 */
async function checkAccess(interaction, accessType) {
    const member = interaction.member;
    // PUBLIC and SUB are always allowed
    if (accessType === AccessType.PUBLIC || accessType === AccessType.SUB || accessType === AccessType.BOTH) {
        return { blocked: false };
    }
    // MAIN bot only
    if (accessType === AccessType.MAIN) {
        return { blocked: false };
    }
    // ADMIN check
    if (accessType === AccessType.ADMIN) {
        if (!isServerAdmin(member)) {
            return {
                blocked: true,
                embed: createErrorEmbed('Permission Denied', 'You need administrator permissions to use this command.')
            };
        }
        return { blocked: false };
    }
    // OWNER check
    if (accessType === AccessType.OWNER) {
        const ownerId = process.env.OWNER_ID;
        if (interaction.user.id !== ownerId) {
            return {
                blocked: true,
                embed: createErrorEmbed('Owner Only', 'This command is restricted to the bot owner.')
            };
        }
        return { blocked: false };
    }
    // DJ check
    if (accessType === AccessType.DJ) {
        if (!isServerAdmin(member)) {
            const djRole = member.roles.cache.find(r => r.name.toLowerCase() === 'dj');
            if (!djRole) {
                return {
                    blocked: true,
                    embed: createErrorEmbed('DJ Only', 'You need the DJ role or admin permissions.')
                };
            }
        }
        return { blocked: false };
    }
    // NSFW check
    if (accessType === AccessType.NSFW) {
        const channel = interaction.channel;
        if (!channel?.nsfw) {
            return {
                blocked: true,
                embed: createErrorEmbed('NSFW Only', 'This command can only be used in NSFW channels.')
            };
        }
        return { blocked: false };
    }
    return { blocked: false };
}
/**
 * Check if bot is in maintenance mode
 */
function checkMaintenance() {
    const inMaintenance = process.env.MAINTENANCE_MODE === 'true';
    if (inMaintenance) {
        return {
            inMaintenance: true,
            embed: createWarningEmbed('Maintenance Mode', 'The bot is currently undergoing maintenance. Please try again later.')
        };
    }
    return { inMaintenance: false };
}
// Validators Object
const validators = {
    hasPermissions,
    isServerAdmin,
    isServerOwner,
    canModerate,
    botCanModerate
};
exports.validators = validators;
exports.default = {
    AccessType,
    RateLimiter,
    DistributedRateLimiter,
    validators,
    checkMaintenance,
    checkNSFW,
    checkAccess,
    createErrorEmbed,
    createWarningEmbed,
    createSuccessEmbed,
    createInfoEmbed,
    createCooldownEmbed
};
//# sourceMappingURL=access.js.map