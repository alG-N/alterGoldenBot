"use strict";
/**
 * Music Utilities
 * Consolidated utility functions for music module
 * @module utils/music
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidQueue = exports.isValidTrack = exports.isYouTubeUrl = exports.isValidUrl = exports.validators = void 0;
exports.formatDuration = formatDuration;
exports.formatTime = formatTime;
exports.formatSecondsToTime = formatSecondsToTime;
exports.parseDuration = parseDuration;
exports.formatTimeAgo = formatTimeAgo;
exports.delay = delay;
exports.formatViewCount = formatViewCount;
exports.formatNumber = formatNumber;
exports.truncateText = truncateText;
exports.formatTimestamp = formatTimestamp;
// TIME UTILITIES
/**
 * Format milliseconds to duration string
 * @param ms - Milliseconds
 * @returns Formatted duration (e.g., "1h 30m 45s")
 */
function formatDuration(ms) {
    if (!ms || ms <= 0)
        return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const parts = [];
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes % 60 > 0)
        parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 && hours === 0)
        parts.push(`${seconds % 60}s`);
    return parts.join(' ') || '0s';
}
/**
 * Format milliseconds to time string
 * @param ms - Milliseconds
 * @returns Formatted time (e.g., "1:30:45" or "30:45")
 */
function formatTime(ms) {
    if (!ms || ms < 0)
        return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
/**
 * Format seconds to duration string
 * @param sec - Seconds
 * @returns Formatted duration
 */
function formatSecondsToTime(sec) {
    const numSec = Number(sec) || 0;
    const h = Math.floor(numSec / 3600);
    const m = Math.floor((numSec % 3600) / 60);
    const s = Math.floor(numSec % 60);
    return h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;
}
/**
 * Parse duration string to seconds
 * @param durationStr - Duration string (e.g., "1:30:45")
 * @returns Seconds
 */
function parseDuration(durationStr) {
    if (typeof durationStr === 'number')
        return durationStr;
    if (!durationStr)
        return 0;
    const parts = durationStr.toString().split(':').map(Number);
    if (parts.length === 2)
        return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
    if (parts.length === 3)
        return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
    return 0;
}
/**
 * Format time ago
 * @param timestamp - Timestamp
 * @returns Time ago string
 */
function formatTimeAgo(timestamp) {
    if (!timestamp)
        return 'Never';
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ago`;
    if (hours > 0)
        return `${hours}h ago`;
    if (minutes > 0)
        return `${minutes}m ago`;
    return `${seconds}s ago`;
}
/**
 * Delay execution
 * @param ms - Milliseconds
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// FORMATTING UTILITIES
/**
 * Format view count
 * @param views - View count
 * @returns Formatted view count
 */
function formatViewCount(views) {
    if (!views)
        return 'N/A';
    if (views >= 1000000000) {
        return (views / 1000000000).toFixed(1) + 'B';
    }
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}
/**
 * Format number with locale
 * @param num - Number
 * @returns Formatted number
 */
function formatNumber(num) {
    if (!num)
        return '0';
    return num.toLocaleString();
}
/**
 * Truncate text
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
function truncateText(text, maxLength = 50) {
    if (!text)
        return 'Unknown';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}
/**
 * Format timestamp
 * @param ms - Timestamp in milliseconds
 * @returns Formatted timestamp
 */
function formatTimestamp(ms) {
    const date = new Date(ms);
    return date.toLocaleString("en-US", { hour12: false });
}
// VALIDATORS
exports.validators = {
    _youtubeRegex: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    _idRegex: /^\d{17,19}$/,
    isValidUrl(url) {
        if (!url || typeof url !== 'string')
            return false;
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    },
    isYouTubeUrl(url) {
        if (!url || typeof url !== 'string')
            return false;
        return this._youtubeRegex.test(url);
    },
    isValidTrack(track) {
        if (!track || typeof track !== 'object')
            return false;
        const t = track;
        return !!(t &&
            typeof t.url === 'string' &&
            typeof t.title === 'string' &&
            typeof t.lengthSeconds === 'number' &&
            t.track && typeof t.track.encoded === 'string');
    },
    isValidQueue(queue) {
        if (!queue || typeof queue !== 'object')
            return false;
        const q = queue;
        return !!(q && Array.isArray(q.tracks));
    },
    isValidDuration(seconds, maxSeconds) {
        return typeof seconds === 'number' &&
            seconds > 0 &&
            seconds <= maxSeconds;
    },
    isInVoiceChannel(member) {
        return !!(member?.voice?.channel);
    },
    isInSameVoiceChannel(member, botChannelId) {
        return member?.voice?.channelId === botChannelId;
    },
    hasVoicePermissions(channel) {
        if (!channel)
            return false;
        const me = channel.guild.members.me;
        if (!me)
            return false;
        const permissions = channel.permissionsFor(me);
        if (!permissions)
            return false;
        return permissions.has('Connect') && permissions.has('Speak');
    }
};
// Export bound validators for convenience
exports.isValidUrl = exports.validators.isValidUrl.bind(exports.validators);
exports.isYouTubeUrl = exports.validators.isYouTubeUrl.bind(exports.validators);
exports.isValidTrack = exports.validators.isValidTrack.bind(exports.validators);
exports.isValidQueue = exports.validators.isValidQueue.bind(exports.validators);
//# sourceMappingURL=index.js.map