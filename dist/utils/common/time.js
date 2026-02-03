"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.formatMusicDuration = formatMusicDuration;
exports.formatTimeAgo = formatTimeAgo;
exports.formatCountdown = formatCountdown;
exports.parseDuration = parseDuration;
exports.parseTimeString = parseTimeString;
exports.discordTimestamp = discordTimestamp;
exports.sleep = sleep;
exports.unixTimestamp = unixTimestamp;
exports.isToday = isToday;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
exports.formatUptime = formatUptime;
// DURATION FORMATTING
/**
 * Format duration from milliseconds to human readable
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "1h 23m 45s")
 */
function formatDuration(ms) {
    if (!ms || ms < 0)
        return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours % 24 > 0)
        parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0)
        parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 || parts.length === 0)
        parts.push(`${seconds % 60}s`);
    return parts.join(' ');
}
/**
 * Format duration for music (MM:SS or HH:MM:SS)
 * @param ms - Duration in milliseconds
 * @returns Formatted time (e.g., "3:45" or "1:23:45")
 */
function formatMusicDuration(ms) {
    if (!ms || ms < 0)
        return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
/**
 * Format time ago from timestamp
 * @param timestamp - Timestamp or Date
 * @returns Time ago string (e.g., "5 minutes ago")
 */
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
    const diff = now - time;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (years > 0)
        return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0)
        return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0)
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0)
        return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0)
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0)
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}
/**
 * Format countdown (for anime airing, etc.)
 * @param seconds - Seconds until event
 * @returns Formatted countdown
 */
function formatCountdown(seconds) {
    if (seconds <= 0)
        return 'now';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0)
        parts.push(`${minutes}m`);
    return parts.join(' ');
}
// DURATION PARSING
/**
 * Parse duration string to milliseconds
 * @param str - Duration string (e.g., "1h30m", "90m", "5400s")
 * @returns Duration in milliseconds
 */
function parseDuration(str) {
    if (!str)
        return 0;
    const regex = /(\d+)(d|h|m|s)/gi;
    let total = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        switch (unit) {
            case 'd':
                total += value * 86400000;
                break;
            case 'h':
                total += value * 3600000;
                break;
            case 'm':
                total += value * 60000;
                break;
            case 's':
                total += value * 1000;
                break;
        }
    }
    // If no units found, try parsing as seconds
    if (total === 0 && /^\d+$/.test(str)) {
        total = parseInt(str, 10) * 1000;
    }
    return total;
}
/**
 * Parse time string (MM:SS or HH:MM:SS) to milliseconds
 * @param str - Time string
 * @returns Duration in milliseconds
 */
function parseTimeString(str) {
    if (!str)
        return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) {
        // HH:MM:SS
        return ((parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)) * 1000;
    }
    else if (parts.length === 2) {
        // MM:SS
        return ((parts[0] ?? 0) * 60 + (parts[1] ?? 0)) * 1000;
    }
    return 0;
}
// DISCORD UTILITIES
/**
 * Get relative time for Discord timestamp
 * @param date - Date or timestamp
 * @param style - Timestamp style (R, F, f, D, d, T, t)
 * @returns Discord timestamp string
 */
function discordTimestamp(date, style = 'R') {
    const timestamp = date instanceof Date
        ? Math.floor(date.getTime() / 1000)
        : Math.floor(date / 1000);
    return `<t:${timestamp}:${style}>`;
}
// ASYNC UTILITIES
/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified time
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// ADDITIONAL UTILITIES
/**
 * Get current Unix timestamp in seconds
 */
function unixTimestamp() {
    return Math.floor(Date.now() / 1000);
}
/**
 * Check if a date is today
 */
function isToday(date) {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
}
/**
 * Get start of day timestamp
 */
function startOfDay(date = new Date()) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}
/**
 * Get end of day timestamp
 */
function endOfDay(date = new Date()) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}
/**
 * Format uptime from milliseconds to human readable
 * @param uptimeMs - Uptime in milliseconds
 * @returns Formatted uptime (e.g., "2d 5h 30m 15s")
 */
function formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours % 24 > 0)
        parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0)
        parts.push(`${minutes % 60}m`);
    parts.push(`${seconds % 60}s`);
    return parts.join(' ');
}
//# sourceMappingURL=time.js.map