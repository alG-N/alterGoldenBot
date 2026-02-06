/**
 * API Repositories - Data caching for API services
 */

// Import all repositories
import animeRepository, { AnimeRepository } from './animeRepository.js';
import type { AnimeFavourite, AnimeNotification } from './animeRepository.js';

import nhentaiRepository, { NHentaiRepository } from './nhentaiRepository.js';
import type { NHentaiGallery, NHentaiTag, NHentaiFavourite, ToggleFavouriteResult } from './nhentaiRepository.js';

import pixivCache, { PixivCache } from './pixivCache.js';
import type { PixivSearchResult, PixivResultData } from './pixivCache.js';

import redditCache, { RedditCache } from './redditCache.js';
import type { RedditPost, SortType as RedditSortType } from './redditCache.js';

import rule34Cache, { Rule34Cache } from './rule34Cache.js';
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
} from './rule34Cache.js';

// Re-export instances and classes
export {
    // Instances
    animeRepository,
    nhentaiRepository,
    pixivCache,
    redditCache,
    rule34Cache,
    
    // Classes
    AnimeRepository,
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
    nhentaiRepository,
    pixivCache,
    redditCache,
    rule34Cache
};
