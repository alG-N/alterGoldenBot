/**
 * Google/Search Service
 * Handles Google Custom Search API and DuckDuckGo fallback
 * @module services/api/googleService
 */

import axios, { AxiosError } from 'axios';
import { circuitBreakerRegistry } from '../../core/CircuitBreakerRegistry';
// TYPES & INTERFACES
/**
 * Search result item
 */
export interface SearchResultItem {
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
    thumbnail: string | null;
}

/**
 * Search response
 */
export interface SearchResponse {
    success: boolean;
    results?: SearchResultItem[];
    totalResults?: number;
    searchEngine: 'Google' | 'DuckDuckGo';
    error?: string;
    fromCache?: boolean;
}

/**
 * Search options
 */
export interface SearchOptions {
    safeSearch?: boolean;
    maxResults?: number;
}

/**
 * Cache entry
 */
interface CacheEntry {
    data: SearchResponse;
    expiresAt: number;
}

/**
 * Google API response types
 */
interface GoogleSearchItem {
    title: string;
    link: string;
    snippet?: string;
    displayLink?: string;
    pagemap?: {
        cse_thumbnail?: Array<{ src: string }>;
    };
}

interface GoogleSearchResponse {
    items?: GoogleSearchItem[];
    searchInformation?: {
        totalResults?: string;
    };
}

/**
 * DuckDuckGo API response types
 */
interface DuckDuckGoTopic {
    FirstURL?: string;
    Text?: string;
    Icon?: { URL?: string };
}

interface DuckDuckGoResponse {
    Abstract?: string;
    Heading?: string;
    AbstractURL?: string;
    AbstractSource?: string;
    Image?: string;
    RelatedTopics?: DuckDuckGoTopic[];
}
// CONFIGURATION
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;
const USE_DUCKDUCKGO = !GOOGLE_API_KEY || !GOOGLE_CX;
const REQUEST_TIMEOUT = 10000;
// GOOGLE SERVICE CLASS
/**
 * Google Search Service with DuckDuckGo fallback
 */
class GoogleService {
    private cache: Map<string, CacheEntry>;
    private readonly cacheExpiry: number;
    private readonly maxCacheSize: number;
    private readonly useDuckDuckGo: boolean;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 300000; // 5 minutes
        this.maxCacheSize = 50;
        this.useDuckDuckGo = USE_DUCKDUCKGO;
        this.cleanupInterval = null;

        // Auto-cleanup every 10 minutes
        this.cleanupInterval = setInterval(() => this._cleanupCache(), 600000);
    }

    /**
     * Cleanup expired cache entries
     */
    private _cleanupCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Main search method with circuit breaker protection
     */
    async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        const { safeSearch = true, maxResults = 5 } = options;

        // Check cache
        const cacheKey = `search_${query}_${safeSearch}_${maxResults}`;
        const cached = this._getFromCache(cacheKey);
        if (cached) return { ...cached, fromCache: true };

        // Execute with circuit breaker
        const result = await circuitBreakerRegistry.execute('google', async () => {
            if (this.useDuckDuckGo) {
                return this.searchDuckDuckGo(query);
            } else {
                return this.searchGoogle(query, safeSearch, maxResults);
            }
        });

        if (result.success) {
            this._setCache(cacheKey, result);
        }

        return result;
    }

    /**
     * Search using Google Custom Search API
     */
    async searchGoogle(
        query: string, 
        safeSearch: boolean = true, 
        maxResults: number = 5
    ): Promise<SearchResponse> {
        try {
            const params = {
                key: GOOGLE_API_KEY,
                cx: GOOGLE_CX,
                q: query,
                num: Math.min(maxResults, 10),
                safe: safeSearch ? 'active' : 'off'
            };

            const response = await axios.get<GoogleSearchResponse>(
                'https://www.googleapis.com/customsearch/v1',
                { params, timeout: REQUEST_TIMEOUT }
            );

            if (!response.data.items || response.data.items.length === 0) {
                return {
                    success: true,
                    results: [],
                    totalResults: 0,
                    searchEngine: 'Google'
                };
            }

            const results: SearchResultItem[] = response.data.items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet || 'No description available.',
                displayLink: item.displayLink || '',
                thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null
            }));

            return {
                success: true,
                results,
                totalResults: parseInt(response.data.searchInformation?.totalResults || String(results.length)),
                searchEngine: 'Google'
            };
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error('[Google Search Error]', axiosError.message);

            // Fallback to DuckDuckGo on error
            if (axiosError.response?.status === 429 || axiosError.response?.status === 403) {
                console.log('[Google] Falling back to DuckDuckGo');
                return this.searchDuckDuckGo(query);
            }

            return {
                success: false,
                error: 'Search failed. Please try again.',
                searchEngine: 'Google'
            };
        }
    }

    /**
     * Search using DuckDuckGo Instant Answer API
     */
    async searchDuckDuckGo(query: string): Promise<SearchResponse> {
        try {
            const response = await axios.get<DuckDuckGoResponse>('https://api.duckduckgo.com/', {
                params: {
                    q: query,
                    format: 'json',
                    no_html: 1,
                    skip_disambig: 1
                },
                timeout: REQUEST_TIMEOUT
            });

            const data = response.data;
            const results: SearchResultItem[] = [];

            // Add abstract if available
            if (data.Abstract) {
                results.push({
                    title: data.Heading || query,
                    link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: data.Abstract,
                    displayLink: data.AbstractSource || 'DuckDuckGo',
                    thumbnail: data.Image || null
                });
            }

            // Add related topics
            if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
                for (const topic of data.RelatedTopics.slice(0, 4)) {
                    if (topic.FirstURL && topic.Text) {
                        try {
                            results.push({
                                title: topic.Text.split(' - ')[0]?.substring(0, 100) || topic.Text.substring(0, 100),
                                link: topic.FirstURL,
                                snippet: topic.Text,
                                displayLink: new URL(topic.FirstURL).hostname,
                                thumbnail: topic.Icon?.URL || null
                            });
                        } catch {
                            // Skip malformed URLs
                        }
                    }
                }
            }

            // Provide search link if no results
            if (results.length === 0) {
                results.push({
                    title: `Search "${query}" on DuckDuckGo`,
                    link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: 'Click to view search results on DuckDuckGo',
                    displayLink: 'duckduckgo.com',
                    thumbnail: null
                });
            }

            return {
                success: true,
                results,
                totalResults: results.length,
                searchEngine: 'DuckDuckGo'
            };
        } catch (error) {
            console.error('[DuckDuckGo Search Error]', (error as Error).message);
            return {
                success: false,
                error: 'Search failed. Please try again.',
                searchEngine: 'DuckDuckGo'
            };
        }
    }

    /**
     * Get current search engine being used
     */
    getSearchEngine(): 'Google' | 'DuckDuckGo' {
        return this.useDuckDuckGo ? 'DuckDuckGo' : 'Google';
    }

    /**
     * Cache management - get
     */
    private _getFromCache(key: string): SearchResponse | null {
        const entry = this.cache.get(key);
        if (!entry || Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Cache management - set
     */
    private _setCache(key: string, data: SearchResponse): void {
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
        this.cache.set(key, { data, expiresAt: Date.now() + this.cacheExpiry });
    }

    /**
     * Cleanup on shutdown
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}

// Export singleton and class
const googleService = new GoogleService();

export { googleService, GoogleService };
export default googleService;

// CommonJS compatibility
module.exports = googleService;
module.exports.googleService = googleService;
module.exports.GoogleService = GoogleService;
