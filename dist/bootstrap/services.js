"use strict";
/**
 * Service Provider - Registers all services with the container
 * This is the central place for dependency configuration
 *
 * Strategy: Use container.instance() for pre-existing module-level singletons.
 * This ensures container.resolve() returns the SAME instance as direct imports,
 * eliminating the dual-instance problem described in SYSTEM_REVIEW §4.1.
 *
 * Container.shutdown() handles lifecycle: it calls shutdown() / destroy() / close()
 * on all registered instances automatically.
 *
 * @module bootstrap/services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerServices = registerServices;
const container_js_1 = __importDefault(require("../container.js"));
const Logger_js_1 = require("../core/Logger.js");
// ── CORE ──────────────────────────────────────────────────────────────
const postgres_js_1 = __importDefault(require("../database/postgres.js"));
const RedisCache_js_1 = __importDefault(require("../services/guild/RedisCache.js"));
const CacheService_js_1 = __importDefault(require("../cache/CacheService.js"));
const CommandRegistry_js_1 = __importDefault(require("../services/registry/CommandRegistry.js"));
const EventRegistry_js_1 = __importDefault(require("../services/registry/EventRegistry.js"));
// ── CORE INFRASTRUCTURE ──────────────────────────────────────────────
const CircuitBreakerRegistry_js_1 = __importDefault(require("../core/CircuitBreakerRegistry.js"));
const GracefulDegradation_js_1 = __importDefault(require("../core/GracefulDegradation.js"));
// ── API SERVICES ─────────────────────────────────────────────────────
const anilistService_js_1 = __importDefault(require("../services/api/anilistService.js"));
const fandomService_js_1 = __importDefault(require("../services/api/fandomService.js"));
const googleService_js_1 = __importDefault(require("../services/api/googleService.js"));
const myAnimeListService_js_1 = __importDefault(require("../services/api/myAnimeListService.js"));
const nhentaiService_js_1 = __importDefault(require("../services/api/nhentaiService.js"));
const pixivService_js_1 = __importDefault(require("../services/api/pixivService.js"));
const redditService_js_1 = __importDefault(require("../services/api/redditService.js"));
const rule34Service_js_1 = __importDefault(require("../services/api/rule34Service.js"));
const steamService_js_1 = __importDefault(require("../services/api/steamService.js"));
const wikipediaService_js_1 = __importDefault(require("../services/api/wikipediaService.js"));
// ── MUSIC SERVICES ───────────────────────────────────────────────────
const LavalinkService_js_1 = __importDefault(require("../services/music/LavalinkService.js"));
const MusicFacade_js_1 = __importDefault(require("../services/music/MusicFacade.js"));
const VoiceConnectionService_js_1 = __importDefault(require("../services/music/voice/VoiceConnectionService.js"));
const QueueService_js_1 = __importDefault(require("../services/music/queue/QueueService.js"));
const PlaybackService_js_1 = __importDefault(require("../services/music/playback/PlaybackService.js"));
const AutoPlayService_js_1 = __importDefault(require("../services/music/autoplay/AutoPlayService.js"));
const MusicEventBus_js_1 = __importDefault(require("../services/music/events/MusicEventBus.js"));
const PlaybackEventHandler_js_1 = __importDefault(require("../services/music/events/PlaybackEventHandler.js"));
// ── MUSIC CACHES ─────────────────────────────────────────────────────
const MusicCacheFacade_js_1 = __importDefault(require("../cache/music/MusicCacheFacade.js"));
const QueueCache_js_1 = __importDefault(require("../cache/music/QueueCache.js"));
const UserMusicCache_js_1 = __importDefault(require("../cache/music/UserMusicCache.js"));
const VoteCache_js_1 = __importDefault(require("../cache/music/VoteCache.js"));
const GuildMusicCache_js_1 = __importDefault(require("../cache/music/GuildMusicCache.js"));
// ── VIDEO SERVICES ───────────────────────────────────────────────────
const VideoDownloadService_js_1 = __importDefault(require("../services/video/VideoDownloadService.js"));
const VideoProcessingService_js_1 = __importDefault(require("../services/video/VideoProcessingService.js"));
const CobaltService_js_1 = __importDefault(require("../services/video/CobaltService.js"));
const YtDlpService_js_1 = __importDefault(require("../services/video/YtDlpService.js"));
// ── GUILD SERVICES ───────────────────────────────────────────────────
const ShardBridge_js_1 = __importDefault(require("../services/guild/ShardBridge.js"));
const SetupWizardService_js_1 = __importDefault(require("../services/guild/SetupWizardService.js"));
// ── MODERATION SERVICES ──────────────────────────────────────────────
const AntiRaidService_js_1 = __importDefault(require("../services/moderation/AntiRaidService.js"));
const LockdownService_js_1 = __importDefault(require("../services/moderation/LockdownService.js"));
const SnipeService_js_1 = __importDefault(require("../services/moderation/SnipeService.js"));
// ── FUN SERVICES ─────────────────────────────────────────────────────
const BattleService_js_1 = __importDefault(require("../services/fun/deathbattle/BattleService.js"));
const SayService_js_1 = __importDefault(require("../services/fun/say/SayService.js"));
// ── HANDLERS WITH STATE ──────────────────────────────────────────────
const nhentaiHandler_js_1 = __importDefault(require("../handlers/api/nhentaiHandler.js"));
// ── REPOSITORIES WITH LIFECYCLE ──────────────────────────────────────
const rule34Cache_js_1 = __importDefault(require("../repositories/api/rule34Cache.js"));
const redditCache_js_1 = __importDefault(require("../repositories/api/redditCache.js"));
// ── EVENTS WITH LIFECYCLE ────────────────────────────────────────────
const voiceStateUpdate_js_1 = __importDefault(require("../events/voiceStateUpdate.js"));
const ready_js_1 = __importDefault(require("../events/ready.js"));
/**
 * Register all application services with the DI container.
 * Uses container.instance() to register pre-existing module-level singletons,
 * ensuring container.resolve() returns the same instance as direct imports.
 *
 * Call this once during application startup.
 */
function registerServices() {
    Logger_js_1.logger.info('Container', 'Registering services with DI container...');
    // ── CORE SERVICES ────────────────────────────────────────────────
    container_js_1.default.instance('database', postgres_js_1.default);
    container_js_1.default.instance('redisCache', RedisCache_js_1.default);
    container_js_1.default.instance('cacheService', CacheService_js_1.default);
    container_js_1.default.instance('commandRegistry', CommandRegistry_js_1.default);
    container_js_1.default.instance('eventRegistry', EventRegistry_js_1.default);
    // ── CORE INFRASTRUCTURE ──────────────────────────────────────────
    container_js_1.default.instance('circuitBreakerRegistry', CircuitBreakerRegistry_js_1.default);
    container_js_1.default.instance('gracefulDegradation', GracefulDegradation_js_1.default);
    // ── API SERVICES ─────────────────────────────────────────────────
    container_js_1.default.instance('anilistService', anilistService_js_1.default);
    container_js_1.default.instance('fandomService', fandomService_js_1.default);
    container_js_1.default.instance('googleService', googleService_js_1.default);
    container_js_1.default.instance('myAnimeListService', myAnimeListService_js_1.default);
    container_js_1.default.instance('nhentaiService', nhentaiService_js_1.default);
    container_js_1.default.instance('pixivService', pixivService_js_1.default);
    container_js_1.default.instance('redditService', redditService_js_1.default);
    container_js_1.default.instance('rule34Service', rule34Service_js_1.default);
    container_js_1.default.instance('steamService', steamService_js_1.default);
    container_js_1.default.instance('wikipediaService', wikipediaService_js_1.default);
    // ── MUSIC SERVICES ───────────────────────────────────────────────
    container_js_1.default.instance('lavalinkService', LavalinkService_js_1.default);
    container_js_1.default.instance('musicFacade', MusicFacade_js_1.default);
    container_js_1.default.instance('voiceConnectionService', VoiceConnectionService_js_1.default);
    container_js_1.default.instance('queueService', QueueService_js_1.default);
    container_js_1.default.instance('playbackService', PlaybackService_js_1.default);
    container_js_1.default.instance('autoPlayService', AutoPlayService_js_1.default);
    container_js_1.default.instance('musicEventBus', MusicEventBus_js_1.default);
    container_js_1.default.instance('playbackEventHandler', PlaybackEventHandler_js_1.default);
    // ── MUSIC CACHES ─────────────────────────────────────────────────
    container_js_1.default.instance('musicCacheFacade', MusicCacheFacade_js_1.default);
    container_js_1.default.instance('queueCache', QueueCache_js_1.default);
    container_js_1.default.instance('userMusicCache', UserMusicCache_js_1.default);
    container_js_1.default.instance('voteCache', VoteCache_js_1.default);
    container_js_1.default.instance('guildMusicCache', GuildMusicCache_js_1.default);
    // ── VIDEO SERVICES ───────────────────────────────────────────────
    container_js_1.default.instance('videoDownloadService', VideoDownloadService_js_1.default);
    container_js_1.default.instance('videoProcessingService', VideoProcessingService_js_1.default);
    container_js_1.default.instance('cobaltService', CobaltService_js_1.default);
    container_js_1.default.instance('ytDlpService', YtDlpService_js_1.default);
    // ── GUILD SERVICES ───────────────────────────────────────────────
    container_js_1.default.instance('shardBridge', ShardBridge_js_1.default);
    container_js_1.default.instance('setupWizardService', SetupWizardService_js_1.default);
    // ── MODERATION SERVICES ──────────────────────────────────────────
    container_js_1.default.instance('antiRaidService', AntiRaidService_js_1.default);
    container_js_1.default.instance('lockdownService', LockdownService_js_1.default);
    container_js_1.default.instance('snipeService', SnipeService_js_1.default);
    // ── FUN SERVICES ─────────────────────────────────────────────────
    container_js_1.default.instance('battleService', BattleService_js_1.default);
    container_js_1.default.instance('sayService', SayService_js_1.default);
    // ── HANDLERS WITH STATE ──────────────────────────────────────────
    container_js_1.default.instance('nhentaiHandler', nhentaiHandler_js_1.default);
    // ── REPOSITORIES WITH LIFECYCLE ──────────────────────────────────
    container_js_1.default.instance('rule34Cache', rule34Cache_js_1.default);
    container_js_1.default.instance('redditCache', redditCache_js_1.default);
    // ── EVENTS WITH LIFECYCLE ────────────────────────────────────────
    container_js_1.default.instance('voiceStateUpdate', voiceStateUpdate_js_1.default);
    container_js_1.default.instance('readyEvent', ready_js_1.default);
    Logger_js_1.logger.info('Container', `All services registered (${container_js_1.default.getDebugInfo().instantiated.length} instances)`);
}
exports.default = { registerServices };
//# sourceMappingURL=services.js.map