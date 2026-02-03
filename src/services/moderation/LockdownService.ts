/**
 * Lockdown Service
 * Channel and server lockdown functionality
 * @module services/moderation/LockdownService
 */

import { PermissionFlagsBits, ChannelType, type Guild, type TextChannel, type Snowflake } from 'discord.js';
// TYPES
interface SavedPermissions {
    allow: bigint;
    deny: bigint;
}

interface LockResult {
    success: boolean;
    error?: string;
    channelId: string;
    channelName: string;
}

interface ServerLockResult {
    success: LockResult[];
    failed: LockResult[];
    skipped: LockResult[];
    message?: string;
}
// LOCKDOWN SERVICE CLASS
class LockdownService {
    // guildId -> channelId -> { roleId: permissions }
    private savedPermissions: Map<Snowflake, Map<Snowflake, Record<Snowflake, SavedPermissions | null>>> = new Map();

    // guildId -> Set<channelId>
    private lockedChannels: Map<Snowflake, Set<Snowflake>> = new Map();

    /**
     * Lock a single channel
     */
    async lockChannel(channel: TextChannel, reason: string = 'Channel locked'): Promise<LockResult> {
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
        if (this.lockedChannels.get(guildId)!.has(channelId)) {
            return { success: false, error: 'Channel is already locked', channelId, channelName: channel.name };
        }

        try {
            const everyoneRole = channel.guild.roles.everyone;

            // Save current permissions
            const currentOverwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
            this.savedPermissions.get(guildId)!.set(channelId, {
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

            this.lockedChannels.get(guildId)!.add(channelId);

            return { success: true, channelId, channelName: channel.name };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
                channelId,
                channelName: channel.name
            };
        }
    }

    /**
     * Unlock a single channel
     */
    async unlockChannel(channel: TextChannel, reason: string = 'Channel unlocked'): Promise<LockResult> {
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
            this.lockedChannels.get(guildId)!.delete(channelId);
            this.savedPermissions.get(guildId)?.delete(channelId);

            return { success: true, channelId, channelName: channel.name };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
                channelId,
                channelName: channel.name
            };
        }
    }

    /**
     * Lock entire server (all text channels)
     */
    async lockServer(
        guild: Guild,
        reason: string = 'Server lockdown',
        excludeChannels: Snowflake[] = []
    ): Promise<ServerLockResult> {
        const textChannels = guild.channels.cache.filter(ch =>
            ch.type === ChannelType.GuildText &&
            !excludeChannels.includes(ch.id) &&
            ch.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.ManageChannels)
        );

        const results: ServerLockResult = {
            success: [],
            failed: [],
            skipped: []
        };

        for (const [channelId, channel] of textChannels) {
            if (this.lockedChannels.get(guild.id)?.has(channelId)) {
                results.skipped.push({ success: true, channelId, channelName: channel.name });
                continue;
            }

            const result = await this.lockChannel(channel as TextChannel, reason);

            if (result.success) {
                results.success.push(result);
            } else {
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
    async unlockServer(guild: Guild, reason: string = 'Server lockdown lifted'): Promise<ServerLockResult> {
        const lockedChannels = this.lockedChannels.get(guild.id);

        if (!lockedChannels || lockedChannels.size === 0) {
            return {
                success: [],
                failed: [],
                skipped: [],
                message: 'No locked channels found'
            };
        }

        const results: ServerLockResult = {
            success: [],
            failed: [],
            skipped: []
        };

        for (const channelId of lockedChannels) {
            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== ChannelType.GuildText) {
                results.skipped.push({ success: false, channelId, channelName: 'Unknown' });
                continue;
            }

            const result = await this.unlockChannel(channel as TextChannel, reason);

            if (result.success) {
                results.success.push(result);
            } else {
                results.failed.push(result);
            }

            await new Promise(r => setTimeout(r, 100));
        }

        return results;
    }

    /**
     * Check if a channel is locked
     */
    isChannelLocked(guildId: Snowflake, channelId: Snowflake): boolean {
        return this.lockedChannels.get(guildId)?.has(channelId) || false;
    }

    /**
     * Get locked channels for a guild
     */
    getLockedChannels(guildId: Snowflake): Snowflake[] {
        return [...(this.lockedChannels.get(guildId) || [])];
    }

    /**
     * Clear all lockdown data for a guild
     */
    clearGuildData(guildId: Snowflake): void {
        this.savedPermissions.delete(guildId);
        this.lockedChannels.delete(guildId);
    }
}

// Create singleton instance
const lockdownService = new LockdownService();

export { LockdownService };
export default lockdownService;
