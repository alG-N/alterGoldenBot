/**
 * Reddit Cache - User session state management
 * Note: This cache manages user state, not timed data, so doesn't extend BaseCache
 */
// Interfaces
interface RedditPost {
    id: string;
    title: string;
    url: string;
    permalink: string;
    author: string;
    subreddit: string;
    score: number;
    num_comments: number;
    created_utc: number;
    is_video: boolean;
    is_gallery?: boolean;
    gallery_data?: any;
    media_metadata?: any;
    post_hint?: string;
    thumbnail?: string;
    preview?: any;
    selftext?: string;
    over_18: boolean;
    [key: string]: any;
}

type SortType = 'top' | 'new' | 'hot' | 'rising' | 'controversial';
// RedditCache Class
class RedditCache {
    private userPosts: Map<string, RedditPost[]>;
    private galleryStates: Map<string, number>;
    private pageStates: Map<string, number>;
    private sortStates: Map<string, SortType>;
    private nsfwStates: Map<string, boolean>;
    private sessionTimestamps: Map<string, number>;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor() {
        this.userPosts = new Map();
        this.galleryStates = new Map();
        this.pageStates = new Map();
        this.sortStates = new Map();
        this.nsfwStates = new Map();
        this.sessionTimestamps = new Map();
        
        // Auto cleanup stale sessions (1 hour)
        this.cleanupInterval = setInterval(() => this._cleanup(), 30 * 60 * 1000);
    }

    // Post management
    setPosts(userId: string, posts: RedditPost[]): void {
        this.userPosts.set(userId, posts);
        this.sessionTimestamps.set(userId, Date.now());
    }

    getPosts(userId: string): RedditPost[] | undefined {
        return this.userPosts.get(userId);
    }

    clearPosts(userId: string): void {
        this.userPosts.delete(userId);
    }

    // Page state management
    setPage(userId: string, page: number): void {
        this.pageStates.set(userId, page);
        this.sessionTimestamps.set(userId, Date.now());
    }

    getPage(userId: string): number {
        return this.pageStates.get(userId) || 0;
    }

    // Sort state management
    setSort(userId: string, sortBy: SortType): void {
        this.sortStates.set(userId, sortBy);
    }

    getSort(userId: string): SortType {
        return this.sortStates.get(userId) || 'top';
    }

    // NSFW channel state management
    setNsfwChannel(userId: string, isNsfw: boolean): void {
        this.nsfwStates.set(userId, isNsfw);
    }

    getNsfwChannel(userId: string): boolean {
        return this.nsfwStates.get(userId) || false;
    }

    // Gallery state management
    setGalleryPage(userId: string, postIndex: number, page: number): void {
        const key = `${userId}_${postIndex}`;
        this.galleryStates.set(key, page);
    }

    getGalleryPage(userId: string, postIndex: number): number {
        const key = `${userId}_${postIndex}`;
        return this.galleryStates.get(key) || 0;
    }

    clearGalleryStates(userId: string): void {
        for (const key of this.galleryStates.keys()) {
            if (key.startsWith(`${userId}_`)) {
                this.galleryStates.delete(key);
            }
        }
    }

    // Clear all user data
    clearAll(userId: string): void {
        this.clearPosts(userId);
        this.pageStates.delete(userId);
        this.sortStates.delete(userId);
        this.nsfwStates.delete(userId);
        this.clearGalleryStates(userId);
        this.sessionTimestamps.delete(userId);
    }
    
    // Cleanup stale sessions (older than 1 hour)
    private _cleanup(): void {
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        
        for (const [userId, timestamp] of this.sessionTimestamps.entries()) {
            if (now - timestamp > ONE_HOUR) {
                this.clearAll(userId);
            }
        }
    }

    // Destroy (for cleanup)
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Export singleton instance
const redditCache = new RedditCache();

export { redditCache, RedditCache };
export type { RedditPost, SortType };
export default redditCache;
