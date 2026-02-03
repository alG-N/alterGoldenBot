"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redditService = exports.RedditService = void 0;
const axios_1 = __importDefault(require("axios"));
const buffer_1 = require("buffer");
const services_1 = __importDefault(require("../../config/services"));
const apiUtils_1 = require("../../utils/common/apiUtils");
const Logger_1 = __importDefault(require("../../core/Logger"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
// REDDIT SERVICE CLASS
/**
 * Service for interacting with Reddit API
 */
class RedditService {
    clientId;
    secret;
    accessToken = null;
    tokenExpiry = 0;
    // Configurable timeouts
    timeout;
    authTimeout;
    searchTimeout;
    maxRetries;
    userAgent;
    constructor() {
        this.clientId = services_1.default.reddit.clientId;
        this.secret = services_1.default.reddit.secretKey;
        // Configurable timeouts from config
        this.timeout = services_1.default.reddit.timeout || 10000;
        this.authTimeout = services_1.default.reddit.authTimeout || 5000;
        this.searchTimeout = services_1.default.reddit.searchTimeout || 2000;
        this.maxRetries = services_1.default.reddit.maxRetries || 2;
        this.userAgent = services_1.default.reddit.userAgent || 'DiscordBot/1.0';
    }
    /**
     * Get or refresh OAuth access token
     */
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        const auth = buffer_1.Buffer.from(`${this.clientId}:${this.secret}`).toString('base64');
        // Use retry logic for authentication
        return (0, apiUtils_1.withRetry)(async () => {
            const response = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.post('https://www.reddit.com/api/v1/access_token', 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: this.authTimeout
            }));
            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
            return this.accessToken;
        }, {
            name: 'Reddit Auth',
            maxRetries: this.maxRetries,
            retryDelay: 500
        }).catch((error) => {
            Logger_1.default.error('Reddit', `Authentication failed: ${error.response?.data || error.message}`);
            throw new Error('Failed to authenticate with Reddit');
        });
    }
    /**
     * Search for subreddits matching a query
     * @param query - Search query
     * @param limit - Maximum number of results
     */
    async searchSubreddits(query, limit = 10) {
        try {
            const res = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.get(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=${limit}`, {
                headers: { 'User-Agent': this.userAgent },
                timeout: this.searchTimeout
            }));
            return res.data.data.children.map(c => ({
                name: c.data.display_name,
                title: c.data.title?.slice(0, 50) || '',
                displayName: c.data.display_name_prefixed
            }));
        }
        catch (error) {
            Logger_1.default.debug('Reddit', `Subreddit search timeout/error: ${error.message}`);
            return [];
        }
    }
    /**
     * Fetch posts from a subreddit
     * @param subreddit - Subreddit name (without r/)
     * @param sortBy - Sort method
     * @param limit - Number of posts to fetch
     */
    async fetchSubredditPosts(subreddit, sortBy = 'top', limit = 5) {
        const token = await this.getAccessToken();
        // Use retry logic for fetching posts
        return (0, apiUtils_1.withRetry)(async () => {
            // First verify subreddit exists
            const aboutResponse = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.get(`https://oauth.reddit.com/r/${subreddit}/about`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': this.userAgent
                },
                timeout: this.timeout
            }));
            if (!aboutResponse.data || aboutResponse.data.kind !== 't5') {
                return { error: 'not_found' };
            }
            // Check rate limit
            const rateLimitRemaining = parseInt(aboutResponse.headers['x-ratelimit-remaining'], 10);
            if (rateLimitRemaining < 5) {
                return { error: 'rate_limited' };
            }
            // Fetch posts
            const params = { limit };
            if (sortBy === 'top') {
                params.t = 'day';
            }
            const response = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.get(`https://oauth.reddit.com/r/${subreddit}/${sortBy}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': this.userAgent
                },
                params,
                timeout: this.timeout
            }));
            if (!response.data?.data?.children) {
                return { error: 'no_posts' };
            }
            return {
                posts: response.data.data.children.map(child => this._parsePost(child.data))
            };
        }, {
            name: 'Reddit Fetch',
            maxRetries: this.maxRetries,
            retryDelay: 1000
        }).catch((error) => {
            if (error.response?.status === 404) {
                return { error: 'not_found' };
            }
            Logger_1.default.error('Reddit', `Error fetching from /r/${subreddit}: ${error.message}`);
            return { error: 'fetch_failed' };
        });
    }
    /**
     * Search for similar subreddits
     * @param subreddit - Subreddit name to find similar ones for
     */
    async searchSimilarSubreddits(subreddit) {
        const token = await this.getAccessToken();
        try {
            const response = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.get('https://oauth.reddit.com/subreddits/search', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'DiscordBot/1.0'
                },
                params: {
                    q: subreddit,
                    limit: 5,
                    sort: 'relevance'
                }
            }));
            return response.data?.data?.children?.map(child => child.data.display_name) || [];
        }
        catch (error) {
            console.error('Error fetching similar subreddits:', error.message);
            return [];
        }
    }
    /**
     * Fetch trending/popular posts from Reddit
     * @param region - Region filter (global, us, uk, etc)
     * @param limit - Number of posts to fetch
     */
    async fetchTrendingPosts(region = 'global', limit = 10) {
        const token = await this.getAccessToken();
        try {
            // Use /r/popular for trending content
            const endpoint = region === 'global'
                ? 'https://oauth.reddit.com/r/popular/hot'
                : `https://oauth.reddit.com/r/popular/hot?geo_filter=${region.toUpperCase()}`;
            const response = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'DiscordBot/1.0'
                },
                params: { limit }
            }));
            if (!response.data?.data?.children) {
                return { error: 'no_posts' };
            }
            return {
                posts: response.data.data.children.map(child => this._parsePost(child.data))
            };
        }
        catch (error) {
            Logger_1.default.error('Reddit', `Error fetching trending posts: ${error.message}`);
            return { error: 'fetch_failed' };
        }
    }
    /**
     * Fetch posts from r/all (everything trending)
     * @param sortBy - Sort method
     * @param limit - Number of posts
     */
    async fetchAllPosts(sortBy = 'hot', limit = 10) {
        const token = await this.getAccessToken();
        try {
            const response = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('externalApi', async () => axios_1.default.get(`https://oauth.reddit.com/r/all/${sortBy}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'DiscordBot/1.0'
                },
                params: { limit }
            }));
            if (!response.data?.data?.children) {
                return { error: 'no_posts' };
            }
            return {
                posts: response.data.data.children.map(child => this._parsePost(child.data))
            };
        }
        catch (error) {
            Logger_1.default.error('Reddit', `Error fetching r/all posts: ${error.message}`);
            return { error: 'fetch_failed' };
        }
    }
    /**
     * Parse raw Reddit post data into structured format
     * @param postData - Raw post data from Reddit API
     */
    _parsePost(postData) {
        let fullSizeImage = null;
        if (postData.preview?.images?.[0]?.source) {
            fullSizeImage = postData.preview.images[0].source.url.replace(/&amp;/g, '&');
        }
        let galleryImages = [];
        if (postData.gallery_data && postData.media_metadata) {
            galleryImages = postData.gallery_data.items
                .map(item => {
                const media = postData.media_metadata[item.media_id];
                return media?.s?.u?.replace(/&amp;/g, '&') || null;
            })
                .filter((url) => url !== null);
        }
        let videoUrl = null;
        let isVideo = false;
        if (postData.is_video && postData.media?.reddit_video) {
            videoUrl = postData.media.reddit_video.fallback_url;
            isVideo = true;
        }
        let contentType = 'text';
        if (isVideo)
            contentType = 'video';
        else if (galleryImages.length > 0)
            contentType = 'gallery';
        else if (fullSizeImage)
            contentType = 'image';
        return {
            title: postData.title || '[No Title]',
            url: postData.url || '[No URL]',
            image: fullSizeImage,
            gallery: galleryImages,
            video: videoUrl,
            isVideo,
            contentType,
            selftext: postData.selftext || '',
            permalink: `https://reddit.com${postData.permalink}`,
            upvotes: postData.ups ?? 0,
            downvotes: postData.downs ?? 0,
            comments: postData.num_comments ?? 0,
            awards: postData.total_awards_received ?? 0,
            author: postData.author || '[deleted]',
            nsfw: postData.over_18 || false,
            created: postData.created_utc || null
        };
    }
}
exports.RedditService = RedditService;
// SINGLETON INSTANCE & EXPORTS
const redditService = new RedditService();
exports.redditService = redditService;
exports.default = redditService;
// CommonJS compatibility
module.exports = redditService;
module.exports.redditService = redditService;
module.exports.RedditService = RedditService;
//# sourceMappingURL=redditService.js.map