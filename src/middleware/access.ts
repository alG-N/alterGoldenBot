/**
 * Access Middleware
 * Centralized access control, rate limiting, and validation
 */

import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import type { 
    GuildMember, 
    TextChannel, 
    VoiceBasedChannel,
    ChatInputCommandInteraction,
    ButtonInteraction
} from 'discord.js';
import { COLORS, EMOJIS } from '../constants';
import cacheService from '../cache/CacheService';
import { isBlockedHost } from './urlValidator';
// Types & Interfaces
interface RateLimiterOptions {
    cooldownSeconds?: number;
    maxConcurrent?: number;
}

interface DistributedRateLimiterOptions {
    name?: string;
    limit?: number;
    windowSeconds?: number;
    maxConcurrent?: number;
}

interface RateLimitCheckResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

interface ValidationResult {
    valid: boolean;
    error?: string;
    channel?: VoiceBasedChannel;
}

interface ModerateResult {
    allowed: boolean;
    reason?: string;
}

interface AccessCheckResult {
    blocked: boolean;
    embed?: EmbedBuilder;
}

interface MaintenanceCheckResult {
    inMaintenance: boolean;
    embed?: EmbedBuilder;
}

type AnyInteraction = ChatInputCommandInteraction | ButtonInteraction;
// Access Types
const AccessType = {
    PUBLIC: 'public',      // Anyone can use
    SUB: 'sub',           // Sub-bot (same as public for now)
    MAIN: 'main',         // Main bot only
    BOTH: 'both',         // Both bots
    ADMIN: 'admin',       // Server admins only
    OWNER: 'owner',       // Bot owners only
    DJ: 'dj',             // DJ role or admin
    NSFW: 'nsfw',         // NSFW channels only
} as const;

type AccessTypeValue = typeof AccessType[keyof typeof AccessType];
// Rate Limiter (Redis-backed via CacheService)
/**
 * Shard-safe rate limiter using CacheService (Redis with memory fallback)
 */
class RateLimiter {
    private active: Set<string>;
    private cooldownMs: number;
    private maxConcurrent: number;
    private name: string;

    constructor(options: RateLimiterOptions = {}) {
        this.active = new Set();
        this.cooldownMs = (options.cooldownSeconds || 30) * 1000;
        this.maxConcurrent = options.maxConcurrent || 5;
        this.name = 'ratelimiter';
    }

    /**
     * Check if user is on cooldown
     */
    async checkCooldown(userId: string): Promise<number> {
        const remaining = await cacheService.getCooldown(this.name, userId);
        if (remaining !== null && remaining > 0) {
            return Math.ceil(remaining / 1000);
        }
        return 0;
    }

    /**
     * Set cooldown for user
     */
    async setCooldown(userId: string, customMs?: number): Promise<void> {
        await cacheService.setCooldown(this.name, userId, customMs || this.cooldownMs);
    }

    /**
     * Clear cooldown for user
     */
    async clearCooldown(userId: string): Promise<void> {
        await cacheService.clearCooldown(this.name, userId);
    }

    /**
     * Check if concurrent limit reached
     */
    isAtLimit(): boolean {
        return this.active.size >= this.maxConcurrent;
    }

    /**
     * Add user to active set
     */
    addActive(userId: string): void {
        this.active.add(userId);
    }

    /**
     * Remove user from active set
     */
    removeActive(userId: string): void {
        this.active.delete(userId);
    }

    /**
     * Destroy rate limiter
     */
    destroy(): void {
        this.active.clear();
    }
}
// Distributed Rate Limiter (Redis)
/**
 * Distributed rate limiter using Redis
 */
class DistributedRateLimiter {
    private name: string;
    private limit: number;
    private windowSeconds: number;
    private maxConcurrent: number;
    private active: Set<string>;

    constructor(options: DistributedRateLimiterOptions = {}) {
        this.name = options.name || 'default';
        this.limit = options.limit || 5;
        this.windowSeconds = options.windowSeconds || 60;
        this.maxConcurrent = options.maxConcurrent || 5;
        this.active = new Set();
    }

    /**
     * Check if user is allowed
     */
    async check(userId: string): Promise<RateLimitCheckResult> {
        const key = `${this.name}:${userId}`;
        return cacheService.checkRateLimit(key, this.limit, this.windowSeconds);
    }

    /**
     * Check and consume a rate limit slot
     */
    async consume(userId: string): Promise<RateLimitCheckResult> {
        return this.check(userId);
    }

    /**
     * Get remaining seconds until rate limit resets
     */
    async getRemainingCooldown(userId: string): Promise<number> {
        const result = await this.check(userId);
        if (!result.allowed) {
            return Math.ceil(result.resetIn / 1000);
        }
        return 0;
    }

    /**
     * Check if concurrent limit reached
     */
    isAtLimit(): boolean {
        return this.active.size >= this.maxConcurrent;
    }

    /**
     * Add user to active set
     */
    addActive(userId: string): void {
        this.active.add(userId);
    }

    /**
     * Remove user from active set
     */
    removeActive(userId: string): void {
        this.active.delete(userId);
    }

    /**
     * Destroy rate limiter
     */
    destroy(): void {
        this.active.clear();
    }
}
// Permission Checks
/**
 * Check if user has required permissions
 */
function hasPermissions(member: GuildMember | null, permissions: bigint[]): boolean {
    if (!member || !permissions || permissions.length === 0) return true;
    return permissions.every(perm => member.permissions.has(perm));
}

/**
 * Check if user is server admin
 */
function isServerAdmin(member: GuildMember | null): boolean {
    if (!member) return false;
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if user is server owner
 */
function isServerOwner(member: GuildMember | null): boolean {
    if (!member) return false;
    return member.id === member.guild.ownerId;
}

/**
 * Check if user can moderate target
 */
function canModerate(moderator: GuildMember, target: GuildMember): ModerateResult {
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
function botCanModerate(botMember: GuildMember, target: GuildMember): ModerateResult {
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
// Voice Channel Checks
/**
 * Check if user is in voice channel
 */
function checkVoiceChannel(member: GuildMember | null): ValidationResult {
    const voiceChannel = member?.voice?.channel;
    
    if (!voiceChannel) {
        return { valid: false, error: 'Join a voice channel first.' };
    }
    
    return { valid: true, channel: voiceChannel };
}

/**
 * Check if user is in same voice channel as bot
 */
function checkSameVoiceChannel(member: GuildMember | null, botChannelId: string | null): ValidationResult {
    if (!botChannelId) {
        return { valid: true };
    }

    const memberChannelId = member?.voice?.channel?.id;
    if (memberChannelId !== botChannelId) {
        return { 
            valid: false, 
            error: 'You must be in the same voice channel as the bot.' 
        };
    }

    return { valid: true };
}

/**
 * Check voice permissions
 */
function checkVoicePermissions(voiceChannel: VoiceBasedChannel | null): ValidationResult {
    if (!voiceChannel) {
        return { valid: false, error: 'Invalid voice channel.' };
    }

    const permissions = voiceChannel.permissionsFor(voiceChannel.guild.members.me!);
    
    if (!permissions?.has(PermissionFlagsBits.Connect)) {
        return { valid: false, error: 'I don\'t have permission to connect to this channel.' };
    }

    if (!permissions?.has(PermissionFlagsBits.Speak)) {
        return { valid: false, error: 'I don\'t have permission to speak in this channel.' };
    }

    return { valid: true };
}
// URL Validation
/**
 * Validate URL for video downloads
 */
function validateVideoUrl(url: string): ValidationResult {
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
        if (isBlockedHost(parsedUrl.hostname)) {
            return { valid: false, error: 'This URL is not allowed for security reasons.' };
        }
        
        // Block URLs with credentials
        if (parsedUrl.username || parsedUrl.password) {
            return { valid: false, error: 'URLs with credentials are not allowed.' };
        }

    } catch (error) {
        return { valid: false, error: 'Invalid URL format.' };
    }

    return { valid: true };
}
// NSFW Check
/**
 * Check if channel is NSFW
 */
function checkNSFW(channel: TextChannel | null): ValidationResult {
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
function createErrorEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle(`${(EMOJIS as any)?.ERROR || '❌'} ${title}`)
        .setDescription(description);
}

/**
 * Create warning embed
 */
function createWarningEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle(`${(EMOJIS as any)?.WARNING || '⚠️'} ${title}`)
        .setDescription(description);
}

/**
 * Create success embed
 */
function createSuccessEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(`${(EMOJIS as any)?.SUCCESS || '✅'} ${title}`)
        .setDescription(description);
}

/**
 * Create info embed
 */
function createInfoEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor((COLORS as any).INFO || COLORS.PRIMARY)
        .setTitle(`${(EMOJIS as any)?.INFO || 'ℹ️'} ${title}`)
        .setDescription(description);
}

/**
 * Create cooldown embed
 */
function createCooldownEmbed(remainingSeconds: number): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('⏳ Cooldown Active')
        .setDescription(`Please wait **${remainingSeconds} seconds** before using this command again.`)
        .setFooter({ text: 'This helps prevent server overload' });
}
// Access Control
/**
 * Check access for a command
 */
async function checkAccess(interaction: AnyInteraction, accessType: AccessTypeValue): Promise<AccessCheckResult> {
    const member = interaction.member as GuildMember;
    
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
        const channel = interaction.channel as TextChannel;
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
function checkMaintenance(): MaintenanceCheckResult {
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
// Exports
export {
    // Types
    AccessType,
    
    // Rate Limiting
    RateLimiter,
    DistributedRateLimiter,
    
    // Permission Checks
    hasPermissions,
    isServerAdmin,
    isServerOwner,
    canModerate,
    botCanModerate,
    validators,
    
    // Voice Checks
    checkVoiceChannel,
    checkSameVoiceChannel,
    checkVoicePermissions,
    
    // URL Validation
    validateVideoUrl,
    
    // NSFW
    checkNSFW,
    
    // Access Control
    checkAccess,
    checkMaintenance,
    
    // Embed Helpers
    createErrorEmbed,
    createWarningEmbed,
    createSuccessEmbed,
    createInfoEmbed,
    createCooldownEmbed
};

export type {
    RateLimiterOptions,
    DistributedRateLimiterOptions,
    RateLimitCheckResult,
    ValidationResult,
    ModerateResult,
    AccessCheckResult,
    MaintenanceCheckResult,
    AccessTypeValue,
    AnyInteraction
};

export default {
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
