"use strict";
/**
 * URL Validator Middleware
 * SSRF protection and URL validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_HOST_PATTERNS = void 0;
exports.validateUrl = validateUrl;
exports.isBlockedHost = isBlockedHost;
const videoEmbedBuilder_js_1 = __importDefault(require("../utils/video/videoEmbedBuilder.js"));
// Constants
/**
 * SSRF Protection - Blocked hostname patterns
 * Covers IPv4, IPv6, private ranges, localhost, and cloud metadata endpoints
 */
const BLOCKED_HOST_PATTERNS = [
    // Localhost variations
    /^localhost$/i,
    /^localhost\..*/i,
    /^.*\.localhost$/i,
    // IPv4 loopback
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    // IPv4 private ranges (RFC 1918)
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
    // Link-local (APIPA)
    /^169\.254\.\d{1,3}\.\d{1,3}$/,
    // IPv4 zeros
    /^0\.0\.0\.0$/,
    /^0+\.0+\.0+\.0+$/,
    // IPv6 localhost
    /^\[?::1\]?$/,
    /^\[?0:0:0:0:0:0:0:1\]?$/,
    // IPv6 mapped IPv4 (::ffff:127.0.0.1)
    /^\[?::ffff:127\./i,
    /^\[?::ffff:10\./i,
    /^\[?::ffff:192\.168\./i,
    /^\[?::ffff:172\.(1[6-9]|2\d|3[0-1])\./i,
    // AWS/Cloud metadata endpoints
    /^169\.254\.169\.254$/,
    /^metadata\.google\.internal$/i,
    /^metadata\.goog$/i,
    // Kubernetes internal
    /^kubernetes\.default/i,
    /^\.internal$/i,
];
exports.BLOCKED_HOST_PATTERNS = BLOCKED_HOST_PATTERNS;
// Functions
/**
 * Check if hostname matches any blocked pattern
 */
function isBlockedHost(hostname) {
    if (!hostname)
        return true;
    const normalizedHost = hostname.toLowerCase().replace(/^\[|\]$/g, '');
    return BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(normalizedHost));
}
/**
 * Validate a video URL
 */
async function validateUrl(interaction, url) {
    // Basic protocol check
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        await interaction.editReply({
            embeds: [videoEmbedBuilder_js_1.default.buildInvalidUrlEmbed()]
        });
        return false;
    }
    // Try to parse URL to ensure it's valid
    try {
        const parsedUrl = new URL(url);
        // Block dangerous protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            await interaction.editReply({
                embeds: [videoEmbedBuilder_js_1.default.buildInvalidUrlEmbed('Only HTTP/HTTPS URLs are supported.')]
            });
            return false;
        }
        // SSRF Protection: Check against blocked patterns
        if (isBlockedHost(parsedUrl.hostname)) {
            await interaction.editReply({
                embeds: [videoEmbedBuilder_js_1.default.buildInvalidUrlEmbed('This URL is not allowed for security reasons.')]
            });
            return false;
        }
        // Block URLs with credentials
        if (parsedUrl.username || parsedUrl.password) {
            await interaction.editReply({
                embeds: [videoEmbedBuilder_js_1.default.buildInvalidUrlEmbed('URLs with credentials are not allowed.')]
            });
            return false;
        }
    }
    catch (error) {
        await interaction.editReply({
            embeds: [videoEmbedBuilder_js_1.default.buildInvalidUrlEmbed('The URL format is invalid.')]
        });
        return false;
    }
    return true;
}
exports.default = {
    validateUrl,
    isBlockedHost,
    BLOCKED_HOST_PATTERNS
};
//# sourceMappingURL=urlValidator.js.map