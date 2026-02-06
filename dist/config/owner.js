"use strict";
/**
 * Owner Configuration
 * Settings for bot owners and administrators
 * @module config/owner
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOST_TIERS = exports.GUILD_FEATURES_MAP = exports.SUPPORT_GUILD_ID = exports.SYSTEM_LOG_CHANNEL_ID = exports.REPORT_CHANNEL_ID = exports.GUILD_LOG_CHANNEL_ID = exports.DEVELOPER_ID = exports.OWNER_IDS = void 0;
exports.isOwner = isOwner;
exports.isDeveloper = isDeveloper;
exports.isValidUserId = isValidUserId;
// Owner IDs with full bot access (from environment or defaults)
exports.OWNER_IDS = process.env.OWNER_IDS
    ? process.env.OWNER_IDS.split(',').map(id => id.trim()).filter(Boolean)
    : [
        '1128296349566251068', // Primary Owner (fallback)
        '1362450043939979378', // Secondary Admin (fallback)
        '1448912158367813662' // Tertiary Admin (fallback)
    ];
// Primary Developer ID (from environment or default)
exports.DEVELOPER_ID = process.env.DEVELOPER_ID || '1128296349566251068';
// Logging Channels (from environment or defaults)
exports.GUILD_LOG_CHANNEL_ID = process.env.GUILD_LOG_CHANNEL_ID || '';
exports.REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID || '';
exports.SYSTEM_LOG_CHANNEL_ID = process.env.SYSTEM_LOG_CHANNEL_ID || '';
// Support Server
exports.SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID || '';
// Guild Feature Display Map
exports.GUILD_FEATURES_MAP = {
    'ANIMATED_ICON': '🎬 Animated Icon',
    'BANNER': '🖼️ Banner',
    'COMMERCE': '🛒 Commerce',
    'COMMUNITY': '🏘️ Community',
    'DISCOVERABLE': '🔍 Discoverable',
    'FEATURABLE': '⭐ Featurable',
    'INVITE_SPLASH': '💦 Invite Splash',
    'MEMBER_VERIFICATION_GATE_ENABLED': '✅ Verification Gate',
    'NEWS': '📰 News Channels',
    'PARTNERED': '🤝 Partnered',
    'PREVIEW_ENABLED': '👁️ Preview',
    'VANITY_URL': '🔗 Vanity URL',
    'VERIFIED': '✅ Verified',
    'VIP_REGIONS': '🌐 VIP Regions',
    'WELCOME_SCREEN_ENABLED': '👋 Welcome Screen'
};
// Server Boost Tiers
exports.BOOST_TIERS = {
    emojis: ['⚪', '🥉', '🥈', '🥇', '💎'],
    names: ['None', 'Tier 1', 'Tier 2', 'Tier 3']
};
// Helper Functions
function isOwner(userId) {
    return exports.OWNER_IDS.includes(userId);
}
function isDeveloper(userId) {
    return userId === exports.DEVELOPER_ID;
}
function isValidUserId(userId) {
    return /^\d{17,19}$/.test(userId);
}
exports.default = {
    OWNER_IDS: exports.OWNER_IDS,
    DEVELOPER_ID: exports.DEVELOPER_ID,
    GUILD_LOG_CHANNEL_ID: exports.GUILD_LOG_CHANNEL_ID,
    REPORT_CHANNEL_ID: exports.REPORT_CHANNEL_ID,
    SYSTEM_LOG_CHANNEL_ID: exports.SYSTEM_LOG_CHANNEL_ID,
    SUPPORT_GUILD_ID: exports.SUPPORT_GUILD_ID,
    GUILD_FEATURES_MAP: exports.GUILD_FEATURES_MAP,
    BOOST_TIERS: exports.BOOST_TIERS,
    isOwner,
    isDeveloper,
    isValidUserId
};
//# sourceMappingURL=owner.js.map