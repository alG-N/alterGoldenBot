"use strict";
/**
 * Lockdown Service
 * Channel and server lockdown functionality
 * @module services/moderation/LockdownService
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockdownService = void 0;
const discord_js_1 = require("discord.js");
// LOCKDOWN SERVICE CLASS
class LockdownService {
    // guildId -> channelId -> { roleId: permissions }
    savedPermissions = new Map();
    // guildId -> Set<channelId>
    lockedChannels = new Map();
    /**
     * Lock a single channel
     */
    async lockChannel(channel, reason = 'Channel locked') {
        const guildId = channel.guild.id;
        const channelId = channel.id;
        // Initialize storage
        if (!this.savedPermissions.has(guildId)) {
            this.savedPermissions.set(guildId, new Map());
        }
        if (!this.lockedChannels.has(guildId)) {
            this.lockedChannels.set(guildId, new Set());
        }
        // Check if already locked
        if (this.lockedChannels.get(guildId).has(channelId)) {
            return { success: false, error: 'Channel is already locked', channelId, channelName: channel.name };
        }
        try {
            const everyoneRole = channel.guild.roles.everyone;
            // Save current permissions
            const currentOverwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
            this.savedPermissions.get(guildId).set(channelId, {
                [everyoneRole.id]: currentOverwrite ? {
                    allow: currentOverwrite.allow.bitfield,
                    deny: currentOverwrite.deny.bitfield
                } : null
            });
            // Lock channel
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
                AddReactions: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
                SendMessagesInThreads: false
            }, { reason });
            this.lockedChannels.get(guildId).add(channelId);
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
     */
    async unlockChannel(channel, reason = 'Channel unlocked') {
        const guildId = channel.guild.id;
        const channelId = channel.id;
        // Check if locked
        if (!this.lockedChannels.get(guildId)?.has(channelId)) {
            return { success: false, error: 'Channel is not locked', channelId, channelName: channel.name };
        }
        try {
            const everyoneRole = channel.guild.roles.everyone;
            // Restore permissions
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null,
                AddReactions: null,
                CreatePublicThreads: null,
                CreatePrivateThreads: null,
                SendMessagesInThreads: null
            }, { reason });
            // Cleanup
            this.lockedChannels.get(guildId).delete(channelId);
            this.savedPermissions.get(guildId)?.delete(channelId);
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
            if (this.lockedChannels.get(guild.id)?.has(channelId)) {
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
     */
    async unlockServer(guild, reason = 'Server lockdown lifted') {
        const lockedChannels = this.lockedChannels.get(guild.id);
        if (!lockedChannels || lockedChannels.size === 0) {
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
        for (const channelId of lockedChannels) {
            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
                results.skipped.push({ success: false, channelId, channelName: 'Unknown' });
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
     */
    isChannelLocked(guildId, channelId) {
        return this.lockedChannels.get(guildId)?.has(channelId) || false;
    }
    /**
     * Get locked channels for a guild
     */
    getLockedChannels(guildId) {
        return [...(this.lockedChannels.get(guildId) || [])];
    }
    /**
     * Clear all lockdown data for a guild
     */
    clearGuildData(guildId) {
        this.savedPermissions.delete(guildId);
        this.lockedChannels.delete(guildId);
    }
}
exports.LockdownService = LockdownService;
// Create singleton instance
const lockdownService = new LockdownService();
exports.default = lockdownService;
//# sourceMappingURL=LockdownService.js.map