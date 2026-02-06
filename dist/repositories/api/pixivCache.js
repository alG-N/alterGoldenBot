"use strict";
/**
 * Pixiv Cache — CacheService-backed search & result caching
 *
 * Architecture (same as rule34Cache):
 *   - In-memory Maps for fast synchronous reads
 *   - CacheService (Redis-backed) write-through for cross-shard sharing + persistence
 *   - Lazy hydration on miss from CacheService
 *
 * @module repositories/api/pixivCache
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixivCache = exports.pixivCache = void 0;
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// ── CacheService namespace constants ─────────────────────────────────
const NS = {
    SEARCH: 'pixiv:search',
    RESULTS: 'pixiv:results',
};
const TTL = {
    SEARCH: 5 * 60, // 5 minutes (autocomplete suggestions)
    RESULTS: 30 * 60, // 30 minutes (paginated results)
};
const MAX = {
    SEARCH: 200,
    RESULTS: 100,
};
// ── Register namespaces ──────────────────────────────────────────────
function registerNamespaces() {
    CacheService_js_1.default.registerNamespace(NS.SEARCH, { ttl: TTL.SEARCH, maxSize: MAX.SEARCH, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.RESULTS, { ttl: TTL.RESULTS, maxSize: MAX.RESULTS, useRedis: true });
}
// ── Helpers ──────────────────────────────────────────────────────────
/** Fire-and-forget write to CacheService */
function persist(ns, key, value, ttl) {
    CacheService_js_1.default.set(ns, key, value, ttl).catch(() => { });
}
/** Fire-and-forget delete from CacheService */
function unpersist(ns, key) {
    CacheService_js_1.default.delete(ns, key).catch(() => { });
}
// ── PixivCache Class ─────────────────────────────────────────────────
class PixivCache {
    searchMap = new Map();
    resultMap = new Map();
    constructor() {
        registerNamespaces();
    }
    // ── Search autocomplete cache ────────────────────────────────────
    getSearchSuggestions(query) {
        const key = query.toLowerCase();
        const local = this.searchMap.get(key);
        if (local)
            return local;
        // Lazy hydrate from CacheService
        this._hydrateSearch(key);
        return null;
    }
    setSearchSuggestions(query, results) {
        const key = query.toLowerCase();
        if (this.searchMap.size >= MAX.SEARCH)
            this._evictOldest(this.searchMap);
        this.searchMap.set(key, results);
        persist(NS.SEARCH, key, results, TTL.SEARCH);
    }
    // ── Result cache for pagination ──────────────────────────────────
    getResults(cacheKey) {
        const local = this.resultMap.get(cacheKey);
        if (local)
            return local;
        // Lazy hydrate
        this._hydrateResult(cacheKey);
        return null;
    }
    setResults(cacheKey, data) {
        if (this.resultMap.size >= MAX.RESULTS)
            this._evictOldest(this.resultMap);
        this.resultMap.set(cacheKey, data);
        persist(NS.RESULTS, cacheKey, data, TTL.RESULTS);
    }
    deleteResults(cacheKey) {
        this.resultMap.delete(cacheKey);
        unpersist(NS.RESULTS, cacheKey);
    }
    // ── Alias methods for button handler compatibility ───────────────
    getSearchResults(cacheKey) {
        return this.getResults(cacheKey);
    }
    setSearchResults(cacheKey, data) {
        this.setResults(cacheKey, {
            ...data,
            currentIndex: data.currentIndex || 0,
            mangaPageIndex: data.mangaPageIndex || 0,
            results: data.results
        });
    }
    updateSearchResults(cacheKey, updates) {
        const existing = this.getResults(cacheKey);
        if (existing) {
            this.setResults(cacheKey, { ...existing, ...updates });
        }
    }
    // ── Lifecycle ────────────────────────────────────────────────────
    destroy() {
        this.searchMap.clear();
        this.resultMap.clear();
    }
    // ── Internal helpers ─────────────────────────────────────────────
    _evictOldest(map) {
        const firstKey = map.keys().next().value;
        if (firstKey !== undefined)
            map.delete(firstKey);
    }
    _hydrateSearch(key) {
        CacheService_js_1.default.get(NS.SEARCH, key).then(val => {
            if (val && !this.searchMap.has(key)) {
                if (this.searchMap.size >= MAX.SEARCH)
                    this._evictOldest(this.searchMap);
                this.searchMap.set(key, val);
            }
        }).catch(() => { });
    }
    _hydrateResult(key) {
        CacheService_js_1.default.get(NS.RESULTS, key).then(val => {
            if (val && !this.resultMap.has(key)) {
                if (this.resultMap.size >= MAX.RESULTS)
                    this._evictOldest(this.resultMap);
                this.resultMap.set(key, val);
            }
        }).catch(() => { });
    }
}
exports.PixivCache = PixivCache;
// Export singleton instance
const pixivCache = new PixivCache();
exports.pixivCache = pixivCache;
exports.default = pixivCache;
//# sourceMappingURL=pixivCache.js.map