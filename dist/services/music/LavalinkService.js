"use strict";
/**
 * Lavalink Service
 * Low-level Lavalink connection management using Shoukaku
 * @module services/music/LavalinkService
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LavalinkService = void 0;
const shoukaku_1 = require("shoukaku");
const lavalinkConfig = __importStar(require("../../config/features/lavalink.js"));
const CircuitBreakerRegistry_js_1 = __importDefault(require("../../core/CircuitBreakerRegistry.js"));
const GracefulDegradation_js_1 = __importDefault(require("../../core/GracefulDegradation.js"));
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// LAVALINK SERVICE CLASS
class LavalinkService {
    shoukaku = null;
    client = null;
    isReady = false;
    readyNodes = new Set();
    circuitBreaker = null;
    // Note: preservedQueues moved to Redis via CacheService for shard-safety
    /**
     * Pre-initialize Shoukaku with Discord client
     */
    preInitialize(client) {
        if (this.shoukaku) {
            return this.shoukaku;
        }
        this.client = client;
        // Initialize circuit breaker and graceful degradation
        CircuitBreakerRegistry_js_1.default.initialize();
        this.circuitBreaker = CircuitBreakerRegistry_js_1.default.get('lavalink');
        // Register with graceful degradation
        GracefulDegradation_js_1.default.initialize();
        GracefulDegradation_js_1.default.registerFallback('lavalink', async () => ({
            error: 'LAVALINK_UNAVAILABLE',
            message: '🔇 Music service is temporarily unavailable. Your queue has been preserved.',
            preserved: true
        }));
        const configNodes = lavalinkConfig.nodes;
        const nodes = configNodes.map((node) => ({
            name: node.name,
            url: node.url,
            auth: node.auth,
            secure: node.secure || false
        }));
        try {
            const connector = new shoukaku_1.Connectors.DiscordJS(client);
            this.shoukaku = new shoukaku_1.Shoukaku(connector, nodes, lavalinkConfig.shoukakuOptions);
            this.setupEventHandlers();
        }
        catch (error) {
            const err = error;
            console.error('[Lavalink] ❌ Initialization error:', err.message);
            throw error;
        }
        return this.shoukaku;
    }
    /**
     * Finalize connection - nodes will emit 'ready' when connected
     */
    finalize() {
        // Connection finalized - nodes will emit 'ready' when connected
    }
    /**
     * Setup Shoukaku event handlers
     */
    setupEventHandlers() {
        if (!this.shoukaku)
            return;
        // Shoukaku v4.x 'ready' event signature: (name, lavalinkResume, libraryResume)
        this.shoukaku.on('ready', (name) => {
            console.log(`[Lavalink] ✅ Node "${name}" ready`);
            this.readyNodes.add(name);
            this.isReady = true;
            // Mark Lavalink as healthy
            GracefulDegradation_js_1.default.markHealthy('lavalink');
            // Try to restore preserved queues
            this._restorePreservedQueues();
        });
        this.shoukaku.on('error', (name, error) => {
            console.error(`[Lavalink] ❌ Node "${name}" error:`, error.message);
            GracefulDegradation_js_1.default.markDegraded('lavalink', error.message);
        });
        this.shoukaku.on('close', (name, code) => {
            console.log(`[Lavalink] Node "${name}" closed (${code})`);
            this.readyNodes.delete(name);
            if (this.readyNodes.size === 0) {
                this.isReady = false;
                GracefulDegradation_js_1.default.markUnavailable('lavalink', 'All nodes disconnected');
                // Preserve all active queues
                this._preserveAllQueues();
            }
        });
        this.shoukaku.on('disconnect', (name) => {
            this.readyNodes.delete(name);
            if (this.readyNodes.size === 0) {
                this.isReady = false;
                GracefulDegradation_js_1.default.markUnavailable('lavalink', 'All nodes disconnected');
            }
        });
        this.shoukaku.on('reconnecting', (name, reconnectsLeft) => {
            console.log(`[Lavalink] 🔄 Reconnecting "${name}" (${reconnectsLeft} left)`);
        });
        this.shoukaku.on('debug', () => { });
    }
    /**
     * Get Shoukaku manager
     */
    getManager() {
        return this.shoukaku;
    }
    /**
     * Get player for guild
     */
    getPlayer(guildId) {
        return this.shoukaku?.players?.get(guildId) || null;
    }
    /**
     * Create player for guild
     */
    async createPlayer(guildId, voiceChannelId, textChannelId) {
        if (!this.shoukaku) {
            throw new Error('Shoukaku not initialized');
        }
        if (!this.isReady) {
            throw new Error('Lavalink not ready');
        }
        // Shoukaku node states: 0 = CONNECTING, 1 = CONNECTED, 2 = DISCONNECTING, 3 = DISCONNECTED
        const node = [...this.shoukaku.nodes.values()].find(n => n.state === 1);
        if (!node)
            throw new Error('No available nodes');
        try {
            const player = await this.shoukaku.joinVoiceChannel({
                guildId: guildId,
                channelId: voiceChannelId,
                shardId: this.client?.guilds.cache.get(guildId)?.shardId || 0,
                deaf: lavalinkConfig.playerOptions?.selfDeafen || true
            });
            // Shoukaku setGlobalVolume: 100 = 100% volume (no distortion)
            const configVolume = lavalinkConfig.playerOptions?.volume || 100;
            await player.setGlobalVolume(configVolume);
            return player;
        }
        catch (error) {
            const err = error;
            console.error(`[Lavalink] ❌ Failed to create player:`, err.message);
            throw error;
        }
    }
    /**
     * Destroy player for guild
     */
    destroyPlayer(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            this.shoukaku?.leaveVoiceChannel(guildId);
        }
    }
    /**
     * Search for tracks with circuit breaker protection
     */
    async search(query, requester) {
        // Use circuit breaker for search operations
        return this.circuitBreaker.execute(async () => {
            return this._searchInternal(query, requester);
        });
    }
    /**
     * Internal search implementation
     */
    async _searchInternal(query, requester) {
        if (!this.shoukaku) {
            console.error('[Lavalink] Cannot search: Shoukaku not initialized');
            throw new Error('Shoukaku not initialized');
        }
        if (!this.isReady) {
            console.error('[Lavalink] Cannot search: Lavalink not ready');
            throw new Error('Lavalink not ready');
        }
        let searchQuery = query;
        if (/^https?:\/\//.test(query)) {
            try {
                const url = new URL(query);
                url.searchParams.delete('si');
                url.searchParams.delete('feature');
                searchQuery = url.toString();
            }
            catch {
                // Use original query on parse failure
            }
        }
        else if (this.isSpotifyUrl(query)) {
            // Spotify URLs are handled directly by Lavalink plugins
            searchQuery = query;
        }
        else {
            searchQuery = `${lavalinkConfig.defaultSearchPlatform}:${query}`;
        }
        // Shoukaku node states: 0 = CONNECTING, 1 = CONNECTED, 2 = DISCONNECTING, 3 = DISCONNECTED
        const node = [...this.shoukaku.nodes.values()].find(n => n.state === 1);
        if (!node) {
            console.error('[Lavalink] No available nodes');
            throw new Error('No available nodes');
        }
        try {
            let result = await node.rest.resolve(searchQuery);
            if (!result || result.loadType === 'error' || result.loadType === 'empty') {
                const fallbackQuery = /^https?:\/\//.test(query)
                    ? query
                    : `${lavalinkConfig.fallbackSearchPlatform}:${query}`;
                result = await node.rest.resolve(fallbackQuery);
                if (!result || result.loadType === 'error' || result.loadType === 'empty') {
                    throw new Error('NO_RESULTS');
                }
            }
            let track;
            if (result.loadType === 'track') {
                track = result.data;
            }
            else if (result.loadType === 'search') {
                track = result.data?.[0];
            }
            else if (result.loadType === 'playlist') {
                track = (result.data?.tracks)?.[0];
            }
            else {
                const data = result.data;
                track = data?.tracks?.[0] || data?.[0] || result.tracks?.[0];
            }
            if (!track || !track.info) {
                throw new Error('NO_RESULTS');
            }
            const youtubeId = this.extractYouTubeId(track.info.uri);
            // Try multiple thumbnail options with fallbacks
            let thumbnail = track.info.artworkUrl || null;
            if (!thumbnail && youtubeId) {
                // Try hqdefault first (more reliable), then maxresdefault
                thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            }
            const viewCount = track.pluginInfo?.viewCount ||
                track.pluginInfo?.playCount ||
                track.info?.viewCount ||
                null;
            // Determine if this was a direct link search
            const isLinkSearch = /^https?:\/\//.test(query) || this.isSpotifyUrl(query);
            return {
                track: track,
                encoded: track.encoded || '',
                url: track.info.uri || '',
                title: track.info.title || '',
                lengthSeconds: Math.floor((track.info.length || 0) / 1000),
                thumbnail: thumbnail,
                author: track.info.author || '',
                requestedBy: requester,
                source: track.info.sourceName || 'Unknown',
                viewCount: viewCount,
                identifier: youtubeId || track.info.identifier || null,
                searchedByLink: isLinkSearch,
                originalQuery: isLinkSearch ? null : query
            };
        }
        catch (error) {
            const err = error;
            console.error('[Lavalink] Search error:', err.message);
            throw new Error(err.message === 'NO_RESULTS' ? 'NO_RESULTS' : 'SEARCH_FAILED');
        }
    }
    /**
     * Extract YouTube ID from URL
     */
    extractYouTubeId(url) {
        if (!url)
            return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        return match ? match[1] : null;
    }
    /**
     * Check if URL is a Spotify URL
     */
    isSpotifyUrl(url) {
        if (!url)
            return false;
        return /^https?:\/\/(open\.)?spotify\.com\/(track|album|playlist|artist)\//.test(url);
    }
    /**
     * Search for multiple tracks (for autoplay)
     */
    async searchMultiple(query, limit = 5) {
        if (!this.shoukaku || !this.isReady) {
            console.log('[Lavalink] SearchMultiple: Not ready - shoukaku:', !!this.shoukaku, 'isReady:', this.isReady);
            return [];
        }
        try {
            const searchQuery = `${lavalinkConfig.defaultSearchPlatform}:${query}`;
            const node = [...this.shoukaku.nodes.values()].find(n => n.state === 1);
            if (!node) {
                const nodeStates = [...this.shoukaku.nodes.values()].map(n => ({ name: n.name, state: n.state }));
                console.log('[Lavalink] SearchMultiple: No ready node. States:', nodeStates);
                return [];
            }
            console.log(`[Lavalink] SearchMultiple: Searching "${searchQuery}" on node ${node.name}`);
            const result = await node.rest.resolve(searchQuery);
            if (!result || result.loadType === 'error' || result.loadType === 'empty') {
                console.log('[Lavalink] SearchMultiple: No results, loadType:', result?.loadType);
                return [];
            }
            console.log(`[Lavalink] SearchMultiple: loadType=${result.loadType}, tracks found`);
            let tracks = [];
            if (result.loadType === 'search' && Array.isArray(result.data)) {
                tracks = result.data.slice(0, limit);
            }
            else if (result.loadType === 'track' && result.data) {
                tracks = [result.data];
            }
            else if (result.loadType === 'playlist' && result.data?.tracks) {
                tracks = (result.data.tracks).slice(0, limit);
            }
            return tracks.map(track => {
                const youtubeId = this.extractYouTubeId(track.info?.uri);
                return {
                    track: track,
                    encoded: track.encoded,
                    info: track.info,
                    url: track.info?.uri,
                    title: track.info?.title,
                    lengthSeconds: Math.floor((track.info?.length || 0) / 1000),
                    thumbnail: track.info?.artworkUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null),
                    author: track.info?.author,
                    source: track.info?.sourceName || 'Unknown',
                    identifier: youtubeId || track.info?.identifier
                };
            });
        }
        catch (error) {
            const err = error;
            console.error('[Lavalink] SearchMultiple error:', err.message);
            return [];
        }
    }
    /**
     * Extract Spotify ID from URL
     */
    extractSpotifyId(url) {
        if (!url)
            return null;
        const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
        return match ? { type: match[1], id: match[2] } : null;
    }
    /**
     * Search for playlist
     */
    async searchPlaylist(query, requester) {
        if (!this.shoukaku) {
            throw new Error('Shoukaku not initialized');
        }
        if (!this.isReady) {
            throw new Error('Lavalink not ready');
        }
        let searchQuery = query;
        if (!/^https?:\/\//.test(query)) {
            searchQuery = `${lavalinkConfig.defaultSearchPlatform}:${query}`;
        }
        // Shoukaku node states: 0 = CONNECTING, 1 = CONNECTED, 2 = DISCONNECTING, 3 = DISCONNECTED
        const node = [...this.shoukaku.nodes.values()].find(n => n.state === 1);
        if (!node) {
            throw new Error('No available nodes');
        }
        try {
            let result = await node.rest.resolve(searchQuery);
            if (!result || result.loadType === 'error' || result.loadType === 'empty') {
                result = await node.rest.resolve(query);
                if (!result || result.loadType === 'error' || result.loadType === 'empty') {
                    throw new Error('NO_RESULTS');
                }
            }
            if (result.loadType === 'playlist') {
                const playlistData = result.data;
                const tracks = playlistData.tracks.map(track => {
                    const youtubeId = this.extractYouTubeId(track.info?.uri);
                    // Try multiple thumbnail options with fallbacks
                    let thumbnail = track.info?.artworkUrl || null;
                    if (!thumbnail && youtubeId) {
                        thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                    }
                    const viewCount = track.pluginInfo?.viewCount ||
                        track.pluginInfo?.playCount ||
                        track.info?.viewCount ||
                        null;
                    return {
                        track: track,
                        encoded: track.encoded || '',
                        url: track.info?.uri || '',
                        title: track.info?.title || '',
                        lengthSeconds: Math.floor((track.info?.length || 0) / 1000),
                        thumbnail: thumbnail,
                        author: track.info?.author || '',
                        requestedBy: requester,
                        source: track.info?.sourceName || 'Unknown',
                        viewCount: viewCount,
                        identifier: youtubeId || track.info?.identifier || null,
                        searchedByLink: true,
                        originalQuery: null
                    };
                });
                return {
                    playlistName: playlistData.info.name,
                    tracks: tracks
                };
            }
            throw new Error('NOT_A_PLAYLIST');
        }
        catch (error) {
            const err = error;
            console.error('[Lavalink] Playlist search error:', err.message);
            throw error;
        }
    }
    /**
     * Get node status
     */
    getNodeStatus() {
        if (!this.shoukaku) {
            return { ready: false, activeConnections: 0, error: 'Not initialized' };
        }
        const nodes = Array.from(this.shoukaku.nodes.values()).map(node => ({
            name: node.name,
            state: node.state,
            stats: node.stats
        }));
        return {
            ready: this.isReady,
            activeConnections: this.shoukaku.players.size,
            nodes: nodes,
            players: Array.from(this.shoukaku.players.values()).map(p => ({
                guildId: p.guildId,
                paused: p.paused,
                track: p.track
            }))
        };
    }
    /**
     * Shutdown (used by container)
     */
    async shutdown() {
        if (this.shoukaku) {
            // Disconnect all players
            for (const [, player] of this.shoukaku.players) {
                try {
                    await player.connection.disconnect();
                }
                catch {
                    // Ignore cleanup errors
                }
            }
            console.log('[Lavalink] Shutdown complete');
        }
    }
    /**
     * Preserve all active queues when Lavalink goes down
     * Now uses Redis for shard-safety
     */
    async _preserveAllQueues() {
        if (!this.shoukaku)
            return;
        let preservedCount = 0;
        for (const [guildId, player] of this.shoukaku.players) {
            try {
                // Preserve current state to Redis
                const state = {
                    timestamp: Date.now(),
                    track: player.track,
                    position: player.position,
                    paused: player.paused,
                    volume: player.volume,
                    // Note: Queue itself is managed by QueueService, not LavalinkService
                };
                await CacheService_js_1.default.preserveQueueState(guildId, state);
                preservedCount++;
                console.log(`[Lavalink] 📦 Preserved state for guild ${guildId}`);
            }
            catch (error) {
                const err = error;
                console.error(`[Lavalink] Failed to preserve queue for ${guildId}:`, err.message);
            }
        }
        console.log(`[Lavalink] 📦 Preserved ${preservedCount} guild states to Redis`);
    }
    /**
     * Restore preserved queues when Lavalink comes back
     * Now reads from Redis for shard-safety
     */
    async _restorePreservedQueues() {
        try {
            const guildIds = await CacheService_js_1.default.getAllPreservedQueueGuildIds();
            if (guildIds.length === 0)
                return;
            const staleThreshold = 30 * 60 * 1000; // 30 minutes
            const now = Date.now();
            for (const guildId of guildIds) {
                const state = await CacheService_js_1.default.getPreservedQueueState(guildId);
                if (!state)
                    continue;
                // Skip stale queues
                if (now - state.timestamp > staleThreshold) {
                    console.log(`[Lavalink] ⏰ Skipping stale queue for guild ${guildId}`);
                    await CacheService_js_1.default.clearPreservedQueueState(guildId);
                    continue;
                }
                // Emit event for QueueService to handle restoration
                // The actual restoration will be handled by the music event system
                console.log(`[Lavalink] 🔄 Queue restoration available for guild ${guildId}`);
            }
        }
        catch (error) {
            console.error('[Lavalink] Error restoring preserved queues:', error.message);
        }
    }
    /**
     * Get preserved queue state for a guild
     * Now reads from Redis for shard-safety
     */
    async getPreservedState(guildId) {
        return CacheService_js_1.default.getPreservedQueueState(guildId);
    }
    /**
     * Clear preserved state for a guild
     * Now clears from Redis for shard-safety
     */
    async clearPreservedState(guildId) {
        await CacheService_js_1.default.clearPreservedQueueState(guildId);
    }
    /**
     * Check if Lavalink is available with graceful degradation
     */
    isAvailable() {
        const isServiceAvailable = GracefulDegradation_js_1.default.isAvailable('lavalink');
        return this.isReady && isServiceAvailable;
    }
}
exports.LavalinkService = LavalinkService;
// Create default instance for backward compatibility
const lavalinkService = new LavalinkService();
exports.default = lavalinkService;
//# sourceMappingURL=LavalinkService.js.map