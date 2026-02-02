const axios = require('axios');
const { Buffer } = require('buffer');
const config = require('../../config/services');
const { withRetry } = require('../../utils/common/apiUtils');
const logger = require('../../core/Logger');

class RedditService {
    constructor() {
        this.clientId = config.reddit.clientId;
        this.secret = config.reddit.secretKey;
        this.accessToken = null;
        this.tokenExpiry = 0;
        
        // Configurable timeouts from config
        this.timeout = config.reddit.timeout || 10000;
        this.authTimeout = config.reddit.authTimeout || 5000;
        this.searchTimeout = config.reddit.searchTimeout || 2000;
        this.maxRetries = config.reddit.maxRetries || 2;
    }

    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const auth = Buffer.from(`${this.clientId}:${this.secret}`).toString('base64');

        // Use retry logic for authentication
        return withRetry(async () => {
            const response = await axios.post(
                'https://www.reddit.com/api/v1/access_token',
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: this.authTimeout
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
            return this.accessToken;
        }, {
            name: 'Reddit Auth',
            maxRetries: this.maxRetries,
            retryDelay: 500
        }).catch(error => {
            logger.error('Reddit', `Authentication failed: ${error.response?.data || error.message}`);
            throw new Error('Failed to authenticate with Reddit');
        });
    }

    async searchSubreddits(query, limit = 10) {
        try {
            const res = await axios.get(
                `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=${limit}`,
                {
                    headers: { 'User-Agent': config.reddit.userAgent || 'DiscordBot/1.0' },
                    timeout: this.searchTimeout
                }
            );

            return res.data.data.children.map(c => ({
                name: c.data.display_name,
                title: c.data.title?.slice(0, 50) || '',
                displayName: c.data.display_name_prefixed
            }));
        } catch (error) {
            logger.debug('Reddit', `Subreddit search timeout/error: ${error.message}`);
            return [];
        }
    }

    async fetchSubredditPosts(subreddit, sortBy = 'top', limit = 5) {
        const token = await this.getAccessToken();

        // Use retry logic for fetching posts
        return withRetry(async () => {
            // First verify subreddit exists
            const aboutResponse = await axios.get(
                `https://oauth.reddit.com/r/${subreddit}/about`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': config.reddit.userAgent || 'DiscordBot/1.0'
                    },
                    timeout: this.timeout
                }
            );

            if (!aboutResponse.data || aboutResponse.data.kind !== 't5') {
                return { error: 'not_found' };
            }

            // Check rate limit
            const rateLimitRemaining = aboutResponse.headers['x-ratelimit-remaining'];
            if (rateLimitRemaining < 5) {
                return { error: 'rate_limited' };
            }

            // Fetch posts
            const params = { limit };
            if (sortBy === 'top') {
                params.t = 'day';
            }

            const response = await axios.get(
                `https://oauth.reddit.com/r/${subreddit}/${sortBy}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': config.reddit.userAgent || 'DiscordBot/1.0'
                    },
                    params,
                    timeout: this.timeout
                }
            );

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
        }).catch(error => {
            if (error.response?.status === 404) {
                return { error: 'not_found' };
            }
            logger.error('Reddit', `Error fetching from /r/${subreddit}: ${error.message}`);
            return { error: 'fetch_failed' };
        });
    }

    async searchSimilarSubreddits(subreddit) {
        const token = await this.getAccessToken();

        try {
            const response = await axios.get(
                'https://oauth.reddit.com/subreddits/search',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'DiscordBot/1.0'
                    },
                    params: {
                        q: subreddit,
                        limit: 5,
                        sort: 'relevance'
                    }
                }
            );

            return response.data?.data?.children?.map(child => child.data.display_name) || [];
        } catch (error) {
            console.error('Error fetching similar subreddits:', error.message);
            return [];
        }
    }

    /**
     * Fetch trending/popular posts from Reddit
     * @param {string} region - Region filter (global, us, uk, etc)
     * @param {number} limit - Number of posts to fetch
     */
    async fetchTrendingPosts(region = 'global', limit = 10) {
        const token = await this.getAccessToken();

        try {
            // Use /r/popular for trending content
            const endpoint = region === 'global' 
                ? 'https://oauth.reddit.com/r/popular/hot'
                : `https://oauth.reddit.com/r/popular/hot?geo_filter=${region.toUpperCase()}`;

            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'DiscordBot/1.0'
                },
                params: { limit }
            });

            if (!response.data?.data?.children) {
                return { error: 'no_posts' };
            }

            return {
                posts: response.data.data.children.map(child => this._parsePost(child.data))
            };
        } catch (error) {
            logger.error('Reddit', `Error fetching trending posts: ${error.message}`);
            return { error: 'fetch_failed' };
        }
    }

    /**
     * Fetch posts from r/all (everything trending)
     * @param {string} sortBy - Sort method
     * @param {number} limit - Number of posts
     */
    async fetchAllPosts(sortBy = 'hot', limit = 10) {
        const token = await this.getAccessToken();

        try {
            const response = await axios.get(
                `https://oauth.reddit.com/r/all/${sortBy}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'DiscordBot/1.0'
                    },
                    params: { limit }
                }
            );

            if (!response.data?.data?.children) {
                return { error: 'no_posts' };
            }

            return {
                posts: response.data.data.children.map(child => this._parsePost(child.data))
            };
        } catch (error) {
            logger.error('Reddit', `Error fetching r/all posts: ${error.message}`);
            return { error: 'fetch_failed' };
        }
    }

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
                .filter(Boolean);
        }

        let videoUrl = null;
        let isVideo = false;
        if (postData.is_video && postData.media?.reddit_video) {
            videoUrl = postData.media.reddit_video.fallback_url;
            isVideo = true;
        }

        let contentType = 'text';
        if (isVideo) contentType = 'video';
        else if (galleryImages.length > 0) contentType = 'gallery';
        else if (fullSizeImage) contentType = 'image';

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

module.exports = new RedditService();
