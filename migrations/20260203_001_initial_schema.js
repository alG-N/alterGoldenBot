/**
 * Initial Schema Migration
 * Core tables: guild_settings, user_data, guild_user_data, afk_users, snipes
 * 
 * @type {import('knex').Knex.Migration}
 */

exports.up = async function(knex) {
    // Enable UUID extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // ==========================================
    // GUILD SETTINGS TABLE
    // ==========================================
    await knex.schema.createTable('guild_settings', (table) => {
        table.string('guild_id', 20).primary();
        table.string('prefix', 10).defaultTo('!');
        table.string('language', 10).defaultTo('en');
        table.string('welcome_channel', 20);
        table.text('welcome_message');
        table.string('log_channel', 20);
        table.string('mod_log_channel', 20);
        table.string('music_channel', 20);
        table.string('dj_role', 20);
        table.string('mute_role', 20);
        table.string('auto_role', 20);
        table.jsonb('settings').defaultTo('{}');
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    // ==========================================
    // USER DATA TABLE
    // ==========================================
    await knex.schema.createTable('user_data', (table) => {
        table.string('user_id', 20).primary();
        table.string('username', 100);
        table.integer('global_xp').defaultTo(0);
        table.integer('global_level').defaultTo(1);
        table.bigInteger('coins').defaultTo(0);
        table.timestamp('premium_until', { useTz: true });
        table.jsonb('settings').defaultTo('{}');
        table.jsonb('badges').defaultTo('[]');
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    // ==========================================
    // GUILD USER DATA TABLE (Per-server stats)
    // ==========================================
    await knex.schema.createTable('guild_user_data', (table) => {
        table.string('guild_id', 20).notNullable();
        table.string('user_id', 20).notNullable();
        table.integer('xp').defaultTo(0);
        table.integer('level').defaultTo(1);
        table.integer('messages').defaultTo(0);
        table.integer('voice_time').defaultTo(0); // in seconds
        table.integer('warns').defaultTo(0);
        table.timestamp('last_message_at', { useTz: true });
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
        table.primary(['guild_id', 'user_id']);
    });

    await knex.schema.raw('CREATE INDEX idx_guild_user_level ON guild_user_data(guild_id, level DESC)');
    await knex.schema.raw('CREATE INDEX idx_guild_user_xp ON guild_user_data(guild_id, xp DESC)');

    // ==========================================
    // AFK TABLE
    // ==========================================
    await knex.schema.createTable('afk_users', (table) => {
        table.string('user_id', 20).notNullable();
        table.string('guild_id', 20).notNullable();
        table.text('reason').defaultTo('AFK');
        table.timestamp('started_at', { useTz: true }).defaultTo(knex.fn.now());
        table.primary(['user_id', 'guild_id']);
    });

    // ==========================================
    // SNIPE TABLE (Deleted messages)
    // ==========================================
    await knex.schema.createTable('snipes', (table) => {
        table.increments('id').primary();
        table.string('channel_id', 20).notNullable();
        table.string('guild_id', 20).notNullable();
        table.string('user_id', 20).notNullable();
        table.text('content');
        table.jsonb('attachments').defaultTo('[]');
        table.timestamp('deleted_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.raw('CREATE INDEX idx_snipes_channel ON snipes(channel_id, deleted_at DESC)');

    // ==========================================
    // MODERATION LOGS TABLE
    // ==========================================
    await knex.schema.createTable('moderation_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('guild_id', 20).notNullable();
        table.string('user_id', 20).notNullable();
        table.string('moderator_id', 20).notNullable();
        table.string('action', 20).notNullable();
        table.text('reason');
        table.integer('duration'); // in seconds
        table.timestamp('expires_at', { useTz: true });
        table.boolean('active').defaultTo(true);
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.raw('CREATE INDEX idx_mod_logs_guild ON moderation_logs(guild_id)');
    await knex.schema.raw('CREATE INDEX idx_mod_logs_user ON moderation_logs(user_id)');
    await knex.schema.raw('CREATE INDEX idx_mod_logs_active ON moderation_logs(guild_id, active) WHERE active = true');

    // ==========================================
    // MUSIC PLAYLISTS TABLE
    // ==========================================
    await knex.schema.createTable('playlists', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('user_id', 20).notNullable();
        table.string('name', 100).notNullable();
        table.text('description');
        table.jsonb('tracks').defaultTo('[]');
        table.boolean('is_public').defaultTo(false);
        table.integer('play_count').defaultTo(0);
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
        table.unique(['user_id', 'name']);
    });

    await knex.schema.raw('CREATE INDEX idx_playlists_user ON playlists(user_id)');
    await knex.schema.raw('CREATE INDEX idx_playlists_public ON playlists(is_public) WHERE is_public = true');

    // ==========================================
    // BOT STATISTICS TABLE
    // ==========================================
    await knex.schema.createTable('bot_stats', (table) => {
        table.increments('id').primary();
        table.date('date').unique().defaultTo(knex.raw('CURRENT_DATE'));
        table.integer('commands_used').defaultTo(0);
        table.integer('messages_seen').defaultTo(0);
        table.integer('guilds_joined').defaultTo(0);
        table.integer('guilds_left').defaultTo(0);
        table.integer('errors').defaultTo(0);
        table.integer('uptime_seconds').defaultTo(0);
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    // ==========================================
    // COMMAND USAGE ANALYTICS
    // ==========================================
    await knex.schema.createTable('command_analytics', (table) => {
        table.increments('id').primary();
        table.string('command_name', 50).notNullable();
        table.string('guild_id', 20);
        table.string('user_id', 20).notNullable();
        table.boolean('success').defaultTo(true);
        table.integer('execution_time'); // in milliseconds
        table.text('error_message');
        table.timestamp('used_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.raw('CREATE INDEX idx_cmd_analytics_name ON command_analytics(command_name)');
    await knex.schema.raw('CREATE INDEX idx_cmd_analytics_date ON command_analytics(used_at)');
    await knex.schema.raw('CREATE INDEX idx_cmd_analytics_user ON command_analytics(user_id)');
    await knex.schema.raw('CREATE INDEX idx_cmd_analytics_user_date ON command_analytics(user_id, used_at DESC)');

    // ==========================================
    // ANIME FAVOURITES TABLE
    // ==========================================
    await knex.schema.createTable('anime_favourites', (table) => {
        table.string('user_id', 20).notNullable();
        table.integer('anime_id').notNullable();
        table.text('anime_title').notNullable();
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.primary(['user_id', 'anime_id']);
    });

    await knex.schema.raw('CREATE INDEX idx_anime_fav_user ON anime_favourites(user_id)');

    // ==========================================
    // ANIME NOTIFICATIONS TABLE
    // ==========================================
    await knex.schema.createTable('anime_notifications', (table) => {
        table.string('user_id', 20).notNullable();
        table.integer('anime_id').notNullable();
        table.boolean('notify').defaultTo(false);
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
        table.primary(['user_id', 'anime_id']);
    });

    await knex.schema.raw('CREATE INDEX idx_anime_notif_enabled ON anime_notifications(notify) WHERE notify = true');

    // ==========================================
    // UPDATE TIMESTAMP FUNCTION
    // ==========================================
    await knex.raw(`
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Apply triggers
    await knex.raw(`
        CREATE TRIGGER update_guild_settings_timestamp
            BEFORE UPDATE ON guild_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await knex.raw(`
        CREATE TRIGGER update_user_data_timestamp
            BEFORE UPDATE ON user_data
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await knex.raw(`
        CREATE TRIGGER update_guild_user_data_timestamp
            BEFORE UPDATE ON guild_user_data
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await knex.raw(`
        CREATE TRIGGER update_playlists_timestamp
            BEFORE UPDATE ON playlists
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    // ==========================================
    // SNIPE CLEANUP FUNCTION
    // ==========================================
    await knex.raw(`
        CREATE OR REPLACE FUNCTION cleanup_old_snipes()
        RETURNS TRIGGER AS $$
        BEGIN
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY channel_id 
                    ORDER BY deleted_at DESC
                ) as rn
                FROM snipes
                WHERE channel_id = NEW.channel_id
            )
            DELETE FROM snipes
            WHERE id IN (
                SELECT id FROM ranked WHERE rn > 10
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await knex.raw(`
        CREATE TRIGGER trigger_cleanup_snipes
            AFTER INSERT ON snipes
            FOR EACH ROW
            EXECUTE FUNCTION cleanup_old_snipes();
    `);

    // Initial data
    await knex.raw(`
        INSERT INTO bot_stats (date, commands_used) VALUES (CURRENT_DATE, 0)
        ON CONFLICT (date) DO NOTHING;
    `);
};

exports.down = async function(knex) {
    // Drop triggers first
    await knex.raw('DROP TRIGGER IF EXISTS trigger_cleanup_snipes ON snipes');
    await knex.raw('DROP TRIGGER IF EXISTS update_playlists_timestamp ON playlists');
    await knex.raw('DROP TRIGGER IF EXISTS update_guild_user_data_timestamp ON guild_user_data');
    await knex.raw('DROP TRIGGER IF EXISTS update_user_data_timestamp ON user_data');
    await knex.raw('DROP TRIGGER IF EXISTS update_guild_settings_timestamp ON guild_settings');

    // Drop functions
    await knex.raw('DROP FUNCTION IF EXISTS cleanup_old_snipes()');
    await knex.raw('DROP FUNCTION IF EXISTS update_updated_at()');

    // Drop tables in reverse order
    await knex.schema.dropTableIfExists('anime_notifications');
    await knex.schema.dropTableIfExists('anime_favourites');
    await knex.schema.dropTableIfExists('command_analytics');
    await knex.schema.dropTableIfExists('bot_stats');
    await knex.schema.dropTableIfExists('playlists');
    await knex.schema.dropTableIfExists('moderation_logs');
    await knex.schema.dropTableIfExists('snipes');
    await knex.schema.dropTableIfExists('afk_users');
    await knex.schema.dropTableIfExists('guild_user_data');
    await knex.schema.dropTableIfExists('user_data');
    await knex.schema.dropTableIfExists('guild_settings');
};
