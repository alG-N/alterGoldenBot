/**
 * AutoMod Repository
 * Database operations for auto-moderation settings
 */

import db from '../../database/postgres';
// Interfaces
type AutoModAction = 'warn' | 'mute' | 'kick' | 'ban' | 'delete' | 'delete_warn';

interface AutoModSettings {
    guild_id: string;
    enabled: boolean;
    
    // Filter
    filter_enabled: boolean;
    filtered_words: string[];
    
    // Spam
    spam_enabled: boolean;
    spam_threshold: number;
    spam_interval: number;
    spam_window_ms: number;
    spam_action: AutoModAction;
    spam_mute_duration_ms: number;
    
    // Duplicate
    duplicate_enabled: boolean;
    duplicate_threshold: number;
    duplicate_window_ms: number;
    duplicate_action: AutoModAction;
    
    // Links
    links_enabled: boolean;
    links_whitelist: string[];
    links_action: AutoModAction;
    
    // Mentions
    mention_enabled: boolean;
    mention_limit: number;
    mention_action: AutoModAction;
    
    // Caps
    caps_enabled: boolean;
    caps_percent: number;
    caps_percentage: number;
    caps_min_length: number;
    caps_action: AutoModAction;
    
    // Invites
    invites_enabled: boolean;
    invites_whitelist: string[];
    invites_action: AutoModAction;
    
    // New Account
    new_account_enabled: boolean;
    new_account_age_hours: number;
    new_account_action: AutoModAction;
    
    // Raid
    raid_enabled: boolean;
    raid_join_threshold: number;
    raid_window_ms: number;
    raid_action: AutoModAction;
    raid_auto_unlock_ms: number;
    
    // Common
    ignored_channels: string[];
    ignored_roles: string[];
    log_channel_id: string | null;
    
    // Warn settings
    auto_warn: boolean;
    mute_duration: number;
    default_action: AutoModAction;
    warn_threshold: number;
    warn_action: AutoModAction;
    warn_reset_hours: number;
    
    created_at?: Date;
    updated_at?: Date;
}

interface AutoModUpdateData {
    enabled?: boolean;
    filter_enabled?: boolean;
    filtered_words?: string[];
    spam_enabled?: boolean;
    spam_threshold?: number;
    spam_interval?: number;
    spam_window_ms?: number;
    spam_action?: AutoModAction;
    spam_mute_duration_ms?: number;
    duplicate_enabled?: boolean;
    duplicate_threshold?: number;
    duplicate_window_ms?: number;
    duplicate_action?: AutoModAction;
    links_enabled?: boolean;
    links_whitelist?: string[];
    links_action?: AutoModAction;
    mention_enabled?: boolean;
    mention_limit?: number;
    mention_action?: AutoModAction;
    caps_enabled?: boolean;
    caps_percent?: number;
    caps_percentage?: number;
    caps_min_length?: number;
    caps_action?: AutoModAction;
    invites_enabled?: boolean;
    invites_whitelist?: string[];
    invites_action?: AutoModAction;
    new_account_enabled?: boolean;
    new_account_age_hours?: number;
    new_account_action?: AutoModAction;
    raid_enabled?: boolean;
    raid_join_threshold?: number;
    raid_window_ms?: number;
    raid_action?: AutoModAction;
    raid_auto_unlock_ms?: number;
    ignored_channels?: string[];
    ignored_roles?: string[];
    log_channel_id?: string | null;
    auto_warn?: boolean;
    mute_duration?: number;
    default_action?: AutoModAction;
    warn_threshold?: number;
    warn_action?: AutoModAction;
    warn_reset_hours?: number;
    [key: string]: any;
}
// Repository Functions
/**
 * Get auto-mod settings for a guild
 */
async function get(guildId: string): Promise<AutoModSettings | null> {
    const result = await db.query(
        `SELECT * FROM automod_settings WHERE guild_id = $1`,
        [guildId]
    );
    return (result.rows[0] as unknown as AutoModSettings) || null;
}

/**
 * Create default auto-mod settings for a guild
 */
async function create(guildId: string): Promise<AutoModSettings | null> {
    const result = await db.query(
        `INSERT INTO automod_settings (guild_id) 
         VALUES ($1) 
         ON CONFLICT (guild_id) DO NOTHING
         RETURNING *`,
        [guildId]
    );
    
    // If insert was skipped due to conflict, fetch existing
    if (result.rows.length === 0) {
        return get(guildId);
    }
    
    return result.rows[0] as unknown as AutoModSettings;
}

/**
 * Get or create auto-mod settings
 */
async function getOrCreate(guildId: string): Promise<AutoModSettings | null> {
    const existing = await get(guildId);
    if (existing) return existing;
    return create(guildId);
}

/**
 * Update auto-mod settings
 */
async function update(guildId: string, updates: AutoModUpdateData): Promise<AutoModSettings | null> {
    const allowedFields = [
        'enabled', 'filter_enabled', 'filtered_words',
        'spam_enabled', 'spam_threshold', 'spam_interval', 'spam_window_ms', 'spam_action', 'spam_mute_duration_ms',
        'duplicate_enabled', 'duplicate_threshold', 'duplicate_window_ms', 'duplicate_action',
        'links_enabled', 'links_whitelist', 'links_action',
        'mention_enabled', 'mention_limit', 'mention_action',
        'caps_enabled', 'caps_percent', 'caps_percentage', 'caps_min_length', 'caps_action',
        'invites_enabled', 'invites_whitelist', 'invites_action',
        'new_account_enabled', 'new_account_age_hours', 'new_account_action',
        'raid_enabled', 'raid_join_threshold', 'raid_window_ms', 'raid_action', 'raid_auto_unlock_ms',
        'ignored_channels', 'ignored_roles', 'log_channel_id',
        'auto_warn', 'mute_duration', 'default_action',
        'warn_threshold', 'warn_action', 'warn_reset_hours'
    ];
    
    const setClauses: string[] = [];
    const params: any[] = [guildId];
    let paramIndex = 2;
    
    for (const field of allowedFields) {
        // Convert camelCase to snake_case for lookup
        const snakeField = field;
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        
        const value = updates[snakeField] ?? updates[camelField];
        if (value !== undefined) {
            setClauses.push(`${snakeField} = $${paramIndex++}`);
            params.push(Array.isArray(value) ? value : value);
        }
    }
    
    if (setClauses.length === 0) return get(guildId);
    
    const result = await db.query(
        `UPDATE automod_settings 
         SET ${setClauses.join(', ')}
         WHERE guild_id = $1
         RETURNING *`,
        params
    );
    
    return (result.rows[0] as unknown as AutoModSettings) || null;
}

/**
 * Toggle a specific auto-mod feature
 */
async function toggleFeature(guildId: string, feature: string, enabled: boolean): Promise<AutoModSettings | null> {
    const fieldName = `${feature}_enabled`;
    return update(guildId, { [fieldName]: enabled });
}

/**
 * Add channel to ignored list
 */
async function addIgnoredChannel(guildId: string, channelId: string): Promise<AutoModSettings | null> {
    const result = await db.query(
        `UPDATE automod_settings 
         SET ignored_channels = array_append(
             COALESCE(ignored_channels, '{}'), 
             $2
         )
         WHERE guild_id = $1 AND NOT ($2 = ANY(COALESCE(ignored_channels, '{}')))
         RETURNING *`,
        [guildId, channelId]
    );
    return (result.rows[0] as unknown as AutoModSettings) || get(guildId);
}

/**
 * Remove channel from ignored list
 */
async function removeIgnoredChannel(guildId: string, channelId: string): Promise<AutoModSettings | null> {
    const result = await db.query(
        `UPDATE automod_settings 
         SET ignored_channels = array_remove(ignored_channels, $2)
         WHERE guild_id = $1
         RETURNING *`,
        [guildId, channelId]
    );
    return (result.rows[0] as unknown as AutoModSettings) || null;
}

/**
 * Add role to ignored list
 */
async function addIgnoredRole(guildId: string, roleId: string): Promise<AutoModSettings | null> {
    const result = await db.query(
        `UPDATE automod_settings 
         SET ignored_roles = array_append(
             COALESCE(ignored_roles, '{}'), 
             $2
         )
         WHERE guild_id = $1 AND NOT ($2 = ANY(COALESCE(ignored_roles, '{}')))
         RETURNING *`,
        [guildId, roleId]
    );
    return (result.rows[0] as unknown as AutoModSettings) || get(guildId);
}

/**
 * Remove role from ignored list
 */
async function removeIgnoredRole(guildId: string, roleId: string): Promise<AutoModSettings | null> {
    const result = await db.query(
        `UPDATE automod_settings 
         SET ignored_roles = array_remove(ignored_roles, $2)
         WHERE guild_id = $1
         RETURNING *`,
        [guildId, roleId]
    );
    return (result.rows[0] as unknown as AutoModSettings) || null;
}

/**
 * Delete auto-mod settings for a guild
 */
async function remove(guildId: string): Promise<boolean> {
    const result = await db.query(
        `DELETE FROM automod_settings WHERE guild_id = $1`,
        [guildId]
    );
    return (result.rowCount ?? 0) > 0;
}

/**
 * Get all guilds with auto-mod enabled
 */
async function getEnabledGuilds(): Promise<string[]> {
    const result = await db.query(
        `SELECT guild_id FROM automod_settings WHERE enabled = true`
    );
    return (result.rows as unknown as { guild_id: string }[]).map(r => r.guild_id);
}

// Export as module object
const AutoModRepository = {
    get,
    create,
    getOrCreate,
    update,
    toggleFeature,
    addIgnoredChannel,
    removeIgnoredChannel,
    addIgnoredRole,
    removeIgnoredRole,
    remove,
    getEnabledGuilds
};

export { 
    AutoModRepository,
    get,
    create,
    getOrCreate,
    update,
    toggleFeature,
    addIgnoredChannel,
    removeIgnoredChannel,
    addIgnoredRole,
    removeIgnoredRole,
    remove,
    getEnabledGuilds
};
export type { AutoModSettings, AutoModUpdateData, AutoModAction };
export default AutoModRepository;
