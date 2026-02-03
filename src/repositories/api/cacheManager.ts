/**
 * Unified Cache Manager
 * Consolidates caching for all API commands
 */
// Interfaces
interface ContentCacheEntry<T = any> {
    data: T;
    expiresAt: number;
    accessedAt: number;
}

type ApiSource = 'reddit' | 'rule34' | 'pixiv' | 'nhentai' | 'google' | 'wikipedia' | 'anime' | 'steam';
type SortType = 'top' | 'new' | 'hot' | 'rising' | 'controversial';
// CacheManager Class
class CacheManager {
    // User-specific caches
    private userPosts: Map<string, any[]>;
    private pageStates: Map<string, number>;
    private sortStates: Map<string, SortType>;
    private nsfwStates: Map<string, boolean>;
    private galleryStates: Map<string, number>;
    private searchStates: Map<string, any>;

    // Content caches with TTL
    private contentCache: Map<string, ContentCacheEntry>;
    private readonly defaultTTL: number;
    private readonly maxSize: number;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor() {
        // User-specific caches
        this.userPosts = new Map();      // User posts data
        this.pageStates = new Map();     // Current page per user
        this.sortStates = new Map();     // Sort preference per user
        this.nsfwStates = new Map();     // NSFW channel status
        this.galleryStates = new Map();  // Gallery pagination
        this.searchStates = new Map();   // Search results

        // Content caches with TTL
        this.contentCache = new Map();
        this.defaultTTL = 300000; // 5 minutes
        this.maxSize = 1000;

        // Auto cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => this._cleanup(), 300000);
    }
    setPosts(userId: string, source: ApiSource, posts: any[]): void {
        const key = `${source}_${userId}`;
        this.userPosts.set(key, posts);
    }

    getPosts(userId: string, source: ApiSource): any[] | undefined {
        return this.userPosts.get(`${source}_${userId}`);
    }

    clearPosts(userId: string, source: ApiSource): void {
        this.userPosts.delete(`${source}_${userId}`);
    }
    setPage(userId: string, source: ApiSource, page: number): void {
        this.pageStates.set(`${source}_${userId}`, page);
    }

    getPage(userId: string, source: ApiSource): number {
        return this.pageStates.get(`${source}_${userId}`) || 0;
    }
    setSort(userId: string, source: ApiSource, sortBy: SortType): void {
        this.sortStates.set(`${source}_${userId}`, sortBy);
    }

    getSort(userId: string, source: ApiSource): SortType {
        return this.sortStates.get(`${source}_${userId}`) || 'top';
    }
    setNsfwChannel(userId: string, isNsfw: boolean): void {
        this.nsfwStates.set(userId, isNsfw);
    }

    getNsfwChannel(userId: string): boolean {
        return this.nsfwStates.get(userId) || false;
    }
    setGalleryPage(userId: string, source: ApiSource, postIndex: number, page: number): void {
        const key = `${source}_${userId}_${postIndex}`;
        this.galleryStates.set(key, page);
    }

    getGalleryPage(userId: string, source: ApiSource, postIndex: number): number {
        const key = `${source}_${userId}_${postIndex}`;
        return this.galleryStates.get(key) || 0;
    }
    setSearchResults(userId: string, source: ApiSource, results: any): void {
        this.searchStates.set(`${source}_${userId}`, results);
    }

    getSearchResults(userId: string, source: ApiSource): any | undefined {
        return this.searchStates.get(`${source}_${userId}`);
    }
    cacheContent<T = any>(key: string, data: T, ttl: number = this.defaultTTL): void {
        if (this.contentCache.size >= this.maxSize) {
            this._evictOldest();
        }
        this.contentCache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
            accessedAt: Date.now()
        });
    }

    getCachedContent<T = any>(key: string): T | null {
        const entry = this.contentCache.get(key) as ContentCacheEntry<T> | undefined;
        if (!entry || Date.now() > entry.expiresAt) {
            this.contentCache.delete(key);
            return null;
        }
        entry.accessedAt = Date.now();
        return entry.data;
    }
    clearAllUserData(userId: string, source: ApiSource | null = null): void {
        const sources: ApiSource[] = source 
            ? [source] 
            : ['reddit', 'rule34', 'pixiv', 'nhentai', 'google', 'wikipedia', 'anime', 'steam'];
        
        for (const src of sources) {
            this.userPosts.delete(`${src}_${userId}`);
            this.pageStates.delete(`${src}_${userId}`);
            this.sortStates.delete(`${src}_${userId}`);
            this.searchStates.delete(`${src}_${userId}`);
            
            // Clear gallery states
            for (const key of this.galleryStates.keys()) {
                if (key.startsWith(`${src}_${userId}_`)) {
                    this.galleryStates.delete(key);
                }
            }
        }
        
        this.nsfwStates.delete(userId);
    }
    private _evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;
        
        for (const [key, entry] of this.contentCache) {
            if (entry.accessedAt < oldestTime) {
                oldestTime = entry.accessedAt;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.contentCache.delete(oldestKey);
        }
    }

    private _cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.contentCache) {
            if (now > entry.expiresAt) {
                this.contentCache.delete(key);
            }
        }
    }
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Export singleton instance
const cacheManager = new CacheManager();

export { cacheManager, CacheManager };
export type { ApiSource, SortType, ContentCacheEntry };
export default cacheManager;
