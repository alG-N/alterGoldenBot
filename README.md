# alterGolden Discord Bot

A professional Discord utility bot with music streaming, video downloads, API integrations, and moderation features.

## 🚀 Features

- **🎵 Music System** - Lavalink-powered music playback with queue management
- **📹 Video Downloads** - Download videos via Cobalt API
- **🔌 API Integrations** - Reddit, Pixiv, NHentai, Steam, Wikipedia, Google
- **🛡️ Moderation** - Kick, ban, mute, timeout with logging
- **⚙️ Guild Settings** - Per-server configuration
- **📊 Analytics** - Command usage tracking

## 📁 Project Structure

```
alterGolden-backend/
├── src/
│   ├── commands/          # Slash commands
│   │   ├── admin/         # Moderation commands
│   │   ├── general/       # Utility commands
│   │   └── owner/         # Bot owner commands
│   ├── config/            # Configuration files
│   ├── core/              # Core modules (Client, Logger, etc.)
│   ├── database/          # Database services (SQLite, PostgreSQL)
│   ├── events/            # Discord event handlers
│   ├── handlers/          # Interaction handlers
│   ├── middleware/        # Request middleware
│   ├── modules/           # Feature modules
│   │   ├── api/           # API commands (Reddit, Pixiv, etc.)
│   │   ├── music/         # Music system
│   │   ├── video/         # Video downloads
│   │   └── fun/           # Fun commands
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── docker/
│   ├── init/              # PostgreSQL init scripts
│   └── lavalink/          # Lavalink configuration
├── docker-compose.yml     # Docker services
├── Dockerfile             # Bot container
└── package.json
```

## 🛠️ Installation

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL, Lavalink, Redis)
- Discord Bot Token

### Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository>
   cd alterGolden-backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start services with Docker:**
   ```bash
   npm run docker:up
   ```

4. **Run the bot:**
   ```bash
   npm start
   ```

### Development Mode

```bash
npm run dev
```

## 🐳 Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start all services |
| `npm run docker:down` | Stop all services |
| `npm run docker:logs` | View logs |
| `npm run docker:build` | Rebuild containers |
| `npm run docker:restart` | Restart services |

## 📊 Commands

### Admin Commands (6)
- `/ban` - Ban a user
- `/kick` - Kick a user
- `/mute` - Mute a user
- `/delete` - Bulk delete messages
- `/snipe` - View deleted messages
- `/setting` - Configure guild settings

### General Commands (8)
- `/ping` - Bot latency
- `/help` - Command help
- `/avatar` - User avatar
- `/invite` - Bot invite link
- `/serverinfo` - Server information
- `/roleinfo` - Role information
- `/afk` - Set AFK status
- `/report` - Report an issue

### Music Commands
- `/music play` - Play a song
- `/music stop` - Stop playback
- `/music skip` - Skip current track
- `/music queue` - View queue
- `/music volume` - Adjust volume
- And more...

### API Commands (8)
- `/anime` - Search anime
- `/reddit` - Reddit posts
- `/pixiv` - Pixiv artwork
- `/steam` - Steam game info
- `/wikipedia` - Wikipedia search
- `/google` - Google search

## 🔧 Configuration

### Environment Variables

```env
# Discord
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id
OWNER_ID=your_user_id

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=altergolden
DB_PASSWORD=altergolden_secret
DB_NAME=altergolden_db

# Lavalink
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
```

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 👤 Author

alterGolden Team
