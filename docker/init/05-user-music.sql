-- User Music Data Migration
-- Persists user music preferences, favorites, and history to PostgreSQL
-- Previously stored in-memory only (lost across shards and restarts)

-- ==========================================
-- USER MUSIC PREFERENCES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_music_preferences (
    user_id VARCHAR(20) PRIMARY KEY,
    default_volume INTEGER DEFAULT 100,
    auto_play BOOLEAN DEFAULT FALSE,
    announce_track BOOLEAN DEFAULT TRUE,
    compact_mode BOOLEAN DEFAULT FALSE,
    dj_mode BOOLEAN DEFAULT FALSE,
    max_track_duration INTEGER DEFAULT 600,
    max_queue_size INTEGER DEFAULT 100,
    preferred_source VARCHAR(32) DEFAULT 'youtube',
    show_thumbnails BOOLEAN DEFAULT TRUE,
    auto_leave_empty BOOLEAN DEFAULT TRUE,
    vote_skip_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_user_music_preferences_timestamp
    BEFORE UPDATE ON user_music_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- USER MUSIC FAVORITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_music_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    duration INTEGER,
    thumbnail TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_user_music_favorites_user_id 
    ON user_music_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_user_music_favorites_user_added 
    ON user_music_favorites(user_id, added_at DESC);

-- ==========================================
-- USER MUSIC HISTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_music_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    duration INTEGER,
    thumbnail TEXT,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_music_history_user_id 
    ON user_music_history(user_id);

CREATE INDEX IF NOT EXISTS idx_user_music_history_user_played 
    ON user_music_history(user_id, played_at DESC);

-- Keep history bounded: function to trim old entries
CREATE OR REPLACE FUNCTION trim_user_music_history()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM user_music_history
    WHERE id IN (
        SELECT id FROM user_music_history
        WHERE user_id = NEW.user_id
        ORDER BY played_at DESC
        OFFSET 100
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trim_user_music_history_trigger
    AFTER INSERT ON user_music_history
    FOR EACH ROW EXECUTE FUNCTION trim_user_music_history();
