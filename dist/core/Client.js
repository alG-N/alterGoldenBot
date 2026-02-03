"use strict";
/**
 * alterGolden Discord Client Factory
 * Core client configuration and creation
 * @module core/Client
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityType = exports.CLIENT_OPTIONS = void 0;
exports.createClient = createClient;
exports.setPresence = setPresence;
exports.getClientStats = getClientStats;
const discord_js_1 = require("discord.js");
Object.defineProperty(exports, "ActivityType", { enumerable: true, get: function () { return discord_js_1.ActivityType; } });
// CLIENT CONFIGURATION
/**
 * Client configuration optimized for 1000+ servers
 */
exports.CLIENT_OPTIONS = {
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildPresences
    ],
    partials: [
        discord_js_1.Partials.Message,
        discord_js_1.Partials.Channel,
        discord_js_1.Partials.GuildMember,
        discord_js_1.Partials.User
    ],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false
    },
    // Sweep settings for memory optimization at scale
    sweepers: {
        messages: {
            interval: 300, // 5 minutes
            lifetime: 600 // 10 minutes
        },
        users: {
            interval: 3600, // 1 hour
            filter: () => (user) => user.bot && user.id !== user.client.user?.id
        }
    },
    // Disable caching for data we don't need
    makeCache: discord_js_1.Options.cacheWithLimits({
        MessageManager: 100,
        PresenceManager: 0,
        ReactionManager: 0,
        GuildBanManager: 0,
        GuildInviteManager: 0,
        GuildScheduledEventManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 100,
        ThreadMemberManager: 0,
    })
};
// CLIENT FUNCTIONS
/**
 * Creates and configures the Discord client
 * @returns Configured Discord client
 */
function createClient() {
    return new discord_js_1.Client(exports.CLIENT_OPTIONS);
}
/**
 * Sets the bot's presence
 * @param client - Discord client
 * @param status - Status (online, idle, dnd, invisible)
 * @param activityName - Activity name
 * @param activityType - Activity type
 */
function setPresence(client, status, activityName, activityType = discord_js_1.ActivityType.Playing) {
    if (!client.user)
        return;
    client.user.setPresence({
        status: status,
        activities: [{
                name: activityName,
                type: activityType
            }]
    });
}
/**
 * Get memory usage stats (useful for monitoring at scale)
 * @param client - Discord client
 * @returns Memory and cache statistics
 */
function getClientStats(client) {
    const used = process.memoryUsage();
    return {
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size,
        memory: {
            heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
            rss: Math.round(used.rss / 1024 / 1024) + ' MB'
        },
        uptime: Math.round((client.uptime || 0) / 1000) + 's'
    };
}
//# sourceMappingURL=Client.js.map