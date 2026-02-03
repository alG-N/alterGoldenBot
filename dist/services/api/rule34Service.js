"use strict";
/**
 * Rule34 Service
 * Handles Rule34 API interactions with circuit breaker protection
 * @module services/api/rule34Service
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule34Service = exports.rule34Service = void 0;
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
dotenv.config({ path: path.join(__dirname, '../.env') });
// CONSTANTS
const AI_TAGS = [
    'ai_generated', 'ai-generated', 'ai_art', 'ai-art',
    'stable_diffusion', 'novelai', 'midjourney', 'dalle',
    'ai_assisted', 'nai_diffusion', 'machine_learning',
    'artificial_intelligence', 'ai_created', 'ai_(artwork)'
];
const QUALITY_TAGS = {
    high: ['high_resolution', 'highres', 'absurdres', 'incredibly_absurdres', 'masterpiece', 'best_quality'],
    low: ['low_resolution', 'lowres', 'bad_anatomy', 'bad_proportions', 'poorly_drawn']
};
const CONTENT_TYPE_TAGS = {
    animated: ['animated', 'video', 'webm', 'gif', 'animated_gif', 'mp4', 'sound'],
    comic: ['comic', 'manga', 'doujinshi', 'multi-panel', 'page_number'],
    photo: ['photo_(medium)', 'photorealistic', 'realistic', '3d', 'cosplay']
};
const RATINGS = {
    safe: 'safe',
    questionable: 'questionable',
    explicit: 'explicit'
};
// RULE34 SERVICE CLASS
class Rule34Service {
    baseUrl = 'https://api.rule34.xxx/index.php';
    autocompleteUrl = 'https://api.rule34.xxx/autocomplete.php';
    auth;
    headers;
    translationCache;
    constructor() {
        this.auth = {
            userId: process.env.RULE34_USER_ID || '',
            apiKey: process.env.RULE34_API_KEY || ''
        };
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        this.translationCache = new Map();
    }
    /**
     * Search for posts with advanced filtering and circuit breaker
     */
    async search(query, options = {}) {
        const { limit = 50, page = 0, sort = 'score:desc', rating = null, excludeAi = false, minScore = 0, contentType = null, excludeTags = [], requireTags = [], minWidth = 0, minHeight = 0, highQualityOnly = false, excludeLowQuality = false } = options;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            const searchTags = this._buildSearchQuery(query, {
                rating,
                excludeAi,
                minScore,
                contentType,
                excludeTags,
                requireTags,
                minWidth,
                minHeight,
                highQualityOnly,
                excludeLowQuality,
                sort
            });
            const url = new URL(this.baseUrl);
            url.searchParams.append('page', 'dapi');
            url.searchParams.append('s', 'post');
            url.searchParams.append('q', 'index');
            url.searchParams.append('limit', Math.min(limit, 100).toString());
            url.searchParams.append('pid', page.toString());
            url.searchParams.append('tags', searchTags);
            url.searchParams.append('json', '1');
            if (this.auth.userId && this.auth.apiKey) {
                url.searchParams.append('user_id', this.auth.userId);
                url.searchParams.append('api_key', this.auth.apiKey);
            }
            console.log(`[Rule34] Searching: "${searchTags}" | Page: ${page} | Limit: ${limit}`);
            try {
                const response = await fetch(url.toString(), { headers: this.headers });
                if (!response.ok) {
                    throw new Error(`Rule34 API error: ${response.status}`);
                }
                const data = await response.json();
                if (!data || !Array.isArray(data)) {
                    return { posts: [], totalCount: 0, hasMore: false };
                }
                const posts = this._processResults(data, {
                    excludeAi,
                    minScore,
                    highQualityOnly,
                    excludeLowQuality
                });
                console.log(`[Rule34] Found ${posts.length} posts (pre-filter: ${data.length})`);
                return {
                    posts,
                    totalCount: data.length,
                    hasMore: data.length === limit,
                    query: searchTags
                };
            }
            catch (error) {
                console.error('[Rule34 Search Error]', error);
                throw error;
            }
        });
    }
    /**
     * Get a single post by ID with circuit breaker
     */
    async getPostById(id) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            const url = new URL(this.baseUrl);
            url.searchParams.append('page', 'dapi');
            url.searchParams.append('s', 'post');
            url.searchParams.append('q', 'index');
            url.searchParams.append('id', id.toString());
            url.searchParams.append('json', '1');
            if (this.auth.userId && this.auth.apiKey) {
                url.searchParams.append('user_id', this.auth.userId);
                url.searchParams.append('api_key', this.auth.apiKey);
            }
            try {
                const response = await fetch(url.toString(), { headers: this.headers });
                if (!response.ok) {
                    throw new Error(`Rule34 API error: ${response.status}`);
                }
                const data = await response.json();
                if (!data || data.length === 0) {
                    return null;
                }
                const firstPost = data[0];
                if (!firstPost) {
                    return null;
                }
                return this._enrichPost(firstPost);
            }
            catch (error) {
                console.error('[Rule34 GetById Error]', error);
                throw error;
            }
        });
    }
    /**
     * Get random posts with optional filters
     */
    async getRandom(options = {}) {
        const { tags = '', count = 1, rating = null, excludeAi = false, minScore = 0 } = options;
        const result = await this.search(tags, {
            limit: Math.min(100, count * 10),
            page: Math.floor(Math.random() * 10),
            rating,
            excludeAi,
            minScore,
            sort: 'random'
        });
        if (result.posts.length === 0) {
            return [];
        }
        const shuffled = this._shuffleArray([...result.posts]);
        return shuffled.slice(0, count);
    }
    /**
     * Get trending/popular posts
     */
    async getTrending(options = {}) {
        const { timeframe = 'day', limit = 50, excludeAi = false } = options;
        const minScore = timeframe === 'day' ? 50 : timeframe === 'week' ? 100 : 200;
        return this.search('', {
            limit,
            sort: 'score:desc',
            minScore,
            excludeAi
        });
    }
    /**
     * Get autocomplete suggestions with circuit breaker
     */
    async getAutocompleteSuggestions(query) {
        if (!query || query.length < 2)
            return [];
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            const url = `${this.autocompleteUrl}?q=${encodeURIComponent(query)}`;
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                const response = await fetch(url, {
                    headers: this.headers,
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (!response.ok) {
                    return [];
                }
                const data = await response.json();
                return data.slice(0, 25).map(item => ({
                    name: item.label || item.value || '',
                    value: item.value || item.label || '',
                    type: item.type || 'tag',
                    count: item.count || 0
                }));
            }
            catch (error) {
                console.log('[Rule34 Autocomplete] Error:', error.message);
                return [];
            }
        });
    }
    /**
     * Get tag information
     */
    async getTagInfo(tagName) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            const url = new URL(this.baseUrl);
            url.searchParams.append('page', 'dapi');
            url.searchParams.append('s', 'tag');
            url.searchParams.append('q', 'index');
            url.searchParams.append('name', tagName);
            url.searchParams.append('json', '1');
            try {
                const response = await fetch(url.toString(), { headers: this.headers });
                if (!response.ok)
                    return null;
                const data = await response.json();
                return data[0] || null;
            }
            catch {
                return null;
            }
        });
    }
    /**
     * Get comments for a post
     */
    async getComments(postId) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            const url = new URL(this.baseUrl);
            url.searchParams.append('page', 'dapi');
            url.searchParams.append('s', 'comment');
            url.searchParams.append('q', 'index');
            url.searchParams.append('post_id', postId.toString());
            url.searchParams.append('json', '1');
            try {
                const response = await fetch(url.toString(), { headers: this.headers });
                if (!response.ok)
                    return [];
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            }
            catch {
                return [];
            }
        });
    }
    /**
     * Get related tags
     */
    async getRelatedTags(tag, limit = 20) {
        const result = await this.search(tag, { limit: 50 });
        if (result.posts.length === 0)
            return [];
        const tagCounts = new Map();
        const searchTag = tag.toLowerCase();
        for (const post of result.posts) {
            const tags = post.tags.split(' ');
            for (const t of tags) {
                if (t.toLowerCase() !== searchTag && t.length > 2) {
                    tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
                }
            }
        }
        return [...tagCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }
    /**
     * Translate tag to booru format
     */
    async translateTag(tag) {
        if (this.translationCache.has(tag)) {
            return this.translationCache.get(tag);
        }
        const commonTranslations = {
            'blonde hair': 'blonde_hair',
            'blue eyes': 'blue_eyes',
            'big breasts': 'large_breasts',
            'small breasts': 'small_breasts',
            'long hair': 'long_hair',
            'short hair': 'short_hair',
            'cat ears': 'cat_ears',
            'animal ears': 'animal_ears',
        };
        const lowerTag = tag.toLowerCase();
        if (commonTranslations[lowerTag]) {
            this.translationCache.set(tag, commonTranslations[lowerTag]);
            return commonTranslations[lowerTag];
        }
        const formatted = tag.trim().replace(/\s+/g, '_').toLowerCase();
        this.translationCache.set(tag, formatted);
        return formatted;
    }
    _buildSearchQuery(query, options) {
        const { rating, excludeAi, minScore, contentType, excludeTags = [], requireTags = [], minWidth, minHeight, highQualityOnly, excludeLowQuality, sort } = options;
        const tags = [];
        if (query && query.trim()) {
            const queryTags = query.split(/[\s,]+/).filter(t => t.length > 0);
            tags.push(...queryTags);
        }
        if (rating && RATINGS[rating]) {
            tags.push(`rating:${RATINGS[rating]}`);
        }
        if (excludeAi) {
            for (const aiTag of AI_TAGS) {
                tags.push(`-${aiTag}`);
            }
        }
        if (minScore && minScore > 0) {
            tags.push(`score:>=${minScore}`);
        }
        if (minWidth && minWidth > 0) {
            tags.push(`width:>=${minWidth}`);
        }
        if (minHeight && minHeight > 0) {
            tags.push(`height:>=${minHeight}`);
        }
        if (contentType) {
            const typeTags = CONTENT_TYPE_TAGS[contentType];
            if (typeTags && typeTags.length > 0) {
                tags.push(`( ${typeTags.join(' ~ ')} )`);
            }
        }
        if (highQualityOnly) {
            const qualityTags = QUALITY_TAGS.high;
            tags.push(`( ${qualityTags.join(' ~ ')} )`);
        }
        if (excludeLowQuality) {
            for (const lowTag of QUALITY_TAGS.low) {
                tags.push(`-${lowTag}`);
            }
        }
        for (const excludeTag of excludeTags) {
            if (excludeTag && excludeTag.trim()) {
                tags.push(`-${excludeTag.trim()}`);
            }
        }
        for (const requireTag of requireTags) {
            if (requireTag && requireTag.trim()) {
                tags.push(requireTag.trim());
            }
        }
        if (sort && sort !== 'default') {
            tags.push(`sort:${sort}`);
        }
        return tags.join(' ');
    }
    _processResults(posts, options) {
        const { excludeAi, minScore, highQualityOnly, excludeLowQuality } = options;
        return posts
            .map(post => this._enrichPost(post))
            .filter(post => {
            if (minScore && minScore > 0 && (post.score || 0) < minScore) {
                return false;
            }
            if (excludeAi && this._isAiGenerated(post)) {
                return false;
            }
            if (highQualityOnly && !this._isHighQuality(post)) {
                return false;
            }
            if (excludeLowQuality && this._isLowQuality(post)) {
                return false;
            }
            return true;
        });
    }
    _enrichPost(post) {
        const tags = (post.tags || '').split(' ');
        return {
            id: post.id,
            hash: post.hash || post.md5,
            width: post.width,
            height: post.height,
            score: post.score || 0,
            rating: post.rating,
            owner: post.owner,
            tags: post.tags,
            tagList: tags,
            tagCount: tags.length,
            fileUrl: post.file_url,
            sampleUrl: post.sample_url || post.file_url,
            previewUrl: post.preview_url,
            hasVideo: this._isVideo(post),
            hasSound: tags.some(t => t === 'sound' || t === 'has_audio'),
            isAnimated: this._isAnimated(post),
            isAiGenerated: this._isAiGenerated(post),
            isHighQuality: this._isHighQuality(post),
            isHighRes: post.width >= 1920 || post.height >= 1080,
            source: post.source || '',
            parentId: post.parent_id,
            hasChildren: post.has_children,
            createdAt: post.created_at,
            change: post.change,
            contentType: this._detectContentType(post),
            fileExtension: this._getFileExtension(post.file_url),
            pageUrl: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`
        };
    }
    _isAiGenerated(post) {
        const tags = ('tagList' in post ? post.tagList.join(' ') : post.tags || '').toLowerCase();
        return AI_TAGS.some(aiTag => tags.includes(aiTag));
    }
    _isHighQuality(post) {
        const tags = ('tagList' in post ? post.tagList.join(' ') : post.tags || '').toLowerCase();
        return QUALITY_TAGS.high.some(tag => tags.includes(tag));
    }
    _isLowQuality(post) {
        const tags = ('tagList' in post ? post.tagList.join(' ') : post.tags || '').toLowerCase();
        return QUALITY_TAGS.low.some(tag => tags.includes(tag));
    }
    _isVideo(post) {
        const url = post.file_url || '';
        return url.endsWith('.mp4') || url.endsWith('.webm');
    }
    _isAnimated(post) {
        const url = post.file_url || '';
        const tags = (post.tags || '').toLowerCase();
        return url.endsWith('.gif') ||
            url.endsWith('.mp4') ||
            url.endsWith('.webm') ||
            tags.includes('animated');
    }
    _detectContentType(post) {
        if (this._isVideo(post))
            return 'video';
        const url = post.file_url || '';
        if (url.endsWith('.gif'))
            return 'gif';
        const tags = (post.tags || '').toLowerCase();
        if (tags.includes('comic') || tags.includes('manga'))
            return 'comic';
        if (tags.includes('animated'))
            return 'animated';
        return 'image';
    }
    _getFileExtension(url) {
        if (!url)
            return 'unknown';
        const match = url.match(/\.(\w+)(?:\?|$)/);
        return match && match[1] ? match[1].toLowerCase() : 'unknown';
    }
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
    /**
     * Format tags for display
     */
    formatTagsForDisplay(tags, maxLength = 500) {
        if (typeof tags === 'string') {
            tags = tags.split(' ');
        }
        const categories = {
            character: [],
            copyright: [],
            artist: [],
            general: [],
            meta: []
        };
        for (const tag of tags) {
            if (tag.includes('(') && tag.includes(')')) {
                categories.character.push(tag);
            }
            else if (tag.startsWith('artist:') || tag.endsWith('_(artist)')) {
                categories.artist.push(tag);
            }
            else if (['tagme', 'meta', 'source_request'].includes(tag)) {
                categories.meta.push(tag);
            }
            else {
                categories.general.push(tag);
            }
        }
        let result = '';
        if (categories.character.length > 0) {
            result += `**Characters:** ${categories.character.slice(0, 5).join(', ')}\n`;
        }
        if (categories.artist.length > 0) {
            result += `**Artist:** ${categories.artist.slice(0, 3).join(', ')}\n`;
        }
        if (categories.general.length > 0) {
            const generalStr = categories.general.slice(0, 15).join(', ');
            result += `**Tags:** ${generalStr}`;
            if (categories.general.length > 15) {
                result += ` (+${categories.general.length - 15} more)`;
            }
        }
        return result.length > maxLength ? result.slice(0, maxLength - 3) + '...' : result;
    }
    /**
     * Get blacklist suggestions
     */
    getBlacklistSuggestions() {
        return [
            'gore', 'guro', 'death', 'blood', 'violence',
            'scat', 'vore', 'inflation', 'feet', 'furry',
            ...AI_TAGS,
            ...QUALITY_TAGS.low
        ];
    }
}
exports.Rule34Service = Rule34Service;
// Export singleton instance
const rule34Service = new Rule34Service();
exports.rule34Service = rule34Service;
exports.default = rule34Service;
// CommonJS compatibility
module.exports = rule34Service;
module.exports.rule34Service = rule34Service;
module.exports.Rule34Service = Rule34Service;
//# sourceMappingURL=rule34Service.js.map