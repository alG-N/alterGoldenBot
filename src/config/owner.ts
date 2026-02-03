/**
 * Owner Configuration
 * Settings for bot owners and administrators
 * @module config/owner
 */

// Owner IDs with full bot access (from environment or defaults)
export const OWNER_IDS: string[] = process.env.OWNER_IDS 
    ? process.env.OWNER_IDS.split(',').map(id => id.trim()).filter(Boolean)
    : [
        '1128296349566251068',  // Primary Owner (fallback)
        '1362450043939979378',  // Secondary Admin (fallback)
        '1448912158367813662'   // Tertiary Admin (fallback)
    ];

// Primary Developer ID (from environment or default)
export const DEVELOPER_ID = process.env.DEVELOPER_ID || '1128296349566251068';

// Logging Channels
export const GUILD_LOG_CHANNEL_ID = '1366324387967533057';
export const REPORT_CHANNEL_ID = '1362826913088799001';
export const SYSTEM_LOG_CHANNEL_ID = '1195762287729537045';

// Support Server
export const SUPPORT_GUILD_ID = '1255091916823986207';

// Guild Feature Display Map
export const GUILD_FEATURES_MAP: Record<string, string> = {
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
export const BOOST_TIERS = {
    emojis: ['⚪', '🥉', '🥈', '🥇', '💎'],
    names: ['None', 'Tier 1', 'Tier 2', 'Tier 3']
};

// Embed Colors
export const EMBED_COLORS = {
    SUCCESS: 0x00FF00,
    ERROR: 0xFF0000,
    WARNING: 0xFFA500,
    INFO: 0x3498DB,
    GREY: 0x808080,
    GUILD_JOIN: 0x00FF00,
    GUILD_LEAVE: 0xFF0000
} as const;

// Helper Functions
export function isOwner(userId: string): boolean {
    return OWNER_IDS.includes(userId);
}

export function isDeveloper(userId: string): boolean {
    return userId === DEVELOPER_ID;
}

export function isValidUserId(userId: string): boolean {
    return /^\d{17,19}$/.test(userId);
}

export default {
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
