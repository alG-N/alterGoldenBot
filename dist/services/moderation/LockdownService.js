"use strict";
/**
 * Lockdown Service
 * Channel and server lockdown functionality
 * SHARD-SAFE: Uses Redis via CacheService for state persistence
 * @module services/moderation/LockdownService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockdownService = void 0;
const discord_js_1 = require("discord.js");
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// Redis key helpers
const LOCKDOWN_NAMESPACE = 'lockdown';
const getLockdownKey = (guildId, channelId) => `${guildId}:${channelId}`;
// LOCKDOWN SERVICE CLASS
class LockdownService {
    /**
     * Lock a single channel
     * SHARD-SAFE: Stores state in Redis
     */
    async lockChannel(channel, reason = 'Channel locked') {
        const guildId = channel.guild.id;
        const channelId = channel.id;
        const cacheKey = getLockdownKey(guildId, channelId);
        // Check if already locked (from Redis)
        const existingState = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, cacheKey);
        if (existingState?.locked) {
            return { success: false, error: 'Channel is already locked', channelId, channelName: channel.name };
        }
        try {
            const everyoneRole = channel.guild.roles.everyone;
            // Save current permissions
            const currentOverwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
            const permissions = {
                [everyoneRole.id]: currentOverwrite ? {
                    allow: currentOverwrite.allow.bitfield.toString(),
                    deny: currentOverwrite.deny.bitfield.toString()
                } : null
            };
            // Lock channel
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
                AddReactions: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
                SendMessagesInThreads: false
            }, { reason });
            // Store state in Redis (24 hour TTL for safety)
            await CacheService_js_1.default.set(LOCKDOWN_NAMESPACE, cacheKey, {
                locked: true,
                permissions
            }, 86400);
            // Update the index of locked channels
            await this._addToIndex(guildId, channelId);
            return { success: true, channelId, channelName: channel.name };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                channelId,
                channelName: channel.name
            };
        }
    }
    /**
     * Unlock a single channel
     * SHARD-SAFE: Retrieves state from Redis
     */
    async unlockChannel(channel, reason = 'Channel unlocked') {
        const guildId = channel.guild.id;
        const channelId = channel.id;
        const cacheKey = getLockdownKey(guildId, channelId);
        // Check if locked (from Redis)
        const lockState = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, cacheKey);
        if (!lockState?.locked) {
            return { success: false, error: 'Channel is not locked', channelId, channelName: channel.name };
        }
        try {
            const everyoneRole = channel.guild.roles.everyone;
            // Restore permissions (reset to null = remove our overwrite)
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null,
                AddReactions: null,
                CreatePublicThreads: null,
                CreatePrivateThreads: null,
                SendMessagesInThreads: null
            }, { reason });
            // Remove from Redis
            await CacheService_js_1.default.delete(LOCKDOWN_NAMESPACE, cacheKey);
            // Update the index
            await this._removeFromIndex(guildId, channelId);
            return { success: true, channelId, channelName: channel.name };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                channelId,
                channelName: channel.name
            };
        }
    }
    /**
     * Lock entire server (all text channels)
     * SHARD-SAFE: Each channel lock is stored in Redis
     */
    async lockServer(guild, reason = 'Server lockdown', excludeChannels = []) {
        const textChannels = guild.channels.cache.filter(ch => ch.type === discord_js_1.ChannelType.GuildText &&
            !excludeChannels.includes(ch.id) &&
            ch.permissionsFor(guild.members.me)?.has(discord_js_1.PermissionFlagsBits.ManageChannels));
        const results = {
            success: [],
            failed: [],
            skipped: []
        };
        for (const [channelId, channel] of textChannels) {
            // Check if already locked via Redis
            const cacheKey = getLockdownKey(guild.id, channelId);
            const existingState = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, cacheKey);
            if (existingState?.locked) {
                results.skipped.push({ success: true, channelId, channelName: channel.name });
                continue;
            }
            const result = await this.lockChannel(channel, reason);
            if (result.success) {
                results.success.push(result);
            }
            else {
                results.failed.push(result);
            }
            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 100));
        }
        return results;
    }
    /**
     * Unlock entire server
     * SHARD-SAFE: Reads locked channels from Redis
     */
    async unlockServer(guild, reason = 'Server lockdown lifted') {
        // Get all locked channels for this guild from Redis
        const lockedChannelIds = await this.getLockedChannels(guild.id);
        if (lockedChannelIds.length === 0) {
            return {
                success: [],
                failed: [],
                skipped: [],
                message: 'No locked channels found'
            };
        }
        const results = {
            success: [],
            failed: [],
            skipped: []
        };
        for (const channelId of lockedChannelIds) {
            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
                results.skipped.push({ success: false, channelId, channelName: 'Unknown' });
                // Still try to clean up Redis entry
                await CacheService_js_1.default.delete(LOCKDOWN_NAMESPACE, getLockdownKey(guild.id, channelId));
                continue;
            }
            const result = await this.unlockChannel(channel, reason);
            if (result.success) {
                results.success.push(result);
            }
            else {
                results.failed.push(result);
            }
            await new Promise(r => setTimeout(r, 100));
        }
        return results;
    }
    /**
     * Check if a channel is locked
     * SHARD-SAFE: Checks Redis
     */
    async isChannelLocked(guildId, channelId) {
        const cacheKey = getLockdownKey(guildId, channelId);
        const state = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, cacheKey);
        return state?.locked || false;
    }
    /**
     * Get locked channels for a guild
     * SHARD-SAFE: Uses a separate index in Redis
     */
    async getLockedChannels(guildId) {
        const indexKey = `index:${guildId}`;
        const channelIds = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, indexKey);
        return channelIds || [];
    }
    /**
     * Add channel to the locked index
     * @private
     */
    async _addToIndex(guildId, channelId) {
        const indexKey = `index:${guildId}`;
        const current = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, indexKey) || [];
        if (!current.includes(channelId)) {
            current.push(channelId);
            await CacheService_js_1.default.set(LOCKDOWN_NAMESPACE, indexKey, current, 86400);
        }
    }
    /**
     * Remove channel from the locked index
     * @private
     */
    async _removeFromIndex(guildId, channelId) {
        const indexKey = `index:${guildId}`;
        const current = await CacheService_js_1.default.peek(LOCKDOWN_NAMESPACE, indexKey) || [];
        const filtered = current.filter(id => id !== channelId);
        if (filtered.length > 0) {
            await CacheService_js_1.default.set(LOCKDOWN_NAMESPACE, indexKey, filtered, 86400);
        }
        else {
            await CacheService_js_1.default.delete(LOCKDOWN_NAMESPACE, indexKey);
        }
    }
    /**
     * Clear all lockdown data for a guild
     * SHARD-SAFE: Clears from Redis
     */
    async clearGuildData(guildId) {
        try {
            // Get all locked channels for this guild
            const lockedChannelIds = await this.getLockedChannels(guildId);
            // Delete each channel's lockdown state
            for (const channelId of lockedChannelIds) {
                await CacheService_js_1.default.delete(LOCKDOWN_NAMESPACE, getLockdownKey(guildId, channelId));
            }
            // Delete the index
            await CacheService_js_1.default.delete(LOCKDOWN_NAMESPACE, `index:${guildId}`);
        }
        catch (error) {
            console.error('[LockdownService] Error clearing guild data:', error);
        }
    }
}
exports.LockdownService = LockdownService;
// Create singleton instance
const lockdownService = new LockdownService();
exports.default = lockdownService;
//# sourceMappingURL=LockdownService.js.map