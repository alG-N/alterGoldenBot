/**
 * Pixiv Cache - Extends BaseCache with search-specific functionality
 */

import { BaseCache } from '../../cache/BaseCache';
// Interfaces
interface PixivSearchResult {
    query: string;
    results: any[];
    timestamp?: number;
}

interface PixivResultData {
    results: any[];
    currentIndex: number;
    mangaPageIndex: number;
    query?: string;
    userId?: string;
    [key: string]: any;
}
// PixivCache Class
class PixivCache {
    private searchCache: BaseCache;
    private resultCache: BaseCache;

    constructor() {
        // Use BaseCache for both caches
        this.searchCache = new BaseCache('pixiv-search', { 
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 200 
        });
        this.resultCache = new BaseCache('pixiv-results', { 
            defaultTTL: 30 * 60 * 1000, // 30 minutes
            maxSize: 100 
        });
    }

    // Search autocomplete cache
    getSearchSuggestions(query: string): any[] | null {
        const key = query.toLowerCase();
        return (this.searchCache.get(key) as any[]) || null;
    }

    setSearchSuggestions(query: string, results: any[]): void {
        const key = query.toLowerCase();
        this.searchCache.set(key, results);
    }

    // Result cache for pagination
    getResults(cacheKey: string): PixivResultData | null {
        return (this.resultCache.get(cacheKey) as PixivResultData) || null;
    }

    setResults(cacheKey: string, data: PixivResultData): void {
        this.resultCache.set(cacheKey, data);
    }

    deleteResults(cacheKey: string): void {
        this.resultCache.delete(cacheKey);
    }

    // Alias methods for button handler compatibility
    getSearchResults(cacheKey: string): PixivResultData | null {
        return this.getResults(cacheKey);
    }

    setSearchResults(cacheKey: string, data: Partial<PixivResultData> & { results: any[] }): void {
        this.setResults(cacheKey, {
            ...data,
            currentIndex: data.currentIndex || 0,
            mangaPageIndex: data.mangaPageIndex || 0,
            results: data.results
        });
    }

    updateSearchResults(cacheKey: string, updates: Partial<PixivResultData>): void {
        const existing = this.getResults(cacheKey);
        if (existing) {
            this.setResults(cacheKey, { ...existing, ...updates });
        }
    }
}

// Export singleton instance
const pixivCache = new PixivCache();

export { pixivCache, PixivCache };
export type { PixivSearchResult, PixivResultData };
export default pixivCache;
