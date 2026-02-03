/**
 * Auto-Moderation Configuration
 * Default settings for automatic moderation features
 * @module config/features/moderation/automod
 */
// TYPES
export interface SpamConfig {
    enabled: boolean;
    threshold: number;
    windowMs: number;
    action: string;
    muteDurationMs: number;
    escalation: {
        enabled: boolean;
        multiplier: number;
        maxDurationMs: number;
    };
}

export interface DuplicateConfig {
    enabled: boolean;
    threshold: number;
    windowMs: number;
    action: string;
    similarity: number;
    ignoreCase: boolean;
    ignoreWhitespace: boolean;
}

export interface LinksConfig {
    enabled: boolean;
    action: string;
    whitelistMode: boolean;
    whitelist: string[];
    blacklist: string[];
    allowMedia: boolean;
    mediaExtensions: string[];
}

export interface InvitesConfig {
    enabled: boolean;
    action: string;
    whitelist: string[];
    bypassRoles: string[];
    patterns: RegExp[];
}

export interface MentionsConfig {
    enabled: boolean;
    userLimit: number;
    roleLimit: number;
    totalLimit: number;
    action: string;
    countEveryone: boolean;
}

export interface CapsConfig {
    enabled: boolean;
    percent: number;
    minLength: number;
    action: string;
    ignoreEmoji: boolean;
    ignoreCommands: boolean;
}

export interface EmojiConfig {
    enabled: boolean;
    limit: number;
    action: string;
    countCustom: boolean;
    countUnicode: boolean;
}

export interface NewAccountConfig {
    enabled: boolean;
    minAgeHours: number;
    action: string;
    restrictRole: string | null;
    sendDM: boolean;
    dmMessage: string;
}

export interface RaidConfig {
    enabled: boolean;
    joinThreshold: number;
    windowMs: number;
    action: string;
    autoUnlockMs: number;
    checkAccountAge: boolean;
    minAccountAgeDays: number;
    lockChannels: string[];
    verificationChannel: string | null;
}

export interface GlobalAutomodConfig {
    logChannel: string | null;
    bypassRoles: string[];
    ignoredChannels: string[];
    bypassUsers: string[];
    cleanupDelayMs: number;
    logMessageContent: boolean;
    maxAutomodWarnsBeforeMute: number;
    automodMuteDurationMs: number;
}

export interface AutomodConfig {
    spam: SpamConfig;
    duplicate: DuplicateConfig;
    links: LinksConfig;
    invites: InvitesConfig;
    mentions: MentionsConfig;
    caps: CapsConfig;
    emoji: EmojiConfig;
    newAccount: NewAccountConfig;
    raid: RaidConfig;
    global: GlobalAutomodConfig;
}
// CONFIG
const automodConfig: AutomodConfig = {
    // SPAM DETECTION
    spam: {
        enabled: false,
        threshold: 5,
        windowMs: 5000,
        action: 'delete_warn',
        muteDurationMs: 5 * 60 * 1000,
        
        escalation: {
            enabled: true,
            multiplier: 2,
            maxDurationMs: 24 * 60 * 60 * 1000
        }
    },
    // DUPLICATE MESSAGE DETECTION
    duplicate: {
        enabled: false,
        threshold: 3,
        windowMs: 30000,
        action: 'delete_warn',
        similarity: 0.85,
        ignoreCase: true,
        ignoreWhitespace: true
    },
    // LINK FILTER
    links: {
        enabled: false,
        action: 'delete_warn',
        whitelistMode: false,
        whitelist: [],
        blacklist: [
            'grabify.link',
            'iplogger.org',
            'iplogger.com',
            '2no.co',
            'ipgrabber.ru',
            'blasze.tk',
            'linkbucks.com'
        ],
        allowMedia: true,
        mediaExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov']
    },
    // DISCORD INVITE FILTER
    invites: {
        enabled: false,
        action: 'delete_warn',
        whitelist: [],
        bypassRoles: [],
        patterns: [
            /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/[\w-]+/gi,
            /discordapp\.com\/invite\/[\w-]+/gi
        ]
    },
    // MENTION SPAM
    mentions: {
        enabled: false,
        userLimit: 5,
        roleLimit: 3,
        totalLimit: 8,
        action: 'delete_warn',
        countEveryone: true
    },
    // CAPS LOCK SPAM
    caps: {
        enabled: false,
        percent: 70,
        minLength: 10,
        action: 'delete',
        ignoreEmoji: true,
        ignoreCommands: true
    },
    // EMOJI SPAM
    emoji: {
        enabled: false,
        limit: 10,
        action: 'delete',
        countCustom: true,
        countUnicode: true
    },
    // NEW ACCOUNT FILTER
    newAccount: {
        enabled: false,
        minAgeHours: 24,
        action: 'kick',
        restrictRole: null,
        sendDM: true,
        dmMessage: 'Your account is too new to join this server. Please try again later.'
    },
    // RAID PROTECTION
    raid: {
        enabled: false,
        joinThreshold: 10,
        windowMs: 10000,
        action: 'lockdown',
        autoUnlockMs: 5 * 60 * 1000,
        checkAccountAge: true,
        minAccountAgeDays: 7,
        lockChannels: [],
        verificationChannel: null
    },
    // GLOBAL SETTINGS
    global: {
        logChannel: null,
        bypassRoles: [],
        ignoredChannels: [],
        bypassUsers: [],
        cleanupDelayMs: 0,
        logMessageContent: true,
        maxAutomodWarnsBeforeMute: 3,
        automodMuteDurationMs: 10 * 60 * 1000
    }
};

export default automodConfig;
