/**
 * Admin Configuration
 * Server administrator and moderation settings
 * @module config/admin
 */

module.exports = {
    // Default settings for new guilds
    DEFAULT_GUILD_SETTINGS: {
        snipe_limit: 10,
        delete_limit: 100,
        announcement_channel: null,
        admin_roles: [],
        mod_roles: [],
        mute_role: null,
        log_channel: null,
        auto_mod_enabled: false,
        welcome_channel: null,
        welcome_message: null,
        goodbye_channel: null,
        goodbye_message: null
    },

    // Permission levels
    PERMISSION_LEVELS: {
        SERVER_OWNER: 4,
        ADMINISTRATOR: 3,
        MODERATOR: 2,
        MEMBER: 1,
        RESTRICTED: 0
    },

    // Snipe configuration
    SNIPE_CONFIG: {
        MIN_LIMIT: 1,
        MAX_LIMIT: 50,
        DEFAULT_LIMIT: 10,
        MAX_MESSAGE_AGE_MS: 24 * 60 * 60 * 1000
    },

    // Delete configuration
    DELETE_CONFIG: {
        MIN_LIMIT: 1,
        MAX_LIMIT: 500,
        DISCORD_LIMIT: 100,
        DEFAULT_LIMIT: 100,
        MAX_MESSAGE_AGE_DAYS: 14
    },

    // Mute configuration
    MUTE_CONFIG: {
        DEFAULT_DURATION_MS: 5 * 60 * 1000,
        MAX_DURATION_MS: 28 * 24 * 60 * 60 * 1000,
        DURATION_PRESETS: {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '10m': 10 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '12h': 12 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '14d': 14 * 24 * 60 * 60 * 1000,
            '28d': 28 * 24 * 60 * 60 * 1000
        }
    },

    // Command cooldowns (ms)
    COOLDOWNS: {
        setting: 3000,
        snipe: 2000,
        kick: 1000,
        mute: 1000,
        ban: 1000,
        delete: 2000
    },

    // Embed colors
    COLORS: {
        SUCCESS: 0x00FF00,
        ERROR: 0xFF0000,
        WARNING: 0xFFAA00,
        INFO: 0x00AAFF,
        MODERATION: 0xFF5555,
        SETTING: 0x5865F2,
        SNIPE: 0x9B59B6
    },

    // Default moderation reasons
    DEFAULT_REASONS: {
        KICK: 'No reason provided',
        MUTE: 'No reason provided',
        BAN: 'No reason provided'
    },

    // Log action types
    LOG_ACTIONS: {
        KICK: 'KICK',
        MUTE: 'MUTE',
        UNMUTE: 'UNMUTE',
        BAN: 'BAN',
        UNBAN: 'UNBAN',
        DELETE: 'DELETE',
        WARN: 'WARN'
    }
};
