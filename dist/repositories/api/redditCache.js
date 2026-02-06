"use strict";
/**
 * Reddit Cache — CacheService-backed user session state
 *
 * Architecture:
 *   - In-memory Maps for fast synchronous reads (unchanged public API)
 *   - CacheService (Redis-backed) write-through for cross-shard sharing
 *   - Lazy hydration on miss from CacheService
 *   - Session data auto-expires via CacheService TTL (1 hour)
 *
 * @module repositories/api/redditCache
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedditCache = exports.redditCache = void 0;
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// ── CacheService namespace ───────────────────────────────────────────
const NS = 'reddit:session';
const SESSION_TTL = 60 * 60; // 1 hour
const MAX_SESSIONS = 1000;
function registerNamespaces() {
    CacheService_js_1.default.registerNamespace(NS, { ttl: SESSION_TTL, maxSize: MAX_SESSIONS, useRedis: true });
}
// ── Helpers ──────────────────────────────────────────────────────────
function persist(userId, session) {
    CacheService_js_1.default.set(NS, userId, session, SESSION_TTL).catch(() => { });
}
function unpersist(userId) {
    CacheService_js_1.default.delete(NS, userId).catch(() => { });
}
// ── RedditCache Class ────────────────────────────────────────────────
class RedditCache {
    /** Local sync surface — keyed by userId */
    sessions = new Map();
    constructor() {
        registerNamespaces();
    }
    // ── Internal session access ──────────────────────────────────────
    _getSession(userId) {
        const s = this.sessions.get(userId);
        if (s)
            return s;
        // Lazy hydrate from CacheService (async, won't help this call)
        this._hydrate(userId);
        return undefined;
    }
    _ensureSession(userId) {
        let s = this.sessions.get(userId);
        if (!s) {
            s = { posts: [], page: 0, sort: 'top', nsfw: false, galleryPages: {}, updatedAt: Date.now() };
            if (this.sessions.size >= MAX_SESSIONS)
                this._evictOldest();
            this.sessions.set(userId, s);
        }
        return s;
    }
    _touch(userId, session) {
        session.updatedAt = Date.now();
        persist(userId, session);
    }
    // ── Post management ──────────────────────────────────────────────
    setPosts(userId, posts) {
        const s = this._ensureSession(userId);
        s.posts = posts;
        this._touch(userId, s);
    }
    getPosts(userId) {
        return this._getSession(userId)?.posts;
    }
    clearPosts(userId) {
        const s = this.sessions.get(userId);
        if (s) {
            s.posts = [];
            this._touch(userId, s);
        }
    }
    // ── Page state management ────────────────────────────────────────
    setPage(userId, page) {
        const s = this._ensureSession(userId);
        s.page = page;
        this._touch(userId, s);
    }
    getPage(userId) {
        return this._getSession(userId)?.page ?? 0;
    }
    // ── Sort state management ────────────────────────────────────────
    setSort(userId, sortBy) {
        const s = this._ensureSession(userId);
        s.sort = sortBy;
        this._touch(userId, s);
    }
    getSort(userId) {
        return this._getSession(userId)?.sort ?? 'top';
    }
    // ── NSFW channel state management ────────────────────────────────
    setNsfwChannel(userId, isNsfw) {
        const s = this._ensureSession(userId);
        s.nsfw = isNsfw;
        this._touch(userId, s);
    }
    getNsfwChannel(userId) {
        return this._getSession(userId)?.nsfw ?? false;
    }
    // ── Gallery state management ─────────────────────────────────────
    setGalleryPage(userId, postIndex, page) {
        const s = this._ensureSession(userId);
        s.galleryPages[String(postIndex)] = page;
        this._touch(userId, s);
    }
    getGalleryPage(userId, postIndex) {
        return this._getSession(userId)?.galleryPages[String(postIndex)] ?? 0;
    }
    clearGalleryStates(userId) {
        const s = this.sessions.get(userId);
        if (s) {
            s.galleryPages = {};
            this._touch(userId, s);
        }
    }
    // ── Clear all user data ──────────────────────────────────────────
    clearAll(userId) {
        this.sessions.delete(userId);
        unpersist(userId);
    }
    // ── Lifecycle ────────────────────────────────────────────────────
    destroy() {
        this.sessions.clear();
    }
    // ── Internal helpers ─────────────────────────────────────────────
    _evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, session] of this.sessions) {
            if (session.updatedAt < oldestTime) {
                oldestTime = session.updatedAt;
                oldestKey = key;
            }
        }
        if (oldestKey)
            this.sessions.delete(oldestKey);
    }
    _hydrate(userId) {
        CacheService_js_1.default.get(NS, userId).then(val => {
            if (val && !this.sessions.has(userId)) {
                if (this.sessions.size >= MAX_SESSIONS)
                    this._evictOldest();
                this.sessions.set(userId, val);
            }
        }).catch(() => { });
    }
}
exports.RedditCache = RedditCache;
// Export singleton instance
const redditCache = new RedditCache();
exports.redditCache = redditCache;
exports.default = redditCache;
//# sourceMappingURL=redditCache.js.map