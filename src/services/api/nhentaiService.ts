/**
 * NHentai Service
 * Handles all API interactions with nhentai
 * @module services/api/nhentaiService
 */

import axios from 'axios';
import { circuitBreakerRegistry } from '../../core/CircuitBreakerRegistry';
import cacheService from '../../cache/CacheService.js';
// TYPES & INTERFACES
// API Configuration
const API_BASE = 'https://nhentai.net/api';
const GALLERY_ENDPOINT = '/gallery';
const THUMBNAIL_BASE = 'https://t.nhentai.net/galleries';
const IMAGE_BASE = 'https://i.nhentai.net/galleries';

// Image type mapping
const IMAGE_TYPES: Record<string, string> = {
    'j': 'jpg',
    'p': 'png',
    'g': 'gif'
};

// Known popular gallery IDs (curated fallback list)
const POPULAR_GALLERIES: number[] = [
    177013, 228922, 265918, 139808, 297974,
    331461, 255662, 324303, 271048, 317115,
    356399, 367270, 349115, 361710, 366028,
    386483, 393321, 393497, 396823, 400485
];

// Request configuration
const REQUEST_CONFIG = {
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }
};

export interface NHentaiTag {
    id: number;
    type: 'tag' | 'artist' | 'character' | 'parody' | 'group' | 'language' | 'category';
    name: string;
    url: string;
    count: number;
}

export interface NHentaiPage {
    t: string; // Type: j, p, g
    w: number; // Width
    h: number; // Height
}

export interface NHentaiImages {
    pages: NHentaiPage[];
    cover: NHentaiPage;
    thumbnail: NHentaiPage;
}

export interface NHentaiTitle {
    english?: string;
    japanese?: string;
    pretty?: string;
}

export interface NHentaiGallery {
    id: number;
    media_id: string;
    title: NHentaiTitle;
    images: NHentaiImages;
    scanlator: string;
    upload_date: number;
    tags: NHentaiTag[];
    num_pages: number;
    num_favorites: number;
}

export interface GalleryResult {
    success: boolean;
    data?: NHentaiGallery;
    error?: string;
    code?: string;
    fromCache?: boolean;
}

export interface SearchData {
    results: NHentaiGallery[];
    numPages: number;
    perPage: number;
    totalResults: number;
}

export interface SearchResult {
    success: boolean;
    data?: SearchData;
    error?: string;
    code?: string;
    fromCache?: boolean;
}

export interface PageUrl {
    pageNum: number;
    url: string;
    width: number;
    height: number;
}

export interface ParsedTags {
    artists: string[];
    characters: string[];
    parodies: string[];
    groups: string[];
    tags: string[];
    languages: string[];
    categories: string[];
}

interface NHentaiSearchResponse {
    result: NHentaiGallery[];
    num_pages: number;
    per_page: number;
}
// NHENTAI SERVICE CLASS
class NHentaiService {
    private readonly CACHE_NS = 'api';
    private readonly CACHE_TTL = 300; // 5 minutes in seconds

    constructor() {
        // No local cache setup needed — uses centralized cacheService
    }

    /**
     * Fetch gallery data by code with circuit breaker
     */
    async fetchGallery(code: number | string): Promise<GalleryResult> {
        // Check cache first
        const cached = await cacheService.get<NHentaiGallery>(this.CACHE_NS, `nhentai:gallery_${code}`);
        if (cached) return { success: true, data: cached, fromCache: true };

        return circuitBreakerRegistry.execute('nsfw', async () => {
            try {
                const response = await axios.get<NHentaiGallery>(
                    `${API_BASE}${GALLERY_ENDPOINT}/${code}`,
                    REQUEST_CONFIG
                );

                // Cache successful response
                await cacheService.set(this.CACHE_NS, `nhentai:gallery_${code}`, response.data, this.CACHE_TTL);

                return { success: true, data: response.data };
            } catch (error) {
                return this._handleError(error);
            }
        });
    }

    /**
     * Fetch random gallery with circuit breaker
     */
    async fetchRandomGallery(): Promise<GalleryResult> {
        const maxAttempts = 3;

        for (let i = 0; i < maxAttempts; i++) {
            // Generate random ID between 1 and current max (~500000)
            const randomCode = Math.floor(Math.random() * 500000) + 1;
            const result = await this.fetchGallery(randomCode);

            if (result.success) {
                return result;
            }

            // Proper delay between retries to avoid rate limiting (exponential backoff)
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }

        // Fallback to known popular galleries
        return this.fetchPopularGallery();
    }

    /**
     * Fetch a popular gallery - tries actual popular API first, falls back to curated list
     */
    async fetchPopularGallery(): Promise<GalleryResult> {
        // First, try to fetch from actual popular/homepage API
        try {
            const response = await axios.get(`${API_BASE}/galleries/popular`, {
                ...REQUEST_CONFIG,
                timeout: 10000
            });
            
            if (response.data?.result && Array.isArray(response.data.result) && response.data.result.length > 0) {
                // Pick a random gallery from popular results
                const randomIndex = Math.floor(Math.random() * response.data.result.length);
                const gallery = response.data.result[randomIndex] as NHentaiGallery;
                if (gallery?.id) {
                    await cacheService.set(this.CACHE_NS, `nhentai:gallery_${gallery.id}`, gallery, this.CACHE_TTL);
                    return { success: true, data: gallery };
                }
            }
        } catch {
            // API failed, try homepage
        }

        // Try homepage galleries
        try {
            const response = await axios.get(`${API_BASE}/galleries/all`, {
                ...REQUEST_CONFIG,
                params: { page: 1 },
                timeout: 10000
            });
            
            if (response.data?.result && Array.isArray(response.data.result) && response.data.result.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(25, response.data.result.length));
                const gallery = response.data.result[randomIndex] as NHentaiGallery;
                if (gallery?.id) {
                    await cacheService.set(this.CACHE_NS, `nhentai:gallery_${gallery.id}`, gallery, this.CACHE_TTL);
                    return { success: true, data: gallery };
                }
            }
        } catch {
            // Homepage API also failed, fall back to curated list
        }

        // Fallback: try curated popular galleries list
        const shuffled = [...POPULAR_GALLERIES].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(5, shuffled.length); i++) {
            const galleryId = shuffled[i];
            if (galleryId === undefined) continue;
            
            try {
                const result = await this.fetchGallery(galleryId);
                if (result.success && result.data) {
                    return result;
                }
            } catch {
                // Try next gallery
            }
            
            // Small delay between attempts
            if (i < 4) await new Promise(r => setTimeout(r, 300));
        }
        
        return { success: false, error: 'Could not fetch any popular gallery. The service may be temporarily unavailable.' };
    }

    /**
     * Search galleries by query with circuit breaker
     */
    async searchGalleries(
        query: string,
        page: number = 1,
        sort: 'popular' | 'recent' = 'popular'
    ): Promise<SearchResult> {
        const cacheKey = `nhentai:search_${query}_${page}_${sort}`;
        const cached = await cacheService.get<SearchData>(this.CACHE_NS, cacheKey);
        if (cached) return { success: true, data: cached, fromCache: true };

        return circuitBreakerRegistry.execute('nsfw', async () => {
            try {
                const encodedQuery = encodeURIComponent(query);
                const sortParam = sort === 'recent' ? 'date' : 'popular';

                const response = await axios.get<NHentaiSearchResponse>(
                    `${API_BASE}/galleries/search?query=${encodedQuery}&page=${page}&sort=${sortParam}`,
                    REQUEST_CONFIG
                );

                const data: SearchData = {
                    results: response.data.result || [],
                    numPages: response.data.num_pages || 1,
                    perPage: response.data.per_page || 25,
                    totalResults: (response.data.num_pages || 1) * (response.data.per_page || 25)
                };

                await cacheService.set(this.CACHE_NS, cacheKey, data, this.CACHE_TTL);

                return { success: true, data };
            } catch (error) {
                return this._handleError(error);
            }
        });
    }

    /**
     * Get autocomplete suggestions for search with circuit breaker
     */
    async getSearchSuggestions(query: string): Promise<string[]> {
        if (!query || query.length < 2) return [];

        const cacheKey = `nhentai:suggest_${query.toLowerCase()}`;
        const cached = await cacheService.get<string[]>(this.CACHE_NS, cacheKey);
        if (cached) return cached;

        return circuitBreakerRegistry.execute('nsfw', async () => {
            try {
                const response = await axios.get<NHentaiSearchResponse>(
                    `${API_BASE}/galleries/search?query=${encodeURIComponent(query)}&page=1`,
                    { ...REQUEST_CONFIG, timeout: 3000 }
                );

                const results = response.data.result || [];

                // Extract unique tags from results
                const tagSet = new Set<string>();
                results.forEach(gallery => {
                    gallery.tags?.forEach(tag => {
                        if (tag.type === 'tag' || tag.type === 'character' || tag.type === 'parody') {
                            if (tag.name.toLowerCase().includes(query.toLowerCase())) {
                                tagSet.add(tag.name);
                            }
                        }
                    });
                });

                // Also add titles that match
                const titleMatches = results
                    .filter(g => g.title?.english?.toLowerCase().includes(query.toLowerCase()) ||
                        g.title?.japanese?.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 5)
                    .map(g => g.title.english || g.title.japanese || '');

                const suggestions = [...new Set([...tagSet, ...titleMatches])].slice(0, 15);
                await cacheService.set(this.CACHE_NS, cacheKey, suggestions, this.CACHE_TTL);

                return suggestions;
            } catch (error) {
                console.error('[NHentai Autocomplete Error]', (error as Error).message);
                return [];
            }
        });
    }

    /**
     * Get page image URLs for a gallery
     */
    getPageUrls(gallery: NHentaiGallery, startPage: number = 1, endPage: number | null = null): PageUrl[] {
        const { media_id, images } = gallery;
        const pages = images?.pages || [];

        if (pages.length === 0) {
            return [];
        }

        const end = endPage ? Math.min(endPage, pages.length) : pages.length;
        const urls: PageUrl[] = [];

        for (let i = startPage - 1; i < end; i++) {
            const page = pages[i];
            if (page) {
                const ext = IMAGE_TYPES[page.t] || 'jpg';
                urls.push({
                    pageNum: i + 1,
                    url: `${IMAGE_BASE}/${media_id}/${i + 1}.${ext}`,
                    width: page.w,
                    height: page.h
                });
            }
        }

        return urls;
    }

    /**
     * Get thumbnail URL for gallery cover
     */
    getThumbnailUrl(mediaId: string, coverType: string): string {
        const ext = IMAGE_TYPES[coverType] || 'jpg';
        return `${THUMBNAIL_BASE}/${mediaId}/cover.${ext}`;
    }

    /**
     * Get page thumbnail URL (smaller size for preview)
     */
    getPageThumbnailUrl(mediaId: string, pageNum: number, pageType: string): string {
        const ext = IMAGE_TYPES[pageType] || 'jpg';
        return `${THUMBNAIL_BASE}/${mediaId}/${pageNum}t.${ext}`;
    }

    /**
     * Parse tags by type
     */
    getTagsByType(tags: NHentaiTag[] | undefined, type: NHentaiTag['type']): string[] {
        if (!tags || !Array.isArray(tags)) return [];
        return tags
            .filter(tag => tag.type === type)
            .map(tag => tag.name)
            .slice(0, 15);
    }

    /**
     * Get all tag types from gallery
     */
    parseAllTags(tags: NHentaiTag[] | undefined): ParsedTags {
        return {
            artists: this.getTagsByType(tags, 'artist'),
            characters: this.getTagsByType(tags, 'character'),
            parodies: this.getTagsByType(tags, 'parody'),
            groups: this.getTagsByType(tags, 'group'),
            tags: this.getTagsByType(tags, 'tag'),
            languages: this.getTagsByType(tags, 'language'),
            categories: this.getTagsByType(tags, 'category')
        };
    }

    /**
     * Handle API errors
     */
    private _handleError<T extends { success: boolean; error?: string; code?: string }>(error: unknown): T {
        const err = error as { response?: { status: number }; code?: string; message?: string };

        if (err.response?.status === 404) {
            return { success: false, error: 'Gallery not found. Please check the code.', code: 'NOT_FOUND' } as T;
        }
        if (err.response?.status === 403) {
            return { success: false, error: 'Access denied. The gallery may be region-locked.', code: 'FORBIDDEN' } as T;
        }
        if (err.response?.status === 429) {
            return { success: false, error: 'Rate limited. Please wait a moment.', code: 'RATE_LIMITED' } as T;
        }
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
            return { success: false, error: 'Request timed out. Please try again.', code: 'TIMEOUT' } as T;
        }

        console.error('[NHentai Service Error]', err.message);
        return { success: false, error: 'Failed to fetch gallery. Please try again later.', code: 'UNKNOWN' } as T;
    }

    /**
     * Clear all nhentai cache entries
     */
    async clearCache(): Promise<void> {
        await cacheService.clearNamespace(this.CACHE_NS);
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // No local resources to clean up
    }
}

// Export singleton instance
const nhentaiService = new NHentaiService();

export { nhentaiService, NHentaiService };
export default nhentaiService;
