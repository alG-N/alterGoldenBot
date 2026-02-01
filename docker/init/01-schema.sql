-- alterGolden PostgreSQL Database Schema
-- This script runs automatically when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- GUILD SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id VARCHAR(20) PRIMARY KEY,
    prefix VARCHAR(10) DEFAULT '!',
    language VARCHAR(10) DEFAULT 'en',
    welcome_channel VARCHAR(20),
    welcome_message TEXT,
    log_channel VARCHAR(20),
    mod_log_channel VARCHAR(20),
    music_channel VARCHAR(20),
    dj_role VARCHAR(20),
    mute_role VARCHAR(20),
    auto_role VARCHAR(20),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MODERATION LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    moderator_id VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL, -- kick, ban, mute, warn, timeout
    reason TEXT,
    duration INTEGER, -- in seconds, for timeouts/mutes
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mod_logs_guild ON moderation_logs(guild_id);
CREATE INDEX idx_mod_logs_user ON moderation_logs(user_id);
CREATE INDEX idx_mod_logs_active ON moderation_logs(guild_id, active) WHERE active = true;

-- ==========================================
-- USER DATA TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_data (
    user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(100),
    global_xp INTEGER DEFAULT 0,
    global_level INTEGER DEFAULT 1,
    coins BIGINT DEFAULT 0,
    premium_until TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    badges JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- GUILD USER DATA TABLE (Per-server stats)
-- ==========================================
CREATE TABLE IF NOT EXISTS guild_user_data (
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    messages INTEGER DEFAULT 0,
    voice_time INTEGER DEFAULT 0, -- in seconds
    warns INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, user_id)
);

CREATE INDEX idx_guild_user_level ON guild_user_data(guild_id, level DESC);
CREATE INDEX idx_guild_user_xp ON guild_user_data(guild_id, xp DESC);

-- ==========================================
-- AFK TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS afk_users (
    user_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    reason TEXT DEFAULT 'AFK',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, guild_id)
);

-- ==========================================
-- SNIPE TABLE (Deleted messages)
-- ==========================================
CREATE TABLE IF NOT EXISTS snipes (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    content TEXT,
    attachments JSONB DEFAULT '[]',
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snipes_channel ON snipes(channel_id, deleted_at DESC);

-- Auto-cleanup old snipes (keep last 10 per channel)
CREATE OR REPLACE FUNCTION cleanup_old_snipes()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM snipes 
    WHERE channel_id = NEW.channel_id 
    AND id NOT IN (
        SELECT id FROM snipes 
        WHERE channel_id = NEW.channel_id 
        ORDER BY deleted_at DESC 
        LIMIT 10
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_snipes
    AFTER INSERT ON snipes
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_snipes();

-- ==========================================
-- MUSIC PLAYLISTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tracks JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_playlists_user ON playlists(user_id);
CREATE INDEX idx_playlists_public ON playlists(is_public) WHERE is_public = true;

-- ==========================================
-- BOT STATISTICS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS bot_stats (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE UNIQUE,
    commands_used INTEGER DEFAULT 0,
    messages_seen INTEGER DEFAULT 0,
    guilds_joined INTEGER DEFAULT 0,
    guilds_left INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    uptime_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- COMMAND USAGE ANALYTICS
-- ==========================================
CREATE TABLE IF NOT EXISTS command_analytics (
    id SERIAL PRIMARY KEY,
    command_name VARCHAR(50) NOT NULL,
    guild_id VARCHAR(20),
    user_id VARCHAR(20) NOT NULL,
    success BOOLEAN DEFAULT true,
    execution_time INTEGER, -- in milliseconds
    error_message TEXT,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cmd_analytics_name ON command_analytics(command_name);
CREATE INDEX idx_cmd_analytics_date ON command_analytics(used_at);

-- ==========================================
-- UPDATE TIMESTAMP FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_guild_settings_timestamp
    BEFORE UPDATE ON guild_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_data_timestamp
    BEFORE UPDATE ON user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_guild_user_data_timestamp
    BEFORE UPDATE ON guild_user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_playlists_timestamp
    BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- INITIAL DATA
-- ==========================================
INSERT INTO bot_stats (date, commands_used) VALUES (CURRENT_DATE, 0)
ON CONFLICT (date) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO altergolden;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO altergolden;

-- ==========================================
-- ANIME FAVOURITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS anime_favourites (
    user_id VARCHAR(20) NOT NULL,
    anime_id INTEGER NOT NULL,
    anime_title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, anime_id)
);

CREATE INDEX idx_anime_fav_user ON anime_favourites(user_id);

-- ==========================================
-- ANIME NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS anime_notifications (
    user_id VARCHAR(20) NOT NULL,
    anime_id INTEGER NOT NULL,
    notify BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, anime_id)
);

CREATE INDEX idx_anime_notif_enabled ON anime_notifications(notify) WHERE notify = true;
