/**
 * Time Utilities
 * @module utils/time
 */

/**
 * Format duration from milliseconds to human readable
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const h = hours % 24;
        return h > 0 ? `${days}d ${h}h` : `${days}d`;
    }
    if (hours > 0) {
        const m = minutes % 60;
        return m > 0 ? `${hours}h ${m}m` : `${hours}h`;
    }
    if (minutes > 0) {
        const s = seconds % 60;
        return s > 0 ? `${minutes}m ${s}s` : `${minutes}m`;
    }
    return `${seconds}s`;
}

/**
 * Format time ago from timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Time ago string
 */
function formatTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    return formatDuration(diff) + ' ago';
}

/**
 * Parse duration string to milliseconds
 * @param {string} str - Duration string (e.g., "1h", "30m", "1d")
 * @returns {number|null} Milliseconds or null if invalid
 */
function parseDuration(str) {
    const match = str.match(/^(\d+)(s|m|h|d|w)$/i);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000
    };
    
    return value * (multipliers[unit] || 1000);
}

/**
 * Format uptime
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} Formatted uptime
 */
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);
    
    return parts.join(' ');
}

module.exports = {
    formatDuration,
    formatTimeAgo,
    parseDuration,
    formatUptime
};
