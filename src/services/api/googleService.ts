/**
 * Google/Search Service
 * Handles Google Custom Search API and DuckDuckGo fallback
 * @module services/api/googleService
 */

import axios, { AxiosError } from 'axios';
import { circuitBreakerRegistry } from '../../core/CircuitBreakerRegistry.js';
import cacheService from '../../cache/CacheService.js';
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
    private readonly CACHE_NS = 'api';
    private readonly CACHE_TTL = 300; // 5 minutes in seconds
    private readonly useDuckDuckGo: boolean;

    constructor() {
        this.useDuckDuckGo = USE_DUCKDUCKGO;
    }

    /**
     * Main search method with circuit breaker protection
     */
    async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        const { safeSearch = true, maxResults = 5 } = options;

        // Check cache
        const cacheKey = `google:search_${query}_${safeSearch}_${maxResults}`;
        const cached = await cacheService.get<SearchResponse>(this.CACHE_NS, cacheKey);
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
            await cacheService.set(this.CACHE_NS, cacheKey, result, this.CACHE_TTL);
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
     * Cleanup on shutdown
     */
    shutdown(): void {
        // No local resources to clean up
    }
}

// Export singleton and class
const googleService = new GoogleService();

export { googleService, GoogleService };
export default googleService;
