/**
 * Punishment Configuration
 * Warning thresholds, escalation rules, and punishment defaults
 * @module config/features/moderation/punishments
 */
// TYPES
export interface WarningsConfig {
    defaultExpiryDays: number;
    maxActive: number;
    showCountInDM: boolean;
    sendDM: boolean;
}

export interface Threshold {
    warnCount: number;
    action: string;
    durationMs?: number;
    reason: string;
}

export interface MuteConfig {
    defaultDurationMs: number;
    maxDurationMs: number;
    minDurationMs: number;
    presets: Record<string, number>;
    sendDM: boolean;
}

export interface KickConfig {
    sendDM: boolean;
    includeInvite: boolean;
}

export interface BanConfig {
    defaultDeleteDays: number;
    maxDeleteDays: number;
    sendDM: boolean;
    includeAppealInfo: boolean;
    appealMessage: string | null;
}

export interface SoftbanConfig {
    deleteDays: number;
    sendDM: boolean;
}

export interface AutomodPunishmentConfig {
    warnReasonPrefix: string;
    trackSeparately: boolean;
    warnsBeforeMute: number;
    muteDurationMs: number;
    escalation: {
        enabled: boolean;
        durationMultiplier: number;
        maxDurationMs: number;
        resetAfterMs: number;
    };
}

export interface DMTemplateField {
    name: string;
    value: string;
}

export interface DMTemplate {
    title: string;
    description: string;
    fields: DMTemplateField[];
    footer?: string;
}

export interface PunishmentsConfig {
    warnings: WarningsConfig;
    defaultThresholds: Threshold[];
    mute: MuteConfig;
    kick: KickConfig;
    ban: BanConfig;
    softban: SoftbanConfig;
    defaultReasons: Record<string, string>;
    automod: AutomodPunishmentConfig;
    dmTemplates: Record<string, DMTemplate>;
}
// CONFIG
const punishmentsConfig: PunishmentsConfig = {
    // WARNING SYSTEM
    warnings: {
        defaultExpiryDays: 30,
        maxActive: 10,
        showCountInDM: true,
        sendDM: true
    },
    // WARNING THRESHOLDS (Escalation)
    defaultThresholds: [
        {
            warnCount: 3,
            action: 'mute',
            durationMs: 60 * 60 * 1000,
            reason: 'Automatic mute: 3 warnings reached'
        },
        {
            warnCount: 5,
            action: 'kick',
            reason: 'Automatic kick: 5 warnings reached'
        },
        {
            warnCount: 7,
            action: 'ban',
            reason: 'Automatic ban: 7 warnings reached'
        }
    ],
    // MUTE SETTINGS
    mute: {
        defaultDurationMs: 5 * 60 * 1000,
        maxDurationMs: 27 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000,
        minDurationMs: 60 * 1000,
        presets: {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '10m': 10 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '2h': 2 * 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '12h': 12 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
            '3d': 3 * 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '14d': 14 * 24 * 60 * 60 * 1000,
            '28d': 28 * 24 * 60 * 60 * 1000
        },
        sendDM: true
    },
    // KICK SETTINGS
    kick: {
        sendDM: true,
        includeInvite: false
    },
    // BAN SETTINGS
    ban: {
        defaultDeleteDays: 1,
        maxDeleteDays: 7,
        sendDM: true,
        includeAppealInfo: false,
        appealMessage: null
    },
    // SOFTBAN SETTINGS
    softban: {
        deleteDays: 7,
        sendDM: true
    },
    // DEFAULT REASONS
    defaultReasons: {
        warn: 'No reason provided',
        mute: 'No reason provided',
        kick: 'No reason provided',
        ban: 'No reason provided',
        unmute: 'Unmuted by moderator',
        unban: 'Unbanned by moderator'
    },
    // AUTO-MOD PUNISHMENT SETTINGS
    automod: {
        warnReasonPrefix: '[Auto-Mod]',
        trackSeparately: true,
        warnsBeforeMute: 3,
        muteDurationMs: 10 * 60 * 1000,
        escalation: {
            enabled: true,
            durationMultiplier: 2,
            maxDurationMs: 24 * 60 * 60 * 1000,
            resetAfterMs: 24 * 60 * 60 * 1000
        }
    },
    // DM TEMPLATES
    dmTemplates: {
        warn: {
            title: '⚠️ You have been warned',
            description: 'You have received a warning in **{guild}**',
            fields: [
                { name: 'Reason', value: '{reason}' },
                { name: 'Warning Count', value: '{count} active warning(s)' },
                { name: 'Moderator', value: '{moderator}' }
            ],
            footer: 'Please follow the server rules to avoid further action.'
        },
        mute: {
            title: '🔇 You have been muted',
            description: 'You have been muted in **{guild}**',
            fields: [
                { name: 'Duration', value: '{duration}' },
                { name: 'Reason', value: '{reason}' },
                { name: 'Moderator', value: '{moderator}' }
            ]
        },
        kick: {
            title: '👢 You have been kicked',
            description: 'You have been kicked from **{guild}**',
            fields: [
                { name: 'Reason', value: '{reason}' },
                { name: 'Moderator', value: '{moderator}' }
            ]
        },
        ban: {
            title: '🔨 You have been banned',
            description: 'You have been banned from **{guild}**',
            fields: [
                { name: 'Reason', value: '{reason}' },
                { name: 'Moderator', value: '{moderator}' }
            ]
        }
    }
};

export default punishmentsConfig;
