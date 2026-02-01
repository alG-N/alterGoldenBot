/**
 * alterGolden Discord Client Factory
 * @module core/Client
 */

const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');

/**
 * Client configuration
 */
const CLIENT_OPTIONS = {
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User
    ],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false
    }
};

/**
 * Creates and configures the Discord client
 * @returns {Client} Configured Discord client
 */
function createClient() {
    return new Client(CLIENT_OPTIONS);
}

/**
 * Sets the bot's presence
 * @param {Client} client - Discord client
 * @param {string} status - Status (online, idle, dnd, invisible)
 * @param {string} activityName - Activity name
 * @param {ActivityType} activityType - Activity type
 */
function setPresence(client, status, activityName, activityType = ActivityType.Playing) {
    client.user.setPresence({
        status: status,
        activities: [{
            name: activityName,
            type: activityType
        }]
    });
}

module.exports = {
    createClient,
    setPresence,
    ActivityType,
    CLIENT_OPTIONS
};
