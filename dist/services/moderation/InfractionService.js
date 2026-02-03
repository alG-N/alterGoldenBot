"use strict";
/**
 * Infraction Service
 * Handles creation and management of mod cases/infractions
 * @module services/moderation/InfractionService
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMOJIS = exports.COLORS = exports.INFRACTION_TYPES = void 0;
exports.createInfraction = createInfraction;
exports.createWarning = createWarning;
exports.logMute = logMute;
exports.logUnmute = logUnmute;
exports.logKick = logKick;
exports.logBan = logBan;
exports.logUnban = logUnban;
exports.logAutoMod = logAutoMod;
exports.logFilter = logFilter;
exports.getCase = getCase;
exports.getUserHistory = getUserHistory;
exports.getWarningCount = getWarningCount;
exports.clearWarnings = clearWarnings;
exports.updateReason = updateReason;
exports.deleteCase = deleteCase;
exports.checkEscalation = checkEscalation;
exports.getRecentCases = getRecentCases;
exports.getStats = getStats;
exports.buildCaseEmbed = buildCaseEmbed;
exports.expireOldInfractions = expireOldInfractions;
const discord_js_1 = require("discord.js");
const ModLogService = __importStar(require("./ModLogService.js"));
const time_js_1 = require("../../utils/common/time.js");
// Use require for CommonJS modules
const InfractionRepository = require('../../repositories/moderation/InfractionRepository.js');
const moderationConfigModule = require('../../config/features/moderation/index.js');
// Handle both ESM default export and direct export
const moderationConfig = moderationConfigModule.default || moderationConfigModule;
const db = require('../../database/index.js');
// Re-export config values
exports.INFRACTION_TYPES = moderationConfig.INFRACTION_TYPES;
exports.COLORS = moderationConfig.COLORS;
exports.EMOJIS = moderationConfig.EMOJIS;
// CORE FUNCTIONS
/**
 * Create a new infraction (case)
 */
async function createInfraction(options) {
    const { guild, user, moderator, type, reason, durationMs, expiryDays, metadata = {} } = options;
    let expiresAt;
    if (type === exports.INFRACTION_TYPES.WARN && expiryDays) {
        expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    }
    else if (durationMs && type === exports.INFRACTION_TYPES.MUTE) {
        expiresAt = new Date(Date.now() + durationMs);
    }
    const infraction = await InfractionRepository.create({
        guildId: guild.id,
        userId: user.id,
        moderatorId: moderator.id,
        type,
        reason: reason || moderationConfig.punishments?.defaultReasons?.[type] || 'No reason provided',
        durationMs,
        expiresAt,
        metadata: {
            ...metadata,
            userTag: ('tag' in user ? user.tag : user.username) || 'Unknown',
            moderatorTag: ('tag' in moderator ? moderator.tag : moderator.username) || 'Unknown'
        }
    });
    await ModLogService.logInfraction(guild, infraction, user, moderator);
    return infraction;
}
/**
 * Create a warning
 */
async function createWarning(guild, user, moderator, reason, options = {}) {
    const expiryDays = options.expiryDays || moderationConfig.punishments?.warnings?.defaultExpiryDays || 7;
    const infraction = await createInfraction({
        guild,
        user,
        moderator,
        type: exports.INFRACTION_TYPES.WARN,
        reason,
        expiryDays,
        metadata: options.metadata || {}
    });
    const warnCount = await InfractionRepository.countActiveWarnings(guild.id, user.id);
    const escalation = await checkEscalation(guild, user, warnCount);
    return { infraction, warnCount, escalation };
}
/**
 * Log a mute action
 */
async function logMute(guild, user, moderator, reason, durationMs) {
    return createInfraction({
        guild,
        user,
        moderator,
        type: exports.INFRACTION_TYPES.MUTE,
        reason,
        durationMs
    });
}
/**
 * Log an unmute action
 */
async function logUnmute(guild, user, moderator, reason) {
    return createInfraction({
        guild,
        user,
        moderator,
        type: exports.INFRACTION_TYPES.UNMUTE,
        reason
    });
}
/**
 * Log a kick action
 */
async function logKick(guild, user, moderator, reason) {
    return createInfraction({
        guild,
        user,
        moderator,
        type: exports.INFRACTION_TYPES.KICK,
        reason
    });
}
/**
 * Log a ban action
 */
async function logBan(guild, user, moderator, reason, metadata = {}) {
    return createInfraction({
        guild,
        user,
        moderator,
        type: exports.INFRACTION_TYPES.BAN,
        reason,
        metadata
    });
}
/**
 * Log an unban action
 */
async function logUnban(guild, user, moderator, reason) {
    return createInfraction({
        guild,
        user,
        moderator,
        type: exports.INFRACTION_TYPES.UNBAN,
        reason
    });
}
/**
 * Log an auto-mod action
 */
async function logAutoMod(guild, user, trigger, action, metadata = {}) {
    return createInfraction({
        guild,
        user,
        moderator: { id: guild.client.user.id, tag: 'Auto-Mod', username: 'Auto-Mod' },
        type: exports.INFRACTION_TYPES.AUTOMOD,
        reason: `[Auto-Mod] ${trigger}: ${action}`,
        metadata: { ...metadata, trigger, action }
    });
}
/**
 * Log a filter trigger
 */
async function logFilter(guild, user, pattern, action, metadata = {}) {
    return createInfraction({
        guild,
        user,
        moderator: { id: guild.client.user.id, tag: 'Word Filter', username: 'Word Filter' },
        type: exports.INFRACTION_TYPES.FILTER,
        reason: `[Filter] Matched: "${pattern}" - Action: ${action}`,
        metadata: { ...metadata, pattern, action }
    });
}
// QUERY FUNCTIONS
/**
 * Get infraction by case ID
 */
async function getCase(guildId, caseId) {
    return InfractionRepository.getByCase(guildId, caseId);
}
/**
 * Get user's infractions
 */
async function getUserHistory(guildId, userId, options = {}) {
    return InfractionRepository.getByGuildAndUser(guildId, userId);
}
/**
 * Get active warning count
 */
async function getWarningCount(guildId, userId) {
    return InfractionRepository.countActiveWarnings(guildId, userId);
}
/**
 * Clear all warnings for a user
 */
async function clearWarnings(guildId, userId) {
    const result = await db.query('UPDATE mod_cases SET active = FALSE WHERE guild_id = $1 AND user_id = $2 AND type = $3 AND active = TRUE', [guildId, userId, exports.INFRACTION_TYPES.WARN]);
    return result.rowCount || 0;
}
/**
 * Update a case reason
 */
async function updateReason(guildId, caseId, newReason) {
    return InfractionRepository.update(caseId, { reason: newReason });
}
/**
 * Delete (deactivate) a case
 */
async function deleteCase(guildId, caseId) {
    const result = await InfractionRepository.deactivate(caseId);
    return !!result;
}
/**
 * Check if warning count triggers escalation
 */
async function checkEscalation(guild, _user, warnCount) {
    const result = await db.query('SELECT * FROM warn_thresholds WHERE guild_id = $1 ORDER BY warn_count ASC', [guild.id]);
    let thresholds = result.rows;
    if (thresholds.length === 0) {
        // Use default thresholds from warnings escalation config
        const defaultThresholds = moderationConfig.punishments?.warnings?.escalation?.thresholds || [];
        thresholds = defaultThresholds.map((t) => ({
            warn_count: t.count,
            action: t.action,
            duration_ms: t.durationMs,
            reason: undefined
        }));
    }
    const threshold = thresholds.find((t) => t.warn_count === warnCount);
    if (!threshold)
        return null;
    return {
        action: threshold.action,
        durationMs: threshold.duration_ms,
        reason: threshold.reason || `Automatic ${threshold.action}: ${warnCount} warnings reached`
    };
}
/**
 * Get recent cases for a guild
 */
async function getRecentCases(guildId, limit = 20) {
    return InfractionRepository.getRecent(guildId, limit);
}
/**
 * Get guild statistics
 */
async function getStats(guildId) {
    return InfractionRepository.countByType(guildId);
}
/**
 * Build an embed for displaying a case
 */
function buildCaseEmbed(infraction, user = null) {
    const type = infraction.type.toUpperCase();
    const color = exports.COLORS[type] || exports.COLORS.DEFAULT;
    const emoji = exports.EMOJIS[type] || exports.EMOJIS.CASE;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} Case #${infraction.case_id}`)
        .addFields({ name: 'Type', value: type, inline: true }, { name: 'User', value: `<@${infraction.user_id}>`, inline: true }, { name: 'Moderator', value: `<@${infraction.moderator_id}>`, inline: true }, { name: 'Reason', value: infraction.reason || 'No reason provided' })
        .setTimestamp(new Date(infraction.created_at));
    if (infraction.duration_ms) {
        embed.addFields({ name: 'Duration', value: (0, time_js_1.formatDuration)(infraction.duration_ms), inline: true });
    }
    if (infraction.expires_at) {
        embed.addFields({
            name: 'Expires',
            value: `<t:${Math.floor(new Date(infraction.expires_at).getTime() / 1000)}:R>`,
            inline: true
        });
    }
    if (!infraction.active) {
        embed.setFooter({ text: '⚠️ This case has been deactivated' });
    }
    if (user?.displayAvatarURL) {
        embed.setThumbnail(user.displayAvatarURL());
    }
    return embed;
}
/**
 * Expire old infractions
 */
async function expireOldInfractions() {
    return InfractionRepository.expireOld();
}
// EXPORTS
exports.default = {
    createInfraction,
    createWarning,
    logMute,
    logUnmute,
    logKick,
    logBan,
    logUnban,
    logAutoMod,
    logFilter,
    getCase,
    getUserHistory,
    getWarningCount,
    clearWarnings,
    updateReason,
    deleteCase,
    checkEscalation,
    getRecentCases,
    getStats,
    buildCaseEmbed,
    expireOldInfractions,
    INFRACTION_TYPES: exports.INFRACTION_TYPES,
    COLORS: exports.COLORS,
    EMOJIS: exports.EMOJIS
};
//# sourceMappingURL=InfractionService.js.map