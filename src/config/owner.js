/**
 * Owner Configuration
 * Settings for bot owners and administrators
 * @module config/owner
 */

// Owner IDs with full bot access
const OWNER_IDS = [
    '1128296349566251068',  // Primary Owner
    '1362450043939979378',  // Secondary Admin
    '1448912158367813662'   // Tertiary Admin
];

// Primary Developer ID
const DEVELOPER_ID = '1128296349566251068';

// Logging Channels
const GUILD_LOG_CHANNEL_ID = '1366324387967533057';
const REPORT_CHANNEL_ID = '1362826913088799001';
const SYSTEM_LOG_CHANNEL_ID = '1195762287729537045';

// Support Server
const SUPPORT_GUILD_ID = '1255091916823986207';

// Guild Feature Display Map
const GUILD_FEATURES_MAP = {
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
const BOOST_TIERS = {
    emojis: ['⚪', '🥉', '🥈', '🥇', '💎'],
    names: ['None', 'Tier 1', 'Tier 2', 'Tier 3']
};

// Embed Colors
const EMBED_COLORS = {
    SUCCESS: 0x00FF00,
    ERROR: 0xFF0000,
    WARNING: 0xFFA500,
    INFO: 0x3498DB,
    GREY: 0x808080,
    GUILD_JOIN: 0x00FF00,
    GUILD_LEAVE: 0xFF0000
};

// Helper Functions
function isOwner(userId) {
    return OWNER_IDS.includes(userId);
}

function isDeveloper(userId) {
    return userId === DEVELOPER_ID;
}

function isValidUserId(userId) {
    return /^\d{17,19}$/.test(userId);
}

module.exports = {
    OWNER_IDS,
    DEVELOPER_ID,
    GUILD_LOG_CHANNEL_ID,
    REPORT_CHANNEL_ID,
    SYSTEM_LOG_CHANNEL_ID,
    SUPPORT_GUILD_ID,
    GUILD_FEATURES_MAP,
    BOOST_TIERS,
    EMBED_COLORS,
    isOwner,
    isDeveloper,
    isValidUserId
};
