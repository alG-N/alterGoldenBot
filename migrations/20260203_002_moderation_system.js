/**
 * Moderation System Migration
 * Tables: mod_infractions, automod_settings, word_filters, mod_log_settings, warn_thresholds, raid_mode
 * 
 * @type {import('knex').Knex.Migration}
 */

exports.up = async function(knex) {
    // ==========================================
    // MOD INFRACTIONS TABLE
    // ==========================================
    await knex.schema.createTable('mod_infractions', (table) => {
        table.increments('id').primary();
        table.integer('case_id').notNullable();
        table.string('guild_id', 32).notNullable();
        table.string('user_id', 32).notNullable();
        table.string('moderator_id', 32).notNullable();
        table.string('type', 20).notNullable(); // warn, mute, kick, ban, unmute, unban, filter, automod
        table.text('reason');
        table.bigInteger('duration_ms'); // For timed punishments
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at');
        table.boolean('active').defaultTo(true);
        table.integer('reference_id'); // Reference to related case
        table.jsonb('metadata').defaultTo('{}');
        table.unique(['guild_id', 'case_id']);
    });

    await knex.raw('CREATE INDEX idx_infractions_guild ON mod_infractions(guild_id)');
    await knex.raw('CREATE INDEX idx_infractions_user ON mod_infractions(guild_id, user_id)');
    await knex.raw('CREATE INDEX idx_infractions_active ON mod_infractions(guild_id, active) WHERE active = true');
    await knex.raw('CREATE INDEX idx_infractions_type ON mod_infractions(guild_id, type)');
    await knex.raw('CREATE INDEX idx_infractions_created ON mod_infractions(created_at DESC)');
    await knex.raw('CREATE INDEX idx_infractions_expires ON mod_infractions(expires_at) WHERE expires_at IS NOT NULL');

    // ==========================================
    // AUTOMOD SETTINGS TABLE
    // ==========================================
    await knex.schema.createTable('automod_settings', (table) => {
        table.string('guild_id', 32).primary();
        table.boolean('enabled').defaultTo(false);

        // Spam protection
        table.boolean('spam_enabled').defaultTo(false);
        table.integer('spam_threshold').defaultTo(5);
        table.integer('spam_window_ms').defaultTo(5000);
        table.string('spam_action', 20).defaultTo('delete_warn');
        table.bigInteger('spam_mute_duration_ms').defaultTo(300000);

        // Duplicate message detection
        table.boolean('duplicate_enabled').defaultTo(false);
        table.integer('duplicate_threshold').defaultTo(3);
        table.integer('duplicate_window_ms').defaultTo(30000);
        table.string('duplicate_action', 20).defaultTo('delete_warn');

        // Link filter
        table.boolean('links_enabled').defaultTo(false);
        table.specificType('links_whitelist', 'TEXT[]').defaultTo('{}');
        table.string('links_action', 20).defaultTo('delete_warn');

        // Mention spam
        table.boolean('mention_enabled').defaultTo(false);
        table.integer('mention_limit').defaultTo(5);
        table.string('mention_action', 20).defaultTo('delete_warn');

        // Caps spam
        table.boolean('caps_enabled').defaultTo(false);
        table.integer('caps_percent').defaultTo(70);
        table.integer('caps_min_length').defaultTo(10);
        table.string('caps_action', 20).defaultTo('delete');

        // Discord invite filter
        table.boolean('invites_enabled').defaultTo(false);
        table.specificType('invites_whitelist', 'TEXT[]').defaultTo('{}');
        table.string('invites_action', 20).defaultTo('delete_warn');

        // New account filter
        table.boolean('new_account_enabled').defaultTo(false);
        table.integer('new_account_age_hours').defaultTo(24);
        table.string('new_account_action', 20).defaultTo('kick');

        // Raid protection
        table.boolean('raid_enabled').defaultTo(false);
        table.integer('raid_join_threshold').defaultTo(10);
        table.integer('raid_window_ms').defaultTo(10000);
        table.string('raid_action', 20).defaultTo('lockdown');
        table.bigInteger('raid_auto_unlock_ms').defaultTo(300000);

        // Ignore lists
        table.specificType('ignored_channels', 'TEXT[]').defaultTo('{}');
        table.specificType('ignored_roles', 'TEXT[]').defaultTo('{}');

        // Log channel
        table.string('log_channel_id', 32);

        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // ==========================================
    // WORD FILTERS TABLE
    // ==========================================
    await knex.schema.createTable('word_filters', (table) => {
        table.increments('id').primary();
        table.string('guild_id', 32).notNullable();
        table.string('pattern', 200).notNullable();
        table.string('match_type', 20).defaultTo('contains'); // exact, contains, word, regex
        table.string('action', 20).defaultTo('delete_warn');
        table.integer('severity').defaultTo(1); // 1-5
        table.string('created_by', 32);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['guild_id', 'pattern']);
    });

    await knex.raw('CREATE INDEX idx_filters_guild ON word_filters(guild_id)');
    await knex.raw('CREATE INDEX idx_filters_severity ON word_filters(guild_id, severity)');

    // ==========================================
    // MOD LOG SETTINGS TABLE
    // ==========================================
    await knex.schema.createTable('mod_log_settings', (table) => {
        table.string('guild_id', 32).primary();
        table.string('log_channel_id', 32);

        // What to log
        table.boolean('log_warns').defaultTo(true);
        table.boolean('log_mutes').defaultTo(true);
        table.boolean('log_kicks').defaultTo(true);
        table.boolean('log_bans').defaultTo(true);
        table.boolean('log_unbans').defaultTo(true);
        table.boolean('log_automod').defaultTo(true);
        table.boolean('log_filters').defaultTo(true);
        table.boolean('log_message_deletes').defaultTo(false);
        table.boolean('log_message_edits').defaultTo(false);
        table.boolean('log_member_joins').defaultTo(false);
        table.boolean('log_member_leaves').defaultTo(false);
        table.boolean('log_role_changes').defaultTo(false);
        table.boolean('log_nickname_changes').defaultTo(false);

        // Format settings
        table.boolean('use_embeds').defaultTo(true);
        table.boolean('include_moderator').defaultTo(true);
        table.boolean('include_reason').defaultTo(true);

        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // ==========================================
    // WARNING THRESHOLDS TABLE
    // ==========================================
    await knex.schema.createTable('warn_thresholds', (table) => {
        table.increments('id').primary();
        table.string('guild_id', 32).notNullable();
        table.integer('warn_count').notNullable();
        table.string('action', 20).notNullable(); // mute, kick, ban
        table.bigInteger('duration_ms');
        table.text('reason').defaultTo('Automatic action due to warning threshold');
        table.unique(['guild_id', 'warn_count']);
    });

    // ==========================================
    // RAID MODE TABLE
    // ==========================================
    await knex.schema.createTable('raid_mode', (table) => {
        table.string('guild_id', 32).primary();
        table.boolean('active').defaultTo(false);
        table.timestamp('activated_at');
        table.string('activated_by', 32); // 'auto' or moderator ID
        table.timestamp('auto_unlock_at');
        table.specificType('locked_channels', 'TEXT[]').defaultTo('{}');
        table.jsonb('recent_joins').defaultTo('[]');
    });

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    await knex.raw(`
        CREATE OR REPLACE FUNCTION get_next_case_id(p_guild_id VARCHAR(32))
        RETURNS INT AS $$
        DECLARE
            next_id INT;
        BEGIN
            SELECT COALESCE(MAX(case_id), 0) + 1 INTO next_id
            FROM mod_infractions
            WHERE guild_id = p_guild_id;
            RETURN next_id;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await knex.raw(`
        CREATE OR REPLACE FUNCTION count_active_warns(p_guild_id VARCHAR(32), p_user_id VARCHAR(32))
        RETURNS INT AS $$
        BEGIN
            RETURN (
                SELECT COUNT(*)
                FROM mod_infractions
                WHERE guild_id = p_guild_id
                  AND user_id = p_user_id
                  AND type = 'warn'
                  AND active = true
                  AND (expires_at IS NULL OR expires_at > NOW())
            );
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Timestamp trigger function (may already exist)
    await knex.raw(`
        CREATE OR REPLACE FUNCTION update_moderation_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Apply timestamp triggers
    await knex.raw(`
        CREATE TRIGGER automod_timestamp
            BEFORE UPDATE ON automod_settings
            FOR EACH ROW EXECUTE FUNCTION update_moderation_timestamp();
    `);

    await knex.raw(`
        CREATE TRIGGER modlog_timestamp
            BEFORE UPDATE ON mod_log_settings
            FOR EACH ROW EXECUTE FUNCTION update_moderation_timestamp();
    `);
};

exports.down = async function(knex) {
    // Drop triggers
    await knex.raw('DROP TRIGGER IF EXISTS modlog_timestamp ON mod_log_settings');
    await knex.raw('DROP TRIGGER IF EXISTS automod_timestamp ON automod_settings');

    // Drop functions
    await knex.raw('DROP FUNCTION IF EXISTS count_active_warns(VARCHAR, VARCHAR)');
    await knex.raw('DROP FUNCTION IF EXISTS get_next_case_id(VARCHAR)');
    await knex.raw('DROP FUNCTION IF EXISTS update_moderation_timestamp()');

    // Drop tables
    await knex.schema.dropTableIfExists('raid_mode');
    await knex.schema.dropTableIfExists('warn_thresholds');
    await knex.schema.dropTableIfExists('mod_log_settings');
    await knex.schema.dropTableIfExists('word_filters');
    await knex.schema.dropTableIfExists('automod_settings');
    await knex.schema.dropTableIfExists('mod_infractions');
};
