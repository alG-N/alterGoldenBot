"use strict";
/**
 * Snipe Service
 * Tracks deleted messages for the /snipe command
 * SHARD-SAFE: Uses Redis via CacheService for cross-shard message tracking
 * @module services/moderation/SnipeService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
exports.shutdown = shutdown;
exports.getDeletedMessages = getDeletedMessages;
exports.getMessage = getMessage;
exports.clearMessages = clearMessages;
exports.getStats = getStats;
const GuildSettingsService_js_1 = __importDefault(require("../guild/GuildSettingsService.js"));
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// Constants
const SNIPE_NAMESPACE = 'snipe';
const MAX_MESSAGES_PER_GUILD = 25;
const MAX_CONTENT_LENGTH = 2000;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;
const MESSAGE_EXPIRY_SECONDS = 12 * 60 * 60; // 12 hours in seconds
// Helper functions
const getSnipeKey = (guildId) => `messages:${guildId}`;
let isInitialized = false;
// INITIALIZATION
/**
 * Initialize the snipe service with the Discord client
 * SHARD-SAFE: Uses Redis for storage, TTL handles expiration automatically
 */
function initialize(client) {
    if (isInitialized) {
        console.log('⚠️ Snipe service already initialized, skipping...');
        return;
    }
    client.on('messageDelete', async (message) => {
        if (message.author?.bot)
            return;
        if (!message.content && message.attachments.size === 0 && message.embeds.length === 0)
            return;
        if (!message.guild)
            return;
        try {
            await trackDeletedMessage(message);
        }
        catch (error) {
            console.error('[SnipeService] Error tracking deleted message:', error);
        }
    });
    client.on('messageDeleteBulk', async (messages) => {
        for (const message of messages.values()) {
            if (message.author?.bot)
                continue;
            if (!message.content && message.attachments.size === 0)
                continue;
            if (!message.guild)
                continue;
            try {
                await trackDeletedMessage(message);
            }
            catch (error) {
                console.error('[SnipeService] Error tracking bulk deleted message:', error);
            }
        }
    });
    // No cleanup interval needed - Redis TTL handles expiration
    isInitialized = true;
    console.log('✅ Snipe service initialized (shard-safe with Redis)');
}
/**
 * Shutdown the snipe service
 */
function shutdown() {
    // No local state to clean up - Redis handles everything
    isInitialized = false;
    console.log('✅ Snipe service shutdown');
}
// MESSAGE TRACKING
/**
 * Track a deleted message
 * SHARD-SAFE: Stores in Redis with automatic TTL expiration
 */
async function trackDeletedMessage(message) {
    const guildId = message.guild.id;
    const limit = await GuildSettingsService_js_1.default.getSnipeLimit(guildId);
    const cacheKey = getSnipeKey(guildId);
    // Get existing messages from Redis
    const existingMessages = await CacheService_js_1.default.get(SNIPE_NAMESPACE, cacheKey) || [];
    // Store attachment info
    const attachments = [];
    if (message.attachments.size > 0) {
        let count = 0;
        for (const [, attachment] of message.attachments) {
            if (count >= MAX_ATTACHMENTS_PER_MESSAGE)
                break;
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
    const trackedMessage = {
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
    // Add new message at the beginning
    existingMessages.unshift(trackedMessage);
    // Enforce limit
    const effectiveLimit = Math.min(limit, MAX_MESSAGES_PER_GUILD);
    if (existingMessages.length > effectiveLimit) {
        existingMessages.splice(effectiveLimit);
    }
    // Store back to Redis with TTL
    await CacheService_js_1.default.set(SNIPE_NAMESPACE, cacheKey, existingMessages, MESSAGE_EXPIRY_SECONDS);
}
// RETRIEVAL
/**
 * Get deleted messages for a guild
 * SHARD-SAFE: Reads from Redis
 */
async function getDeletedMessages(guildId, channelId) {
    const cacheKey = getSnipeKey(guildId);
    const messages = await CacheService_js_1.default.get(SNIPE_NAMESPACE, cacheKey) || [];
    if (channelId) {
        return messages.filter(m => m.channel.id === channelId);
    }
    return messages;
}
/**
 * Get a specific deleted message
 * SHARD-SAFE: Reads from Redis
 */
async function getMessage(guildId, index = 0, channelId) {
    const messages = await getDeletedMessages(guildId, channelId);
    return messages[index] || null;
}
/**
 * Clear deleted messages for a guild
 * SHARD-SAFE: Clears from Redis
 */
async function clearMessages(guildId, channelId) {
    const cacheKey = getSnipeKey(guildId);
    if (channelId) {
        const messages = await CacheService_js_1.default.get(SNIPE_NAMESPACE, cacheKey) || [];
        const before = messages.length;
        const filtered = messages.filter(m => m.channel.id !== channelId);
        if (filtered.length > 0) {
            await CacheService_js_1.default.set(SNIPE_NAMESPACE, cacheKey, filtered, MESSAGE_EXPIRY_SECONDS);
        }
        else {
            await CacheService_js_1.default.delete(SNIPE_NAMESPACE, cacheKey);
        }
        return before - filtered.length;
    }
    const messages = await CacheService_js_1.default.get(SNIPE_NAMESPACE, cacheKey) || [];
    const count = messages.length;
    await CacheService_js_1.default.delete(SNIPE_NAMESPACE, cacheKey);
    return count;
}
/**
 * Get cache statistics
 * Note: In shard-safe mode, this only returns stats for messages accessed by this shard
 */
async function getStats() {
    // In Redis mode, we can't easily count all guilds without SCAN
    // Return a placeholder - real stats should come from monitoring
    return { guilds: 0, totalMessages: 0 };
}
// EXPORTS
exports.default = {
    initialize,
    shutdown,
    getDeletedMessages,
    getMessage,
    clearMessages,
    getStats
};
//# sourceMappingURL=SnipeService.js.map