"use strict";
/**
 * External Services Configuration
 * API keys and external service settings
 * @module config/services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invidious = exports.ytdlp = exports.cobalt = exports.fandom = exports.wikipedia = exports.myanimelist = exports.anilist = exports.google = exports.nhentai = exports.rule34 = exports.pixiv = exports.reddit = exports.steam = void 0;
exports.steam = {
    apiKey: process.env.STEAM_API_KEY || '',
    baseUrl: 'https://api.steampowered.com',
    storeUrl: 'https://store.steampowered.com/api',
    rateLimit: 100 // requests per minute
};
exports.reddit = {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    secretKey: process.env.REDDIT_SECRET_KEY || '',
    userAgent: 'alterGolden/2.0 (Discord Bot)',
    baseUrl: 'https://oauth.reddit.com',
    authUrl: 'https://www.reddit.com/api/v1/access_token',
    rateLimit: 60, // requests per minute
    timeout: parseInt(process.env.REDDIT_TIMEOUT || '10000', 10),
    authTimeout: parseInt(process.env.REDDIT_AUTH_TIMEOUT || '5000', 10),
    searchTimeout: parseInt(process.env.REDDIT_SEARCH_TIMEOUT || '2000', 10),
    maxRetries: parseInt(process.env.REDDIT_MAX_RETRIES || '2', 10)
};
exports.pixiv = {
    refreshToken: process.env.PIXIV_REFRESH_TOKEN || '',
    clientId: process.env.PIXIV_CLIENT_ID || '',
    clientSecret: process.env.PIXIV_CLIENT_SECRET || '',
    baseUrl: 'https://app-api.pixiv.net',
    authUrl: 'https://oauth.secure.pixiv.net/auth/token',
    imageProxy: 'https://i.pximg.net',
    rateLimit: 30 // requests per minute
};
exports.rule34 = {
    userId: process.env.RULE34_USER_ID || '',
    apiKey: process.env.RULE34_API_KEY || '',
    baseUrl: 'https://api.rule34.xxx',
    rateLimit: process.env.RULE34_API_KEY ? 100 : 30 // Higher with API key
};
exports.nhentai = {
    baseUrl: 'https://nhentai.net/api',
    imageUrl: 'https://i.nhentai.net',
    thumbUrl: 'https://t.nhentai.net',
    rateLimit: 20 // requests per minute
};
exports.google = {
    apiKey: process.env.GOOGLE_API_KEY || '',
    searchCx: process.env.GOOGLE_SEARCH_CX || '',
    searchUrl: 'https://www.googleapis.com/customsearch/v1',
    enabled: !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_CX)
};
exports.anilist = {
    baseUrl: 'https://graphql.anilist.co',
    rateLimit: 90 // requests per minute
};
exports.myanimelist = {
    baseUrl: 'https://api.jikan.moe/v4',
    rateLimit: 60 // requests per minute (Jikan limit)
};
exports.wikipedia = {
    baseUrl: 'https://en.wikipedia.org/api/rest_v1',
    rateLimit: 100
};
exports.fandom = {
    baseUrl: 'https://community.fandom.com',
    rateLimit: 60
};
exports.cobalt = {
    instances: [
        process.env.COBALT_URL || 'http://localhost:9000'
    ],
    timeout: 120000,
    maxRetries: 3
};
exports.ytdlp = {
    url: process.env.YTDLP_URL || 'http://localhost:8080',
    timeout: 120000
};
exports.invidious = {
    url: process.env.INVIDIOUS_URL || 'http://localhost:3001',
    timeout: 30000
};
exports.default = {
    steam: exports.steam,
    reddit: exports.reddit,
    pixiv: exports.pixiv,
    rule34: exports.rule34,
    nhentai: exports.nhentai,
    google: exports.google,
    anilist: exports.anilist,
    myanimelist: exports.myanimelist,
    wikipedia: exports.wikipedia,
    fandom: exports.fandom,
    cobalt: exports.cobalt,
    ytdlp: exports.ytdlp,
    invidious: exports.invidious
};
//# sourceMappingURL=services.js.map