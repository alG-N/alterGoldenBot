/**
 * Rule34 Cache Manager
 * Handles caching for search results, user sessions, blacklists, and preferences
 */
// Interfaces
interface Rule34Session {
    userId: string;
    createdAt: number;
    updatedAt: number;
    pagination?: PaginationState;
    query?: string;
    results?: any[];
    currentIndex?: number;
    [key: string]: any;
}

interface PaginationState {
    currentIndex: number;
    currentPage: number;
    totalResults: number;
    hasMore: boolean;
}

interface SearchCacheEntry {
    timestamp: number;
    results?: any[];
    totalCount?: number;
    [key: string]: any;
}

interface AutocompleteEntry {
    suggestions: string[];
    timestamp: number;
}

interface Rule34Favorite {
    id: number | string;
    addedAt: number;
    url?: string;
    tags?: string[];
    score?: number;
    [key: string]: any;
}

interface HistoryEntry {
    id: number | string;
    viewedAt: number;
    url?: string;
    tags?: string[];
    [key: string]: any;
}

interface UserPreferences {
    aiFilter: boolean;
    defaultRating: string | null;
    minScore: number;
    excludeLowQuality: boolean;
    highQualityOnly: boolean;
    showAnimatedOnly: boolean;
    resultsPerPage: number;
    autoplay: boolean;
    compactMode: boolean;
    sortMode: string;
    safeMode: boolean;
}

interface CacheStats {
    sessions: number;
    searchCache: number;
    blacklists: number;
    preferences: number;
    favorites: number;
    history: number;
    autocomplete: number;
}

interface FavoriteResult {
    success: boolean;
    message?: string;
    favorites?: Rule34Favorite[];
}
// Rule34Cache Class
class Rule34Cache {
    // Search result cache
    private searchCache: Map<string, SearchCacheEntry>;
    // User session data (current search state, pagination, etc.)
    private userSessions: Map<string, Rule34Session>;
    // User blacklists (persistent tags to exclude)
    private userBlacklists: Map<string, string[]>;
    // User preferences
    private userPreferences: Map<string, Partial<UserPreferences>>;
    // Autocomplete cache
    private autocompleteCache: Map<string, AutocompleteEntry>;
    // Favorites cache
    private userFavorites: Map<string, Rule34Favorite[]>;
    // View history
    private viewHistory: Map<string, HistoryEntry[]>;
    
    // Cache durations
    private readonly SEARCH_CACHE_DURATION: number;
    private readonly SESSION_DURATION: number;
    private readonly AUTOCOMPLETE_CACHE_DURATION: number;
    private readonly HISTORY_MAX_SIZE: number;
    
    private cleanupInterval: NodeJS.Timeout | null;

    constructor() {
        // Search result cache
        this.searchCache = new Map();
        // User session data
        this.userSessions = new Map();
        // User blacklists
        this.userBlacklists = new Map();
        // User preferences
        this.userPreferences = new Map();
        // Autocomplete cache
        this.autocompleteCache = new Map();
        // Favorites cache
        this.userFavorites = new Map();
        // View history
        this.viewHistory = new Map();
        
        // Cache durations
        this.SEARCH_CACHE_DURATION = 10 * 60 * 1000;      // 10 minutes
        this.SESSION_DURATION = 2 * 60 * 60 * 1000;       // 2 hours
        this.AUTOCOMPLETE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.HISTORY_MAX_SIZE = 50;

        // Start cleanup interval
        this.cleanupInterval = setInterval(() => this._cleanup(), 5 * 60 * 1000);
    }
    /**
     * Create or update user session
     */
    setSession(userId: string, sessionData: Partial<Rule34Session>): Rule34Session {
        const session: Rule34Session = {
            ...sessionData,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.userSessions.set(userId, session);
        return session;
    }

    /**
     * Get user session
     */
    getSession(userId: string): Rule34Session | null {
        const session = this.userSessions.get(userId);
        if (!session) return null;
        
        if (Date.now() - session.updatedAt > this.SESSION_DURATION) {
            this.userSessions.delete(userId);
            return null;
        }
        
        return session;
    }

    /**
     * Update session property
     */
    updateSession(userId: string, updates: Partial<Rule34Session>): Rule34Session | null {
        const session = this.getSession(userId);
        if (!session) return null;
        
        const updated: Rule34Session = {
            ...session,
            ...updates,
            updatedAt: Date.now()
        };
        this.userSessions.set(userId, updated);
        return updated;
    }

    /**
     * Clear user session
     */
    clearSession(userId: string): void {
        this.userSessions.delete(userId);
    }
    /**
     * Cache search results
     */
    setSearchResults(cacheKey: string, data: Partial<SearchCacheEntry>): void {
        this.searchCache.set(cacheKey, {
            ...data,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached search results
     */
    getSearchResults(cacheKey: string): SearchCacheEntry | null {
        const cached = this.searchCache.get(cacheKey);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.SEARCH_CACHE_DURATION) {
            this.searchCache.delete(cacheKey);
            return null;
        }
        
        return cached;
    }

    /**
     * Generate cache key for search
     */
    generateSearchKey(userId: string, query: string, options: Record<string, any> = {}): string {
        const optStr = JSON.stringify(options);
        return `${userId}_${query}_${optStr}`;
    }
    /**
     * Get user's blacklist
     */
    getBlacklist(userId: string): string[] {
        return this.userBlacklists.get(userId) || [];
    }

    /**
     * Add tags to blacklist
     */
    addToBlacklist(userId: string, tags: string | string[]): string[] {
        const current = this.getBlacklist(userId);
        const newTags = Array.isArray(tags) ? tags : [tags];
        const updated = [...new Set([...current, ...newTags])];
        this.userBlacklists.set(userId, updated);
        return updated;
    }

    /**
     * Remove tags from blacklist
     */
    removeFromBlacklist(userId: string, tags: string | string[]): string[] {
        const current = this.getBlacklist(userId);
        const toRemove = Array.isArray(tags) ? tags : [tags];
        const updated = current.filter(t => !toRemove.includes(t));
        this.userBlacklists.set(userId, updated);
        return updated;
    }

    /**
     * Clear entire blacklist
     */
    clearBlacklist(userId: string): void {
        this.userBlacklists.set(userId, []);
    }

    /**
     * Check if tag is blacklisted
     */
    isBlacklisted(userId: string, tag: string): boolean {
        return this.getBlacklist(userId).includes(tag);
    }
    /**
     * Default preferences
     */
    getDefaultPreferences(): UserPreferences {
        return {
            aiFilter: true,          // Filter out AI by default
            defaultRating: null,     // null = all ratings
            minScore: 0,             // Minimum score filter
            excludeLowQuality: true, // Exclude low quality by default
            highQualityOnly: false,  // Only show high quality
            showAnimatedOnly: false, // Only show animated content
            resultsPerPage: 10,      // Results per page
            autoplay: false,         // Autoplay videos
            compactMode: false,      // Compact embed mode
            sortMode: 'score:desc',  // Default sort
            safeMode: false          // Extra safe filtering
        };
    }

    /**
     * Get user preferences
     */
    getPreferences(userId: string): UserPreferences {
        const prefs = this.userPreferences.get(userId);
        return { ...this.getDefaultPreferences(), ...prefs };
    }

    /**
     * Update user preferences
     */
    setPreferences(userId: string, preferences: Partial<UserPreferences>): UserPreferences {
        const current = this.getPreferences(userId);
        const updated = { ...current, ...preferences };
        this.userPreferences.set(userId, updated);
        return updated;
    }

    /**
     * Reset preferences to default
     */
    resetPreferences(userId: string): UserPreferences {
        this.userPreferences.delete(userId);
        return this.getDefaultPreferences();
    }
    /**
     * Cache autocomplete suggestions
     */
    setAutocompleteSuggestions(query: string, suggestions: string[]): void {
        this.autocompleteCache.set(query.toLowerCase(), {
            suggestions,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached autocomplete suggestions
     */
    getAutocompleteSuggestions(query: string): string[] | null {
        const cached = this.autocompleteCache.get(query.toLowerCase());
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.AUTOCOMPLETE_CACHE_DURATION) {
            this.autocompleteCache.delete(query.toLowerCase());
            return null;
        }
        
        return cached.suggestions;
    }
    /**
     * Get user favorites
     */
    getFavorites(userId: string): Rule34Favorite[] {
        return this.userFavorites.get(userId) || [];
    }

    /**
     * Add to favorites
     */
    addFavorite(userId: string, postId: number | string, postInfo: Record<string, any> = {}): FavoriteResult {
        const favorites = this.getFavorites(userId);
        
        // Check if already favorited
        if (favorites.some(f => f.id === postId)) {
            return { success: false, message: 'Already favorited' };
        }
        
        favorites.unshift({
            id: postId,
            ...postInfo,
            addedAt: Date.now()
        });
        
        // Limit favorites
        if (favorites.length > 100) {
            favorites.pop();
        }
        
        this.userFavorites.set(userId, favorites);
        return { success: true, favorites };
    }

    /**
     * Remove from favorites
     */
    removeFavorite(userId: string, postId: number | string): Rule34Favorite[] {
        const favorites = this.getFavorites(userId);
        const updated = favorites.filter(f => f.id !== postId);
        this.userFavorites.set(userId, updated);
        return updated;
    }

    /**
     * Check if favorited
     */
    isFavorited(userId: string, postId: number | string): boolean {
        return this.getFavorites(userId).some(f => f.id === postId);
    }
    /**
     * Add to view history
     */
    addToHistory(userId: string, postId: number | string, postInfo: Record<string, any> = {}): HistoryEntry[] {
        let history = this.viewHistory.get(userId) || [];
        
        // Remove if exists (to move to front)
        history = history.filter(h => h.id !== postId);
        
        history.unshift({
            id: postId,
            ...postInfo,
            viewedAt: Date.now()
        });
        
        // Limit history size
        if (history.length > this.HISTORY_MAX_SIZE) {
            history = history.slice(0, this.HISTORY_MAX_SIZE);
        }
        
        this.viewHistory.set(userId, history);
        return history;
    }

    /**
     * Get view history
     */
    getHistory(userId: string, limit: number = 20): HistoryEntry[] {
        const history = this.viewHistory.get(userId) || [];
        return history.slice(0, limit);
    }

    /**
     * Clear view history
     */
    clearHistory(userId: string): void {
        this.viewHistory.delete(userId);
    }
    /**
     * Set pagination state
     */
    setPagination(userId: string, state: Partial<PaginationState>): Rule34Session | null {
        return this.updateSession(userId, {
            pagination: {
                currentIndex: state.currentIndex || 0,
                currentPage: state.currentPage || 0,
                totalResults: state.totalResults || 0,
                hasMore: state.hasMore || false
            }
        });
    }

    /**
     * Get pagination state
     */
    getPagination(userId: string): PaginationState | null {
        const session = this.getSession(userId);
        return session?.pagination || null;
    }
    private _cleanup(): void {
        const now = Date.now();
        
        // Clean search cache
        for (const [key, value] of this.searchCache.entries()) {
            if (now - value.timestamp > this.SEARCH_CACHE_DURATION) {
                this.searchCache.delete(key);
            }
        }
        
        // Clean sessions
        for (const [key, value] of this.userSessions.entries()) {
            if (now - value.updatedAt > this.SESSION_DURATION) {
                this.userSessions.delete(key);
            }
        }
        
        // Clean autocomplete cache
        for (const [key, value] of this.autocompleteCache.entries()) {
            if (now - value.timestamp > this.AUTOCOMPLETE_CACHE_DURATION) {
                this.autocompleteCache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return {
            sessions: this.userSessions.size,
            searchCache: this.searchCache.size,
            blacklists: this.userBlacklists.size,
            preferences: this.userPreferences.size,
            favorites: this.userFavorites.size,
            history: this.viewHistory.size,
            autocomplete: this.autocompleteCache.size
        };
    }

    /**
     * Destroy (for cleanup)
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Export singleton instance
const rule34Cache = new Rule34Cache();

export { rule34Cache, Rule34Cache };
export type {
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
export default rule34Cache;
