"use strict";
/**
 * ModLog Repository
 * Database operations for mod log settings
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModLogRepository = void 0;
exports.get = get;
exports.create = create;
exports.getOrCreate = getOrCreate;
exports.update = update;
exports.setLogChannel = setLogChannel;
exports.toggleLogType = toggleLogType;
exports.remove = remove;
exports.isEnabled = isEnabled;
exports.getGuildsWithLogging = getGuildsWithLogging;
const postgres_js_1 = __importDefault(require("../../database/postgres.js"));
// Repository Functions
/**
 * Get mod log settings for a guild
 */
async function get(guildId) {
    const result = await postgres_js_1.default.query(`SELECT * FROM mod_log_settings WHERE guild_id = $1`, [guildId]);
    return result.rows[0] || null;
}
/**
 * Create default mod log settings
 */
async function create(guildId) {
    const result = await postgres_js_1.default.query(`INSERT INTO mod_log_settings (guild_id) 
         VALUES ($1) 
         ON CONFLICT (guild_id) DO NOTHING
         RETURNING *`, [guildId]);
    if (result.rows.length === 0) {
        return get(guildId);
    }
    return result.rows[0];
}
/**
 * Get or create mod log settings
 */
async function getOrCreate(guildId) {
    const existing = await get(guildId);
    if (existing)
        return existing;
    return create(guildId);
}
/**
 * Update mod log settings
 */
async function update(guildId, updates) {
    const allowedFields = [
        'log_channel_id',
        'log_warns', 'log_mutes', 'log_kicks', 'log_bans', 'log_unbans',
        'log_automod', 'log_filters',
        'log_message_deletes', 'log_message_edits',
        'log_member_joins', 'log_member_leaves',
        'log_role_changes', 'log_nickname_changes',
        'use_embeds', 'include_moderator', 'include_reason'
    ];
    const setClauses = [];
    const params = [guildId];
    let paramIndex = 2;
    for (const field of allowedFields) {
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const value = updates[field] ?? updates[camelField];
        if (value !== undefined) {
            setClauses.push(`${field} = $${paramIndex++}`);
            params.push(value);
        }
    }
    if (setClauses.length === 0)
        return get(guildId);
    const result = await postgres_js_1.default.query(`UPDATE mod_log_settings 
         SET ${setClauses.join(', ')}
         WHERE guild_id = $1
         RETURNING *`, params);
    return result.rows[0] || null;
}
/**
 * Set log channel
 */
async function setLogChannel(guildId, channelId) {
    return update(guildId, { log_channel_id: channelId });
}
/**
 * Toggle a specific log type
 */
async function toggleLogType(guildId, logType, enabled) {
    const fieldName = `log_${logType}`;
    return update(guildId, { [fieldName]: enabled });
}
/**
 * Delete mod log settings
 */
async function remove(guildId) {
    const result = await postgres_js_1.default.query(`DELETE FROM mod_log_settings WHERE guild_id = $1`, [guildId]);
    return (result.rowCount ?? 0) > 0;
}
/**
 * Check if logging is enabled for a type
 */
async function isEnabled(guildId, logType) {
    const settings = await get(guildId);
    if (!settings || !settings.log_channel_id)
        return false;
    const fieldName = `log_${logType}`;
    return settings[fieldName] === true;
}
/**
 * Get all guilds with mod logging enabled
 */
async function getGuildsWithLogging() {
    const result = await postgres_js_1.default.query(`SELECT * FROM mod_log_settings WHERE log_channel_id IS NOT NULL`);
    return result.rows;
}
// Export as module object
const ModLogRepository = {
    get,
    create,
    getOrCreate,
    update,
    setLogChannel,
    toggleLogType,
    remove,
    isEnabled,
    getGuildsWithLogging
};
exports.ModLogRepository = ModLogRepository;
exports.default = ModLogRepository;
//# sourceMappingURL=ModLogRepository.js.map