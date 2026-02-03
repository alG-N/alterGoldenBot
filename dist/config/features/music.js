"use strict";
/**
 * Music Feature Configuration
 * @module config/features/music
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACK_TRANSITION_DELAY = exports.VC_CHECK_INTERVAL = exports.INACTIVITY_TIMEOUT = exports.cache = exports.ui = exports.volume = exports.voting = exports.limits = exports.timeouts = exports.enabled = void 0;
exports.enabled = true;
exports.timeouts = {
    inactivity: 3 * 60 * 1000, // 3 minutes
    vcCheck: 60 * 1000, // 1 minute
    skipVote: 15 * 1000, // 15 seconds
    collector: 7 * 24 * 60 * 60 * 1000, // 7 days
    confirmation: 20 * 1000, // 20 seconds
    trackTransition: 2500 // 2.5 seconds
};
exports.limits = {
    maxTrackDuration: 600, // 10 minutes
    maxQueueSize: 100,
    maxPlaylistSize: 50,
    historySize: 100,
    favoritesSize: 200,
    recentlyPlayedSize: 50
};
exports.voting = {
    minVotesRequired: 5,
    votePercentage: 0.5
};
exports.volume = {
    default: 80,
    min: 0,
    max: 200,
    step: 10
};
exports.ui = {
    tracksPerPage: 10,
    logChannelId: '1411386693499486429',
    colors: {
        playing: '#00FF00',
        paused: '#FFD700',
        stopped: '#FF0000',
        queued: '#9400D3',
        info: '#3498DB',
        error: '#E74C3C',
        warning: '#F39C12',
        success: '#2ECC71'
    },
    emojis: {
        loop: {
            off: '➡️',
            track: '🔂',
            queue: '🔁'
        },
        source: {
            youtube: '🎵',
            soundcloud: '☁️',
            spotify: '💚',
            unknown: '🎶'
        }
    }
};
exports.cache = {
    sessionDuration: 60 * 60 * 1000,
    playlistCacheDuration: 30 * 60 * 1000
};
// Legacy constants
exports.INACTIVITY_TIMEOUT = 3 * 60 * 1000;
exports.VC_CHECK_INTERVAL = 60 * 1000;
exports.TRACK_TRANSITION_DELAY = 2500;
exports.default = {
    enabled: exports.enabled,
    timeouts: exports.timeouts,
    limits: exports.limits,
    voting: exports.voting,
    volume: exports.volume,
    ui: exports.ui,
    cache: exports.cache,
    INACTIVITY_TIMEOUT: exports.INACTIVITY_TIMEOUT,
    VC_CHECK_INTERVAL: exports.VC_CHECK_INTERVAL,
    TRACK_TRANSITION_DELAY: exports.TRACK_TRANSITION_DELAY
};
//# sourceMappingURL=music.js.map