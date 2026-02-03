/**
 * API Repositories - Data caching for API services
 */

// Import all repositories
import animeRepository, { AnimeRepository } from './animeRepository';
import type { AnimeFavourite, AnimeNotification } from './animeRepository';

import cacheManager, { CacheManager } from './cacheManager';
import type { ApiSource, SortType as CacheManagerSortType, ContentCacheEntry } from './cacheManager';

import nhentaiRepository, { NHentaiRepository } from './nhentaiRepository';
import type { NHentaiGallery, NHentaiTag, NHentaiFavourite, ToggleFavouriteResult } from './nhentaiRepository';

import pixivCache, { PixivCache } from './pixivCache';
import type { PixivSearchResult, PixivResultData } from './pixivCache';

import redditCache, { RedditCache } from './redditCache';
import type { RedditPost, SortType as RedditSortType } from './redditCache';

import rule34Cache, { Rule34Cache } from './rule34Cache';
import type {
    Rule34Session,
    PaginationState,
    SearchCacheEntry,
    AutocompleteEntry,
    Rule34Favorite,
    HistoryEntry,
    UserPreferences,
    CacheStats,
    FavoriteResult
} from './rule34Cache';

// Re-export instances and classes
export {
    // Instances
    animeRepository,
    cacheManager,
    nhentaiRepository,
    pixivCache,
    redditCache,
    rule34Cache,
    
    // Classes
    AnimeRepository,
    CacheManager,
    NHentaiRepository,
    PixivCache,
    RedditCache,
    Rule34Cache
};

// Re-export types separately
export type {
    // Types - Anime
    AnimeFavourite,
    AnimeNotification,
    
    // Types - CacheManager
    ApiSource,
    ContentCacheEntry,
    CacheManagerSortType,
    
    // Types - NHentai
    NHentaiGallery,
    NHentaiTag,
    NHentaiFavourite,
    ToggleFavouriteResult,
    
    // Types - Pixiv
    PixivSearchResult,
    PixivResultData,
    
    // Types - Reddit
    RedditPost,
    RedditSortType,
    
    // Types - Rule34
    Rule34Session,
    PaginationState,
    SearchCacheEntry,
    AutocompleteEntry,
    Rule34Favorite,
    HistoryEntry,
    UserPreferences,
    CacheStats,
    FavoriteResult
};

// Default export for CommonJS compatibility
export default {
    animeRepository,
    cacheManager,
    nhentaiRepository,
    pixivCache,
    redditCache,
    rule34Cache
};
