# Sharding Guide - alterGolden Bot

Complete guide for scaling alterGolden to 1000+ servers using Discord.js sharding.

## Table of Contents

1. [Overview](#overview)
2. [When to Shard](#when-to-shard)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Cross-Shard Communication](#cross-shard-communication)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Discord requires bots to shard when reaching certain guild thresholds:
- **Recommended**: 1,000 guilds
- **Required**: 2,500 guilds
- **Maximum per shard**: 2,500 guilds

alterGolden uses Discord.js's built-in `ShardingManager` for horizontal scaling.

### How It Works

```
┌────────────────────────────────────────────────────────┐
│                  Sharding Manager                       │
│                   (sharding.ts)                         │
│  - Spawns shard processes                              │
│  - Health check server (:3001)                         │
│  - Auto-restart on crash                               │
└─────────────────────────┬──────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Shard 0     │ │   Shard 1     │ │   Shard 2     │
│ (index.ts)    │ │ (index.ts)    │ │ (index.ts)    │
│ Guilds 0-999  │ │ Guilds 1000+  │ │ Guilds 2000+  │
│ Health :3000  │ │ Health :3002  │ │ Health :3003  │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
              ┌──────────────────────┐
              │   Redis Pub/Sub      │
              │   (ShardBridge)      │
              │ Cross-shard comms    │
              └──────────────────────┘
```

---

## When to Shard

### Do Shard If:
- You have 1,000+ guilds
- You're approaching Discord's 2,500 guild limit
- Memory usage exceeds 1GB consistently
- Gateway latency is consistently high (>500ms)

### Don't Shard If:
- Under 1,000 guilds (adds unnecessary complexity)
- You're just testing locally
- You don't have multiple CPU cores

---

## Architecture

### File Structure

```
src/
├── sharding.ts          # Sharding manager entry point
├── index.ts             # Single shard entry point
└── services/
    └── guild/
        └── ShardBridge.ts   # Cross-shard communication
```

### Entry Points

| File | Purpose | Command |
|------|---------|---------|
| `sharding.ts` | Production (multi-shard) | `node dist/sharding.js` |
| `index.ts` | Development (single process) | `node dist/index.js` |

---

## Configuration

### Environment Variables

```env
# Sharding Configuration
SHARD_COUNT=auto                # 'auto' or specific number
SHARDS_PER_CLUSTER=1           # Shards per process (advanced)

# Redis (required for sharding)
REDIS_URL=redis://localhost:6379

# Health Server Ports
HEALTH_PORT=3000               # Base port (shard 0)
MANAGER_HEALTH_PORT=3001       # Manager health check
```

### Auto-Sharding

When `SHARD_COUNT=auto`, Discord calculates optimal shard count:
- API recommends shards based on your bot's guild count
- Adds buffer for growth

### Manual Sharding

Set specific shard count:
```env
SHARD_COUNT=3
```

### Shard-Specific Ports

Each shard gets a unique health port:
- Shard 0: `HEALTH_PORT` (default 3000)
- Shard 1: `HEALTH_PORT + 2` (3002)
- Shard 2: `HEALTH_PORT + 3` (3003)
- ...

---

## Deployment

### Development Mode

Single process, no sharding:
```bash
npm run dev
# or
node dist/index.js
```

### Production Mode

Multi-process with sharding:
```bash
npm start
# or
node dist/sharding.js
```

### Docker Deployment

```dockerfile
# Production with sharding
CMD ["node", "dist/sharding.js"]
```

### PM2 Deployment

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'altergolden',
    script: 'dist/sharding.js',
    instances: 1,  // ShardingManager handles processes
    autorestart: true,
    max_memory_restart: '2G'
  }]
};
```

---

## Cross-Shard Communication

### ShardBridge Service

The `ShardBridge` service enables communication between shards using Redis Pub/Sub.

### Available Methods

```typescript
import { ShardBridge } from './services/guild/ShardBridge';

// Get aggregate stats across all shards
const stats = await ShardBridge.getAggregateStats();
// { totalGuilds, totalUsers, totalChannels, shardCount, latencies }

// Find a guild by ID
const guild = await ShardBridge.findGuild('123456789');
// { found: true, shardId: 0, name: 'My Server', memberCount: 100 }

// Find a user by ID
const user = await ShardBridge.findUser('987654321');
// { found: true, shardId: 1, username: 'User#1234' }

// Broadcast event to all shards
await ShardBridge.broadcast('cacheInvalidate', { key: 'settings:*' });
```

### Usage in Commands

```typescript
// In ping.ts
import { ShardBridge } from '../services/guild/ShardBridge';

async run(interaction) {
    const stats = await ShardBridge.getAggregateStats();
    
    await interaction.reply(
        `Serving ${stats.totalGuilds} servers across ${stats.shardCount} shards`
    );
}
```

### Custom Cross-Shard Messages

```typescript
// Send to specific shard
client.shard?.send({ type: 'myEvent', data: { ... } });

// Handle in ShardingManager
manager.on('message', (shard, message) => {
    if (message.type === 'myEvent') {
        // Handle event
    }
});
```

---

## Monitoring

### Health Endpoints

Each shard exposes health endpoints:
- `/health` - Full health check
- `/ready` - Readiness probe
- `/live` - Liveness probe
- `/metrics` - Prometheus metrics

### Manager Health Check

The sharding manager runs its own health server on port 3001:
```
GET http://localhost:3001/health
```

Response:
```json
{
    "status": "healthy",
    "totalShards": 3,
    "shards": [
        { "id": 0, "status": "ready", "guilds": 850 },
        { "id": 1, "status": "ready", "guilds": 920 },
        { "id": 2, "status": "ready", "guilds": 780 }
    ]
}
```

### Prometheus Metrics

Metrics include shard labels:
```promql
# Guilds per shard
altergolden_discord_guilds_total{shard_id="0"}

# Total guilds across all shards
sum(altergolden_discord_guilds_total)

# Gateway latency by shard
altergolden_discord_gateway_latency_ms{shard_id="1"}
```

### Grafana Dashboard

See [MONITORING.md](./MONITORING.md) for dashboard setup.

---

## Troubleshooting

### Shard Won't Start

**Symptoms**: Shard crashes on startup

**Solutions**:
1. Check Discord token is valid
2. Verify Redis is running
3. Check logs for specific error
4. Ensure proper environment variables

### Cross-Shard Communication Fails

**Symptoms**: `ShardBridge.getAggregateStats()` returns incomplete data

**Solutions**:
1. Verify Redis connection on all shards
2. Check Redis Pub/Sub is working: `PSUBSCRIBE *`
3. Increase timeout in ShardBridge
4. Check shard IDs are unique

### High Memory Usage

**Symptoms**: Shards exceed memory limits

**Solutions**:
1. Reduce cache sizes
2. Enable cache sweepers:
```typescript
client.options.sweepers = {
    messages: { interval: 3600, lifetime: 1800 }
};
```
3. Increase SHARD_COUNT to distribute load

### Uneven Guild Distribution

**Symptoms**: Some shards have many more guilds

**Solutions**:
Discord assigns guilds based on ID hash - distribution is automatic.
If severely uneven:
1. Wait for natural rebalancing as guilds join/leave
2. File issue with Discord support if persistent

### Rate Limits

**Symptoms**: 429 errors across shards

**Solutions**:
1. ShardingManager handles global rate limits automatically
2. Reduce API-heavy operations
3. Use cache more aggressively
4. Check for API abuse in commands

---

## Advanced Topics

### Cluster Mode

For very large bots (50,000+ guilds), consider cluster mode:

```env
SHARDS_PER_CLUSTER=5
CLUSTER_COUNT=10
```

This runs multiple shards per process, reducing overhead.

### Blue-Green Deployment

For zero-downtime deployments:

1. Start new instance with same shard IDs
2. Old instance detects new connection, begins shutdown
3. Discord transfers sessions to new instance

### Shard-Specific Configuration

```typescript
// In index.ts
const shardId = client.shard?.ids[0] ?? 0;

if (shardId === 0) {
    // Only shard 0 runs scheduled tasks
    startScheduler();
}
```

---

## Resources

- [Discord.js Sharding Guide](https://discordjs.guide/sharding/)
- [Discord Sharding Documentation](https://discord.com/developers/docs/topics/gateway#sharding)
- [Redis Pub/Sub](https://redis.io/topics/pubsub)
