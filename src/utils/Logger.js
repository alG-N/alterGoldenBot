/**
 * alterGolden Logging System
 * Handles both console and Discord channel logging
 * @module core/Logger
 */

const { EmbedBuilder } = require('discord.js');

// Log channel ID for Discord logging
const LOG_CHANNEL_ID = '1195762287729537045';

// Log levels with colors
const LOG_LEVELS = {
    DEBUG: { emoji: '🔍', color: 0x7289DA, console: 'log' },
    INFO: { emoji: 'ℹ️', color: 0x3498DB, console: 'info' },
    SUCCESS: { emoji: '✅', color: 0x2ECC71, console: 'log' },
    WARN: { emoji: '⚠️', color: 0xF1C40F, console: 'warn' },
    ERROR: { emoji: '❌', color: 0xE74C3C, console: 'error' },
    CRITICAL: { emoji: '🚨', color: 0x992D22, console: 'error' }
};

class Logger {
    constructor() {
        this.client = null;
        this.logChannel = null;
    }

    /**
     * Initialize logger with Discord client
     * @param {Client} client - Discord client instance
     */
    initialize(client) {
        this.client = client;
        this.logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    }

    /**
     * Log to console with formatted output
     * @param {string} level - Log level
     * @param {string} category - Log category/module
     * @param {string} message - Log message
     */
    console(level, category, message) {
        const logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${logLevel.emoji} [${category}] ${message}`;
        console[logLevel.console](formattedMessage);
    }

    /**
     * Log to Discord channel
     * @param {string} level - Log level
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Object} [fields] - Additional fields
     */
    async discord(level, title, description, fields = null) {
        if (!this.logChannel) {
            this.logChannel = this.client?.channels.cache.get(LOG_CHANNEL_ID);
            if (!this.logChannel) return;
        }

        const logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
        
        const embed = new EmbedBuilder()
            .setTitle(`${logLevel.emoji} ${title}`)
            .setDescription(description)
            .setColor(logLevel.color)
            .setTimestamp();

        if (fields) {
            Object.entries(fields).forEach(([name, value]) => {
                embed.addFields({ name, value: String(value).slice(0, 1024), inline: true });
            });
        }

        try {
            await this.logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[Logger] Failed to send Discord log:', error.message);
        }
    }

    // Convenience methods
    debug(category, message) { this.console('DEBUG', category, message); }
    info(category, message) { this.console('INFO', category, message); }
    success(category, message) { this.console('SUCCESS', category, message); }
    warn(category, message) { this.console('WARN', category, message); }
    error(category, message) { this.console('ERROR', category, message); }
    critical(category, message) { this.console('CRITICAL', category, message); }

    // Discord logging convenience methods
    async logSystemEvent(title, description) {
        await this.discord('INFO', title, description);
    }

    async logError(title, error, context = {}) {
        const description = error instanceof Error 
            ? `\`\`\`${error.stack || error.message}\`\`\``
            : `\`\`\`${error}\`\`\``;
        
        await this.discord('ERROR', title, description, context);
    }

    async logGuildEvent(type, guild) {
        const title = type === 'join' ? '📥 Joined Server' : '📤 Left Server';
        const description = `**${guild.name}**\nMembers: ${guild.memberCount}`;
        await this.discord(type === 'join' ? 'SUCCESS' : 'WARN', title, description, {
            'Guild ID': guild.id,
            'Total Guilds': this.client?.guilds.cache.size || 'N/A'
        });
    }
}

// Export singleton instance
const logger = new Logger();
module.exports = logger;
module.exports.Logger = Logger;
module.exports.LOG_CHANNEL_ID = LOG_CHANNEL_ID;
module.exports.LOG_LEVELS = LOG_LEVELS;
