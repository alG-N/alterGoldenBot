/**
 * Music Configuration
 * Settings for the music player system
 * @module config/music
 */

module.exports = {
    // Enable/disable music system
    enabled: true,
    
    // Timeouts
    INACTIVITY_TIMEOUT: 3 * 60 * 1000,
    VC_CHECK_INTERVAL: 60_000,
    SKIP_VOTE_TIMEOUT: 15000,
    COLLECTOR_TIMEOUT: 7 * 24 * 60 * 60 * 1000,
    CONFIRMATION_TIMEOUT: 20000,
    TRACK_TRANSITION_DELAY: 2500,

    // Voting
    MIN_VOTES_REQUIRED: 5,

    // Track limits
    MAX_TRACK_DURATION: 600,
    MAX_QUEUE_SIZE: 100,
    MAX_PLAYLIST_SIZE: 50,

    // Volume
    VOLUME_STEP: 10,
    MIN_VOLUME: 0,
    MAX_VOLUME: 200,
    DEFAULT_VOLUME: 80,

    // Logging
    LOG_CHANNEL_ID: '1411386693499486429',

    // Pagination
    TRACKS_PER_PAGE: 10,
    HISTORY_MAX_SIZE: 100,
    FAVORITES_MAX_SIZE: 200,
    RECENTLY_PLAYED_MAX: 50,

    // Cache durations
    SESSION_DURATION: 60 * 60 * 1000,
    PLAYLIST_CACHE_DURATION: 30 * 60 * 1000,

    // Embed colors
    COLORS: {
        playing: '#00FF00',
        paused: '#FFD700',
        stopped: '#FF0000',
        queued: '#9400D3',
        info: '#3498DB',
        error: '#E74C3C',
        warning: '#F39C12',
        success: '#2ECC71'
    },

    // Emojis
    LOOP_EMOJIS: {
        off: '➡️',
        track: '🔂',
        queue: '🔁'
    },

    SOURCE_EMOJIS: {
        youtube: '🎵',
        soundcloud: '☁️',
        spotify: '💚',
        unknown: '🎶'
    }
};
