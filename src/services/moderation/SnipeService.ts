/**
 * Snipe Service
 * Tracks deleted messages for the /snipe command
 * @module services/moderation/SnipeService
 */

import type { Client, Message, Snowflake } from 'discord.js';
import GuildSettingsService from '../guild/GuildSettingsService.js';
// TYPES
interface TrackedAttachment {
    url: string;
    proxyUrl: string;
    name: string;
    type: string | null;
    size: number;
}

interface TrackedEmbed {
    title?: string;
    description?: string;
    url?: string;
}

interface TrackedAuthor {
    id: string;
    tag: string;
    displayName: string;
    avatarURL: string | null;
}

interface TrackedChannel {
    id: string;
    name: string;
}

interface TrackedMessage {
    id: string;
    content: string;
    author: TrackedAuthor;
    channel: TrackedChannel;
    attachments: TrackedAttachment[];
    embeds: TrackedEmbed[];
    createdAt: number;
    deletedAt: number;
}
// CACHE
const deletedMessages: Map<Snowflake, TrackedMessage[]> = new Map();

// Memory limits
const MAX_GUILDS_CACHED = 500;
const MAX_MESSAGES_PER_GUILD = 25;
const MAX_CONTENT_LENGTH = 2000;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;
const MESSAGE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

let isInitialized = false;
let cleanupIntervalId: NodeJS.Timeout | null = null;
// INITIALIZATION
/**
 * Initialize the snipe service with the Discord client
 */
export function initialize(client: Client): void {
    if (isInitialized) {
        console.log('⚠️ Snipe service already initialized, skipping...');
        return;
    }

    client.on('messageDelete', async (message) => {
        if (message.author?.bot) return;
        if (!message.content && message.attachments.size === 0 && message.embeds.length === 0) return;
        if (!message.guild) return;

        try {
            await trackDeletedMessage(message as Message);
        } catch (error) {
            console.error('[SnipeService] Error tracking deleted message:', error);
        }
    });

    client.on('messageDeleteBulk', async (messages) => {
        for (const message of messages.values()) {
            if (message.author?.bot) continue;
            if (!message.content && message.attachments.size === 0) continue;
            if (!message.guild) continue;

            try {
                await trackDeletedMessage(message as Message);
            } catch (error) {
                console.error('[SnipeService] Error tracking bulk deleted message:', error);
            }
        }
    });

    cleanupIntervalId = setInterval(cleanupOldMessages, 10 * 60 * 1000);

    isInitialized = true;
    console.log('✅ Snipe service initialized');
}

/**
 * Shutdown the snipe service
 */
export function shutdown(): void {
    if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
    }
    deletedMessages.clear();
    isInitialized = false;
    console.log('✅ Snipe service shutdown');
}

/**
 * Cleanup old messages to prevent memory leaks
 */
function cleanupOldMessages(): void {
    const now = Date.now();
    let totalCleaned = 0;

    for (const [guildId, messages] of deletedMessages) {
        const validMessages = messages.filter(m => (now - m.deletedAt) < MESSAGE_EXPIRY_MS);

        if (validMessages.length === 0) {
            deletedMessages.delete(guildId);
            totalCleaned += messages.length;
        } else if (validMessages.length !== messages.length) {
            totalCleaned += messages.length - validMessages.length;
            deletedMessages.set(guildId, validMessages);
        }
    }

    if (deletedMessages.size > MAX_GUILDS_CACHED) {
        const guildsToRemove = deletedMessages.size - MAX_GUILDS_CACHED;
        const keys = [...deletedMessages.keys()];
        for (let i = 0; i < guildsToRemove; i++) {
            deletedMessages.delete(keys[i]);
        }
        console.log(`[SnipeService] Removed ${guildsToRemove} old guild caches`);
    }

    if (totalCleaned > 0) {
        console.log(`[SnipeService] Cleaned ${totalCleaned} expired messages`);
    }
}
// MESSAGE TRACKING
/**
 * Track a deleted message
 */
async function trackDeletedMessage(message: Message): Promise<void> {
    const guildId = message.guild!.id;
    const limit = await GuildSettingsService.getSnipeLimit(guildId);

    if (!deletedMessages.has(guildId)) {
        deletedMessages.set(guildId, []);
    }

    const guildCache = deletedMessages.get(guildId)!;

    // Store attachment info
    const attachments: TrackedAttachment[] = [];
    if (message.attachments.size > 0) {
        let count = 0;
        for (const [, attachment] of message.attachments) {
            if (count >= MAX_ATTACHMENTS_PER_MESSAGE) break;
            attachments.push({
                url: attachment.url,
                proxyUrl: attachment.proxyURL,
                name: attachment.name?.substring(0, 100) || 'unknown',
                type: attachment.contentType,
                size: attachment.size
            });
            count++;
        }
    }

    const truncatedContent = message.content
        ? message.content.substring(0, MAX_CONTENT_LENGTH)
        : '';

    const trackedMessage: TrackedMessage = {
        id: message.id,
        content: truncatedContent,
        author: {
            id: message.author?.id || 'Unknown',
            tag: message.author?.tag || 'Unknown User',
            displayName: (message.member?.displayName || message.author?.username || 'Unknown').substring(0, 50),
            avatarURL: message.author?.displayAvatarURL?.({ size: 64 }) || null
        },
        channel: {
            id: message.channel.id,
            name: ('name' in message.channel ? message.channel.name : 'unknown')?.substring(0, 50) || 'unknown'
        },
        attachments,
        embeds: message.embeds.length > 0 ? message.embeds.slice(0, 3).map(e => ({
            title: e.title?.substring(0, 100),
            description: e.description?.substring(0, 200),
            url: e.url || undefined
        })) : [],
        createdAt: message.createdTimestamp,
        deletedAt: Date.now()
    };

    guildCache.unshift(trackedMessage);

    const effectiveLimit = Math.min(limit, MAX_MESSAGES_PER_GUILD);
    if (guildCache.length > effectiveLimit) {
        guildCache.splice(effectiveLimit);
    }
}
// RETRIEVAL
/**
 * Get deleted messages for a guild
 */
export function getDeletedMessages(guildId: Snowflake, channelId?: Snowflake): TrackedMessage[] {
    const messages = deletedMessages.get(guildId) || [];

    if (channelId) {
        return messages.filter(m => m.channel.id === channelId);
    }

    return messages;
}

/**
 * Get a specific deleted message
 */
export function getMessage(guildId: Snowflake, index: number = 0, channelId?: Snowflake): TrackedMessage | null {
    const messages = getDeletedMessages(guildId, channelId);
    return messages[index] || null;
}

/**
 * Clear deleted messages for a guild
 */
export function clearMessages(guildId: Snowflake, channelId?: Snowflake): number {
    if (channelId) {
        const messages = deletedMessages.get(guildId);
        if (!messages) return 0;

        const before = messages.length;
        const filtered = messages.filter(m => m.channel.id !== channelId);
        deletedMessages.set(guildId, filtered);
        return before - filtered.length;
    }

    const count = deletedMessages.get(guildId)?.length || 0;
    deletedMessages.delete(guildId);
    return count;
}

/**
 * Get cache statistics
 */
export function getStats(): { guilds: number; totalMessages: number } {
    let totalMessages = 0;
    for (const messages of deletedMessages.values()) {
        totalMessages += messages.length;
    }
    return { guilds: deletedMessages.size, totalMessages };
}
// EXPORTS
export default {
    initialize,
    shutdown,
    getDeletedMessages,
    getMessage,
    clearMessages,
    getStats
};

export type { TrackedMessage, TrackedAttachment, TrackedEmbed };
