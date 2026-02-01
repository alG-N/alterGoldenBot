/**
 * Shared Constants
 * Centralized constants for the entire application
 * @module shared/constants
 */

// ============================================================================
// EMBED COLORS
// ============================================================================
const COLORS = {
    // Status colors
    SUCCESS: 0x00FF00,
    ERROR: 0xFF0000,
    WARNING: 0xFFAA00,
    INFO: 0x00AAFF,
    
    // Feature colors
    MODERATION: 0xFF5555,
    MUSIC: 0x1DB954,
    VIDEO: 0xFF0000,
    API: 0x5865F2,
    FUN: 0xFFCC00,
    SETTING: 0x5865F2,
    SNIPE: 0x9B59B6,
    
    // Brand colors
    PRIMARY: 0x5865F2,
    SECONDARY: 0x99AAB5,
    PREMIUM: 0xF47FFF,
};

// ============================================================================
// CACHE LIMITS
// ============================================================================
const CACHE_LIMITS = {
    // Guild-related
    MAX_GUILDS: 10000,
    MAX_QUEUE_SIZE: 500,
    MAX_QUEUE_TRACK_DURATION: 3 * 60 * 60 * 1000, // 3 hours
    
    // User-related
    MAX_USER_SESSIONS: 5000,
    MAX_USER_HISTORY: 100,
    MAX_USER_FAVORITES: 200,
    
    // General
    MAX_PLAYLIST_CACHE: 100,
    MAX_RECENTLY_PLAYED: 50,
    
    // TTL (Time To Live)
    SESSION_TTL: 60 * 60 * 1000,        // 1 hour
    SETTINGS_CACHE_TTL: 5 * 60 * 1000,  // 5 minutes
    PLAYLIST_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
    API_CACHE_TTL: 10 * 60 * 1000,      // 10 minutes
};

// ============================================================================
// TIMEOUTS
// ============================================================================
const TIMEOUTS = {
    // Interaction timeouts
    BUTTON_COLLECTOR: 5 * 60 * 1000,    // 5 minutes
    SELECT_MENU_COLLECTOR: 3 * 60 * 1000, // 3 minutes
    MODAL_TIMEOUT: 5 * 60 * 1000,       // 5 minutes
    
    // Music timeouts
    VOICE_INACTIVITY: 5 * 60 * 1000,    // 5 minutes
    SKIP_VOTE: 30 * 1000,               // 30 seconds
    
    // General
    COMMAND_COOLDOWN: 3 * 1000,         // 3 seconds
    API_REQUEST: 30 * 1000,             // 30 seconds
    DATABASE_QUERY: 10 * 1000,          // 10 seconds
};

// ============================================================================
// PAGINATION
// ============================================================================
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    QUEUE_PAGE_SIZE: 10,
    HISTORY_PAGE_SIZE: 15,
    SEARCH_RESULTS: 25,
};

// ============================================================================
// RATE LIMITS
// ============================================================================
const RATE_LIMITS = {
    COMMANDS_PER_MINUTE: 20,
    API_REQUESTS_PER_MINUTE: 60,
    MESSAGES_PER_CHANNEL: 5,
};

// ============================================================================
// EMOJIS
// ============================================================================
const EMOJIS = {
    // Status
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    
    // Music
    PLAY: '▶️',
    PAUSE: '⏸️',
    STOP: '⏹️',
    SKIP: '⏭️',
    PREVIOUS: '⏮️',
    SHUFFLE: '🔀',
    REPEAT: '🔁',
    REPEAT_ONE: '🔂',
    VOLUME: '🔊',
    MUTE: '🔇',
    QUEUE: '📋',
    
    // General
    MUSIC: '🎵',
    VIDEO: '📹',
    SETTINGS: '⚙️',
    STAR: '⭐',
    FIRE: '🔥',
    CLOCK: '🕐',
};

// ============================================================================
// REGEX PATTERNS
// ============================================================================
const PATTERNS = {
    YOUTUBE_URL: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
    SPOTIFY_URL: /^(https?:\/\/)?(open\.)?spotify\.com\/.+$/i,
    SOUNDCLOUD_URL: /^(https?:\/\/)?(www\.)?soundcloud\.com\/.+$/i,
    DISCORD_ID: /^\d{17,19}$/,
    URL: /^https?:\/\/.+$/i,
    TIME_FORMAT: /^(\d{1,2}:)?(\d{1,2}):(\d{2})$/,
};

module.exports = {
    COLORS,
    CACHE_LIMITS,
    TIMEOUTS,
    PAGINATION,
    RATE_LIMITS,
    EMOJIS,
    PATTERNS,
};
