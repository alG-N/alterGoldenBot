# 🤖 alterGolden Discord Bot

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14.19-blue?logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A feature-rich Discord bot with music streaming, video downloads, API integrations, and moderation tools.**

</div>

---

## ✨ Features Overview

| Category | Features |
|----------|----------|
| 🎵 **Music** | Lavalink-powered streaming, queue management, autoplay, lyrics, favorites |
| 📹 **Video** | Download videos via Cobalt API |
| 🔌 **APIs** | Reddit, Pixiv, NHentai, Rule34, Steam, Wikipedia, Google, Anime, Fandom |
| 🛡️ **Moderation** | Ban, kick, mute, timeout, snipe deleted messages |
| ⚙️ **Settings** | Per-server configuration, NSFW controls |
| 🎮 **Fun** | Death Battle, Say commands |
| 📊 **Analytics** | Command usage tracking via PostgreSQL |

---

## 🏗️ Architecture

```
alterGolden-backend/
├── 📁 src/
│   ├── 📁 commands/           # Slash commands (organized by category)
│   │   ├── admin/             # Moderation: ban, kick, mute, delete, snipe, setting
│   │   ├── api/               # External APIs: anime, reddit, pixiv, steam, etc.
│   │   ├── fun/               # Entertainment: deathbattle, say
│   │   ├── general/           # Utility: ping, help, avatar, afk, serverinfo
│   │   ├── music/             # Music player commands
│   │   ├── video/             # Video download commands
│   │   └── owner/             # Bot owner only commands
│   │
│   ├── 📁 config/             # Configuration files
│   │   ├── bot.js             # Bot settings
│   │   ├── database.js        # Database config
│   │   ├── services.js        # External service configs
│   │   ├── deathbattle/       # Skillsets: JJK, Naruto, One Piece, Demon Slayer
│   │   └── features/          # Feature-specific configs
│   │
│   ├── 📁 core/               # Core modules
│   │   ├── Client.js          # Extended Discord Client
│   │   ├── Logger.js          # Logging utility
│   │   ├── bootstrap.js       # Initialization
│   │   ├── errorHandler.js    # Global error handling
│   │   └── shutdown.js        # Graceful shutdown
│   │
│   ├── 📁 services/           # Business logic layer
│   │   ├── api/               # API service implementations
│   │   ├── music/             # MusicService, LavalinkService
│   │   ├── video/             # VideoService (Cobalt integration)
│   │   ├── moderation/        # Moderation actions
│   │   ├── guild/             # Guild settings management
│   │   └── registry/          # Command/event registration
│   │
│   ├── 📁 handlers/           # Interaction handlers
│   │   ├── api/               # API response handlers (embeds, buttons)
│   │   └── music/             # Music UI handlers (buttons, queue, etc.)
│   │
│   ├── 📁 cache/              # In-memory caching
│   │   ├── CacheManager.js    # Cache orchestration
│   │   └── BaseCache.js       # Base cache class
│   │
│   ├── 📁 database/           # Database layer
│   │   ├── postgres.js        # PostgreSQL connection
│   │   └── admin.js           # Admin queries
│   │
│   ├── 📁 events/             # Discord event listeners
│   │   ├── messageCreate.js   # Message handling
│   │   ├── voiceStateUpdate.js # Voice channel events
│   │   └── ready.js           # Bot ready event
│   │
│   ├── 📁 middleware/         # Request middleware
│   │   ├── access.js          # Permission checks
│   │   └── voiceChannelCheck.js # Voice channel validation
│   │
│   ├── 📁 utils/              # Utility functions
│   │   ├── common/            # General utilities
│   │   ├── music/             # Music-specific utilities
│   │   └── deathbattle/       # Game utilities
│   │
│   └── 📁 data/               # Runtime data files
│       ├── afk.json           # AFK user data
│       └── maintenanceState.json
│
├── 📁 docker/
│   └── init/                  # PostgreSQL init scripts
│
├── 🐳 docker-compose.yml      # Docker services config
├── 🐳 Dockerfile              # Bot container definition
└── 📦 package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ 
- **Docker** & Docker Compose
- **Discord Bot Token** ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd alterGolden-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start Docker services (PostgreSQL, Lavalink)
npm run docker:up

# 5. Run the bot
npm start
```

### Development Mode

```bash
npm run dev  # Auto-restart on file changes
```

---

## ⚙️ Configuration

### Environment Variables

```env
# ═══════════════════════════════════════════
# Discord Configuration
# ═══════════════════════════════════════════
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id
OWNER_ID=your_discord_user_id

# ═══════════════════════════════════════════
# Database (PostgreSQL)
# ═══════════════════════════════════════════
DB_HOST=localhost
DB_PORT=5432
DB_USER=altergolden
DB_PASSWORD=altergolden_secret
DB_NAME=altergolden_db

# ═══════════════════════════════════════════
# Lavalink (Music)
# ═══════════════════════════════════════════
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass

# ═══════════════════════════════════════════
# External APIs (Optional)
# ═══════════════════════════════════════════
PIXIV_REFRESH_TOKEN=your_pixiv_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
STEAM_API_KEY=your_steam_api_key
COBALT_API_URL=https://your-cobalt-instance.com
```

---

## 🐳 Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start all services (PostgreSQL, Lavalink) |
| `npm run docker:down` | Stop all services |
| `npm run docker:logs` | View service logs |
| `npm run docker:build` | Rebuild containers |
| `npm run docker:restart` | Restart all services |

---

## 📋 Command Reference

### 🛡️ Admin Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/ban <user> [reason]` | Ban a user from the server | Ban Members |
| `/kick <user> [reason]` | Kick a user from the server | Kick Members |
| `/mute <user> <duration>` | Timeout a user | Moderate Members |
| `/delete <amount>` | Bulk delete messages (1-100) | Manage Messages |
| `/snipe [channel]` | View recently deleted messages | Manage Messages |
| `/setting <option>` | Configure guild settings | Administrator |

### 🎵 Music Commands

| Command | Description |
|---------|-------------|
| `/music play <query>` | Play a song or add to queue |
| `/music stop` | Stop playback and clear queue |
| `/music skip` | Skip current track |
| `/music queue` | View current queue |
| `/music volume <1-200>` | Adjust volume |
| `/music pause` | Pause/Resume playback |
| `/music loop <off\|track\|queue>` | Set loop mode |
| `/music shuffle` | Shuffle the queue |
| `/music nowplaying` | Show current track info |
| `/music seek <time>` | Seek to position |
| `/music lyrics` | Get lyrics for current song |
| `/music favorites` | Manage favorite tracks |

#### Music Controls (Button Interface)

```
┌─────────────────────────────────────────────────────┐
│  ⏸️ Pause  │  ⏹️ Stop  │  ⏭️ Skip  │  🔁 Loop  │  🔀 Shuffle  │
├─────────────────────────────────────────────────────┤
│  🔉 -10  │  🔊 +10  │  📋 Queue  │  🎵 Autoplay  │
├─────────────────────────────────────────────────────┤
│  🔗 Open Link  │  📝 Lyrics  │  🗳️ Vote Skip  │
└─────────────────────────────────────────────────────┘
```

**Autoplay Feature:**
- When enabled, automatically finds and plays similar tracks when queue ends
- Disables Shuffle and Loop modes (they conflict with autoplay logic)
- Uses intelligent search strategies based on artist, genre, and track similarity

### 🔌 API Commands

| Command | Description |
|---------|-------------|
| `/anime <title>` | Search anime on AniList |
| `/reddit <subreddit>` | Get posts from subreddit |
| `/pixiv <query>` | Search Pixiv artwork |
| `/nhentai <query>` | Search NHentai (NSFW) |
| `/rule34 <query>` | Search Rule34 (NSFW) |
| `/steam <game>` | Get Steam game info & deals |
| `/wikipedia <query>` | Search Wikipedia |
| `/google <query>` | Google search |
| `/fandom <wiki> <query>` | Search Fandom wikis |

### 📹 Video Commands

| Command | Description |
|---------|-------------|
| `/video download <url>` | Download video (YouTube, TikTok, Twitter, etc.) |

### 🎮 Fun Commands

| Command | Description |
|---------|-------------|
| `/deathbattle <user1> <user2>` | Simulate a battle between users |
| `/say <message>` | Make the bot say something |

### 📊 General Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency |
| `/help [command]` | View command help |
| `/avatar [user]` | Get user's avatar |
| `/serverinfo` | Server information |
| `/roleinfo <role>` | Role information |
| `/invite` | Bot invite link |
| `/afk [reason]` | Set AFK status |
| `/report <issue>` | Report a bug/issue |

### 👑 Owner Commands

| Command | Description |
|---------|-------------|
| `/botcheck` | Bot status and diagnostics |

---

## 🎵 Music System Details

### Supported Sources

- ✅ YouTube (search & direct links)
- ✅ YouTube Music
- ✅ Spotify (via Lavalink plugin)
- ✅ SoundCloud
- ✅ Bandcamp
- ✅ Vimeo
- ✅ Twitch streams
- ✅ HTTP streams

### Queue Management

- **Loop Modes:** Off, Track (repeat one), Queue (repeat all)
- **Shuffle:** Randomize queue order
- **Autoplay:** Auto-find similar tracks when queue ends
- **History:** Track recently played songs
- **Favorites:** Save and load favorite tracks

### Lyrics Integration

Uses multiple APIs for best coverage:
1. **LRCLIB** - Modern songs, synced lyrics
2. **lyrics.ovh** - Fallback source

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Guild settings
CREATE TABLE guild_settings (
    guild_id VARCHAR(20) PRIMARY KEY,
    prefix VARCHAR(10) DEFAULT '!',
    nsfw_enabled BOOLEAN DEFAULT false,
    mod_log_channel VARCHAR(20),
    settings JSONB DEFAULT '{}'
);

-- Command usage analytics
CREATE TABLE command_usage (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20),
    user_id VARCHAR(20),
    command_name VARCHAR(50),
    used_at TIMESTAMP DEFAULT NOW()
);

-- Moderation logs
CREATE TABLE mod_logs (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20),
    moderator_id VARCHAR(20),
    target_id VARCHAR(20),
    action VARCHAR(20),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Bot not responding | Check `BOT_TOKEN` in `.env` |
| Music not playing | Verify Lavalink is running: `docker-compose logs lavalink` |
| Database errors | Ensure PostgreSQL is running: `docker-compose ps` |
| Commands not showing | Re-invite bot with `applications.commands` scope |

### Logs

```bash
# Bot logs
npm run dev

# Docker service logs
npm run docker:logs

# Specific service
docker-compose logs -f lavalink
docker-compose logs -f postgres
```

---

## 📦 Dependencies

### Core
- `discord.js` ^14.19 - Discord API wrapper
- `shoukaku` ^4.1 - Lavalink client
- `pg` ^8.12 - PostgreSQL client

### APIs
- `axios` ^1.9 - HTTP client
- `graphql-request` - GraphQL client (AniList)
- `node-fetch` ^2.7 - Fetch API

### Media
- `@discordjs/voice` - Voice connections
- `@discordjs/opus` - Opus encoding
- `ffmpeg-static` - FFmpeg binary

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

**Made with ❤️ by alterGolden Team**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
