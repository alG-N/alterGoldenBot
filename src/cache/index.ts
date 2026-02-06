/**
 * Cache Module
 * Central exports for caching utilities
 * @module cache
 */

// Cache Service
export { CacheService, DEFAULT_NAMESPACES } from './CacheService';
export type { NamespaceConfig, CacheMetrics, CacheServiceStats, CacheServiceOptions } from './CacheService';

// Music Caches (moved from repositories/music)
export * as music from './music';
export {
    MusicCache,
    MusicCacheFacade,
    QueueCache,
    UserMusicCache,
    GuildMusicCache,
    VoteCache
} from './music';

// Default export is the unified cache service singleton
import cacheService from './CacheService';
export default cacheService;

// Re-export cacheService as named export
export { cacheService };
