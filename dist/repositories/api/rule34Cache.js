"use strict";
/**
 * Rule34 Cache Manager
 * Handles caching for search results, user sessions, blacklists, and preferences.
 *
 * Architecture:
 *   - In-memory Maps provide fast synchronous reads (unchanged public API).
 *   - CacheService (Redis-backed) is used as a write-through backing store
 *     so data survives restarts and is shared across shards.
 *   - On read miss, data is lazily hydrated from CacheService.
 *   - Ephemeral data (sessions, searchCache, autocomplete) has short TTLs.
 *   - User data (blacklists, preferences, favorites, history) has long TTLs.
 *
 * @module repositories/api/rule34Cache
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule34Cache = exports.rule34Cache = void 0;
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// ── CacheService namespace constants ─────────────────────────────────
const NS = {
    SESSION: 'r34:session',
    SEARCH: 'r34:search',
    AUTOCOMPLETE: 'r34:autocomplete',
    BLACKLIST: 'r34:blacklist',
    PREFERENCES: 'r34:preferences',
    FAVORITES: 'r34:favorites',
    HISTORY: 'r34:history',
};
// ── TTLs (seconds) ───────────────────────────────────────────────────
const TTL = {
    SESSION: 2 * 60 * 60, // 2 hours
    SEARCH: 10 * 60, // 10 minutes
    AUTOCOMPLETE: 5 * 60, // 5 minutes
    BLACKLIST: 7 * 24 * 3600, // 7 days
    PREFERENCES: 7 * 24 * 3600, // 7 days
    FAVORITES: 7 * 24 * 3600, // 7 days
    HISTORY: 24 * 3600, // 24 hours
};
// ── Register namespaces with CacheService ────────────────────────────
function registerNamespaces() {
    CacheService_js_1.default.registerNamespace(NS.SESSION, { ttl: TTL.SESSION, maxSize: 1000, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.SEARCH, { ttl: TTL.SEARCH, maxSize: 500, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.AUTOCOMPLETE, { ttl: TTL.AUTOCOMPLETE, maxSize: 500, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.BLACKLIST, { ttl: TTL.BLACKLIST, maxSize: 5000, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.PREFERENCES, { ttl: TTL.PREFERENCES, maxSize: 5000, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.FAVORITES, { ttl: TTL.FAVORITES, maxSize: 5000, useRedis: true });
    CacheService_js_1.default.registerNamespace(NS.HISTORY, { ttl: TTL.HISTORY, maxSize: 5000, useRedis: true });
}
// ── Helpers ──────────────────────────────────────────────────────────
/** Fire-and-forget write to CacheService (best-effort persistence). */
function persist(ns, key, value, ttl) {
    CacheService_js_1.default.set(ns, key, value, ttl).catch(() => { });
}
/** Fire-and-forget delete from CacheService. */
function unpersist(ns, key) {
    CacheService_js_1.default.delete(ns, key).catch(() => { });
}
/**
 * Background hydrate from CacheService on local cache miss.
 * Does not block — fills the local Map so the *next* read hits.
 */
function hydrateInBackground(map, ns, key) {
    CacheService_js_1.default.get(ns, key).then(value => {
        if (value !== null && !map.has(key)) {
            map.set(key, value);
        }
    }).catch(() => { });
}
// ── Rule34Cache Class ────────────────────────────────────────────────
class Rule34Cache {
    // In-memory Maps (synchronous read surface)
    searchCache = new Map();
    userSessions = new Map();
    userBlacklists = new Map();
    userPreferences = new Map();
    autocompleteCache = new Map();
    userFavorites = new Map();
    viewHistory = new Map();
    // Cache durations (ms) — used for local TTL checks
    SEARCH_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
    AUTOCOMPLETE_DURATION = 5 * 60 * 1000; // 5 minutes
    HISTORY_MAX_SIZE = 50;
    // Map size caps (prevent OOM)
    MAX_SEARCH_CACHE = 500;
    MAX_SESSIONS = 1000;
    MAX_AUTOCOMPLETE = 500;
    MAX_USER_BLACKLISTS = 5000;
    MAX_USER_PREFERENCES = 5000;
    MAX_USER_FAVORITES = 5000;
    MAX_USER_HISTORY = 5000;
    cleanupInterval;
    constructor() {
        registerNamespaces();
        // Periodic cleanup of expired local entries
        this.cleanupInterval = setInterval(() => this._cleanup(), 5 * 60 * 1000);
        if (this.cleanupInterval.unref)
            this.cleanupInterval.unref();
    }
    /** Evict oldest entries from a Map when it exceeds maxSize. */
    _evictOldest(map, maxSize) {
        if (map.size <= maxSize)
            return;
        const excess = map.size - maxSize;
        const iter = map.keys();
        for (let i = 0; i < excess; i++) {
            const { value, done } = iter.next();
            if (done)
                break;
            map.delete(value);
        }
    }
    // ══════════════════════════════════════════════════════════════════
    // SESSIONS (ephemeral — 2h TTL)
    // ══════════════════════════════════════════════════════════════════
    setSession(userId, sessionData) {
        const session = {
            ...sessionData,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.userSessions.set(userId, session);
        this._evictOldest(this.userSessions, this.MAX_SESSIONS);
        persist(NS.SESSION, userId, session, TTL.SESSION);
        return session;
    }
    getSession(userId) {
        const session = this.userSessions.get(userId);
        if (!session) {
            hydrateInBackground(this.userSessions, NS.SESSION, userId);
            return null;
        }
        if (Date.now() - session.updatedAt > this.SESSION_DURATION) {
            this.userSessions.delete(userId);
            unpersist(NS.SESSION, userId);
            return null;
        }
        return session;
    }
    updateSession(userId, updates) {
        const session = this.getSession(userId);
        if (!session)
            return null;
        const updated = { ...session, ...updates, updatedAt: Date.now() };
        this.userSessions.set(userId, updated);
        persist(NS.SESSION, userId, updated, TTL.SESSION);
        return updated;
    }
    clearSession(userId) {
        this.userSessions.delete(userId);
        unpersist(NS.SESSION, userId);
    }
    // ══════════════════════════════════════════════════════════════════
    // SEARCH CACHE (ephemeral — 10min TTL)
    // ══════════════════════════════════════════════════════════════════
    setSearchResults(cacheKey, data) {
        const entry = { ...data, timestamp: Date.now() };
        this.searchCache.set(cacheKey, entry);
        this._evictOldest(this.searchCache, this.MAX_SEARCH_CACHE);
        persist(NS.SEARCH, cacheKey, entry, TTL.SEARCH);
    }
    getSearchResults(cacheKey) {
        const cached = this.searchCache.get(cacheKey);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.SEARCH_CACHE_DURATION) {
            this.searchCache.delete(cacheKey);
            unpersist(NS.SEARCH, cacheKey);
            return null;
        }
        return cached;
    }
    generateSearchKey(userId, query, options = {}) {
        const optStr = JSON.stringify(options);
        return `${userId}_${query}_${optStr}`;
    }
    // ══════════════════════════════════════════════════════════════════
    // BLACKLISTS (persistent — 7d TTL, user-critical)
    // ══════════════════════════════════════════════════════════════════
    getBlacklist(userId) {
        const local = this.userBlacklists.get(userId);
        if (local !== undefined)
            return local;
        hydrateInBackground(this.userBlacklists, NS.BLACKLIST, userId);
        return [];
    }
    addToBlacklist(userId, tags) {
        const current = this.getBlacklist(userId);
        const newTags = Array.isArray(tags) ? tags : [tags];
        const updated = [...new Set([...current, ...newTags])];
        this.userBlacklists.set(userId, updated);
        this._evictOldest(this.userBlacklists, this.MAX_USER_BLACKLISTS);
        persist(NS.BLACKLIST, userId, updated, TTL.BLACKLIST);
        return updated;
    }
    removeFromBlacklist(userId, tags) {
        const current = this.getBlacklist(userId);
        const toRemove = Array.isArray(tags) ? tags : [tags];
        const updated = current.filter(t => !toRemove.includes(t));
        this.userBlacklists.set(userId, updated);
        persist(NS.BLACKLIST, userId, updated, TTL.BLACKLIST);
        return updated;
    }
    clearBlacklist(userId) {
        this.userBlacklists.set(userId, []);
        persist(NS.BLACKLIST, userId, [], TTL.BLACKLIST);
    }
    isBlacklisted(userId, tag) {
        return this.getBlacklist(userId).includes(tag);
    }
    // ══════════════════════════════════════════════════════════════════
    // PREFERENCES (persistent — 7d TTL, user-critical)
    // ══════════════════════════════════════════════════════════════════
    getDefaultPreferences() {
        return {
            aiFilter: true,
            defaultRating: null,
            minScore: 0,
            excludeLowQuality: true,
            highQualityOnly: false,
            showAnimatedOnly: false,
            resultsPerPage: 10,
            autoplay: false,
            compactMode: false,
            sortMode: 'score:desc',
            safeMode: false,
        };
    }
    getPreferences(userId) {
        const local = this.userPreferences.get(userId);
        if (local !== undefined) {
            return { ...this.getDefaultPreferences(), ...local };
        }
        hydrateInBackground(this.userPreferences, NS.PREFERENCES, userId);
        return this.getDefaultPreferences();
    }
    setPreferences(userId, preferences) {
        const current = this.getPreferences(userId);
        const updated = { ...current, ...preferences };
        this.userPreferences.set(userId, updated);
        this._evictOldest(this.userPreferences, this.MAX_USER_PREFERENCES);
        persist(NS.PREFERENCES, userId, updated, TTL.PREFERENCES);
        return updated;
    }
    resetPreferences(userId) {
        this.userPreferences.delete(userId);
        unpersist(NS.PREFERENCES, userId);
        return this.getDefaultPreferences();
    }
    // ══════════════════════════════════════════════════════════════════
    // AUTOCOMPLETE (ephemeral — 5min TTL)
    // ══════════════════════════════════════════════════════════════════
    setAutocompleteSuggestions(query, suggestions) {
        const key = query.toLowerCase();
        const entry = { suggestions, timestamp: Date.now() };
        this.autocompleteCache.set(key, entry);
        this._evictOldest(this.autocompleteCache, this.MAX_AUTOCOMPLETE);
        persist(NS.AUTOCOMPLETE, key, entry, TTL.AUTOCOMPLETE);
    }
    getAutocompleteSuggestions(query) {
        const key = query.toLowerCase();
        const cached = this.autocompleteCache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.AUTOCOMPLETE_DURATION) {
            this.autocompleteCache.delete(key);
            unpersist(NS.AUTOCOMPLETE, key);
            return null;
        }
        return cached.suggestions;
    }
    // ══════════════════════════════════════════════════════════════════
    // FAVORITES (persistent — 7d TTL, user-critical)
    // ══════════════════════════════════════════════════════════════════
    getFavorites(userId) {
        const local = this.userFavorites.get(userId);
        if (local !== undefined)
            return local;
        hydrateInBackground(this.userFavorites, NS.FAVORITES, userId);
        return [];
    }
    addFavorite(userId, postId, postInfo = {}) {
        const favorites = this.getFavorites(userId);
        if (favorites.some(f => f.id === postId)) {
            return { success: false, message: 'Already favorited' };
        }
        favorites.unshift({ id: postId, ...postInfo, addedAt: Date.now() });
        if (favorites.length > 100)
            favorites.pop();
        this.userFavorites.set(userId, favorites);
        this._evictOldest(this.userFavorites, this.MAX_USER_FAVORITES);
        persist(NS.FAVORITES, userId, favorites, TTL.FAVORITES);
        return { success: true, favorites };
    }
    removeFavorite(userId, postId) {
        const favorites = this.getFavorites(userId);
        const updated = favorites.filter(f => f.id !== postId);
        this.userFavorites.set(userId, updated);
        persist(NS.FAVORITES, userId, updated, TTL.FAVORITES);
        return updated;
    }
    isFavorited(userId, postId) {
        return this.getFavorites(userId).some(f => f.id === postId);
    }
    // ══════════════════════════════════════════════════════════════════
    // VIEW HISTORY (semi-persistent — 24h TTL)
    // ══════════════════════════════════════════════════════════════════
    addToHistory(userId, postId, postInfo = {}) {
        let history = this.viewHistory.get(userId) || [];
        history = history.filter(h => h.id !== postId);
        history.unshift({ id: postId, ...postInfo, viewedAt: Date.now() });
        if (history.length > this.HISTORY_MAX_SIZE) {
            history = history.slice(0, this.HISTORY_MAX_SIZE);
        }
        this.viewHistory.set(userId, history);
        this._evictOldest(this.viewHistory, this.MAX_USER_HISTORY);
        persist(NS.HISTORY, userId, history, TTL.HISTORY);
        return history;
    }
    getHistory(userId, limit = 20) {
        const history = this.viewHistory.get(userId) || [];
        return history.slice(0, limit);
    }
    clearHistory(userId) {
        this.viewHistory.delete(userId);
        unpersist(NS.HISTORY, userId);
    }
    // ══════════════════════════════════════════════════════════════════
    // PAGINATION (delegates to session)
    // ══════════════════════════════════════════════════════════════════
    setPagination(userId, state) {
        return this.updateSession(userId, {
            pagination: {
                currentIndex: state.currentIndex || 0,
                currentPage: state.currentPage || 0,
                totalResults: state.totalResults || 0,
                hasMore: state.hasMore || false,
            },
        });
    }
    getPagination(userId) {
        const session = this.getSession(userId);
        return session?.pagination || null;
    }
    // ══════════════════════════════════════════════════════════════════
    // STATS & LIFECYCLE
    // ══════════════════════════════════════════════════════════════════
    getStats() {
        return {
            sessions: this.userSessions.size,
            searchCache: this.searchCache.size,
            blacklists: this.userBlacklists.size,
            preferences: this.userPreferences.size,
            favorites: this.userFavorites.size,
            history: this.viewHistory.size,
            autocomplete: this.autocompleteCache.size,
        };
    }
    _cleanup() {
        const now = Date.now();
        for (const [key, value] of this.searchCache.entries()) {
            if (now - value.timestamp > this.SEARCH_CACHE_DURATION) {
                this.searchCache.delete(key);
            }
        }
        for (const [key, value] of this.userSessions.entries()) {
            if (now - value.updatedAt > this.SESSION_DURATION) {
                this.userSessions.delete(key);
            }
        }
        for (const [key, value] of this.autocompleteCache.entries()) {
            if (now - value.timestamp > this.AUTOCOMPLETE_DURATION) {
                this.autocompleteCache.delete(key);
            }
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
exports.Rule34Cache = Rule34Cache;
// Export singleton instance
const rule34Cache = new Rule34Cache();
exports.rule34Cache = rule34Cache;
exports.default = rule34Cache;
//# sourceMappingURL=rule34Cache.js.map