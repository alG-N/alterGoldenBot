"use strict";
/**
 * Pixiv Service
 * Handles Pixiv API interactions with circuit breaker protection
 * @module services/api/pixivService
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixivService = exports.pixivService = void 0;
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const Logger_1 = __importDefault(require("../../core/Logger"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
const CacheService_1 = __importDefault(require("../../cache/CacheService"));
dotenv.config({ path: path.join(__dirname, '../.env') });
// CONSTANTS
const SERIES_MAP = {
    'アズールレーン': 'Azur Lane',
    'アズレン': 'Azur Lane',
    'ブルーアーカイブ': 'Blue Archive',
    'ブルアカ': 'Blue Archive',
    '原神': 'Genshin Impact',
    '崩壊スターレイル': 'Honkai: Star Rail',
    'スターレイル': 'Star Rail',
    '艦隊これくしょん': 'Kantai Collection',
    '艦これ': 'KanColle',
    'ウマ娘': 'Uma Musume',
    'Fate': 'Fate',
    'FGO': 'FGO',
    '東方': 'Touhou',
    '初音ミク': 'Hatsune Miku',
    'ボーカロイド': 'Vocaloid',
    'VOCALOID': 'Vocaloid',
    'ホロライブ': 'Hololive',
    'にじさんじ': 'Nijisanji',
    'バーチャルYouTuber': 'VTuber',
    'VTuber': 'VTuber',
    'アイドルマスター': 'Idolmaster',
    'ラブライブ': 'Love Live',
    'プリコネ': 'Princess Connect',
    'アークナイツ': 'Arknights',
    '明日方舟': 'Arknights',
    '碧蓝航线': 'Azur Lane',
    '蔚蓝档案': 'Blue Archive',
    '少女前线': 'Girls Frontline',
    'ドールズフロントライン': 'Girls Frontline',
    '勝利の女神': 'Nikke',
    'NIKKE': 'Nikke',
    'ガンダム': 'Gundam',
    'ポケモン': 'Pokemon',
    'ワンピース': 'One Piece',
    'ナルト': 'Naruto',
    '鬼滅の刃': 'Demon Slayer',
    '進撃の巨人': 'Attack on Titan',
    '呪術廻戦': 'Jujutsu Kaisen',
    'SPY×FAMILY': 'Spy x Family',
    'チェンソーマン': 'Chainsaw Man',
    '僕のヒーローアカデミア': 'My Hero Academia',
    'アニメ': 'Anime',
};
class PixivService {
    auth;
    clientId;
    clientSecret;
    baseHeaders;
    proxies;
    constructor() {
        this.auth = {
            accessToken: null,
            refreshToken: process.env.PIXIV_REFRESH_TOKEN,
            expiresAt: 0
        };
        this.clientId = process.env.PIXIV_CLIENT_ID || 'MOBrBDS8blbauoSck0ZfDbtuzpyT';
        this.clientSecret = process.env.PIXIV_CLIENT_SECRET || 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj';
        this.baseHeaders = {
            'User-Agent': 'PixivAndroidApp/5.0.234 (Android 11; Pixel 5)',
            'App-OS': 'android',
            'App-OS-Version': '11',
            'App-Version': '5.0.234'
        };
        this.proxies = ['i.pixiv.cat', 'i.pixiv.nl', 'i.pximg.net'];
    }
    /**
     * Authenticate with Pixiv API
     */
    async authenticate() {
        if (this.auth.accessToken && Date.now() < this.auth.expiresAt) {
            return this.auth.accessToken;
        }
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('pixiv', async () => {
            try {
                const response = await fetch('https://oauth.secure.pixiv.net/auth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': this.baseHeaders['User-Agent']
                    },
                    body: new URLSearchParams({
                        client_id: this.clientId,
                        client_secret: this.clientSecret,
                        grant_type: 'refresh_token',
                        refresh_token: this.auth.refreshToken || '',
                        include_policy: 'true'
                    })
                });
                const data = await response.json();
                if (!data.access_token) {
                    throw new Error('Failed to authenticate with Pixiv');
                }
                this.auth.accessToken = data.access_token;
                this.auth.refreshToken = data.refresh_token;
                this.auth.expiresAt = Date.now() + (data.expires_in * 1000) - 60000;
                return data.access_token;
            }
            catch (error) {
                Logger_1.default.error('Pixiv', `Auth error: ${error.message}`);
                throw error;
            }
        });
    }
    /**
     * Search for illustrations/novels with circuit breaker
     */
    async search(query, options = {}) {
        const { offset = 0, contentType = 'illust', showNsfw = false, r18Only = false, aiFilter = false, qualityFilter = false, minBookmarks = 0, sort = 'popular_desc', fetchMultiple = true } = options;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('pixiv', async () => {
            const token = await this.authenticate();
            const isNovel = contentType === 'novel';
            const pagesToFetch = (showNsfw && fetchMultiple) ? 3 : 1;
            let allItems = [];
            let lastNextUrl = null;
            console.log(`[Pixiv Search] Query: "${query}" | Offset: ${offset} | NSFW: ${showNsfw} | R18Only: ${r18Only}`);
            if (r18Only) {
                const results = await this._searchUnfiltered(query, { offset, contentType, sort, pagesToFetch, token, isNovel });
                allItems = results.items.filter(item => item.x_restrict > 0);
                lastNextUrl = results.nextUrl;
                console.log(`[Pixiv R18 Only] Extracted ${allItems.length} R18 items from ${results.items.length} total`);
            }
            else if (showNsfw) {
                const results = await this._searchUnfiltered(query, { offset, contentType, sort, pagesToFetch, token, isNovel });
                allItems = results.items;
                lastNextUrl = results.nextUrl;
            }
            else {
                const sfwResults = await this._searchSFW(query, { offset, contentType, sort, pagesToFetch, token, isNovel });
                allItems = sfwResults.items;
                lastNextUrl = sfwResults.nextUrl;
            }
            if (allItems.length > 0) {
                const r18Count = allItems.filter(i => i.x_restrict > 0).length;
                const sfwCount = allItems.filter(i => i.x_restrict === 0).length;
                const aiCount = allItems.filter(i => i.illust_ai_type === 2).length;
                console.log(`[Pixiv Search] Total: ${allItems.length} items | ${r18Count} R18 | ${sfwCount} SFW | ${aiCount} AI`);
            }
            return this._filterResults({ illusts: allItems, next_url: lastNextUrl }, contentType, showNsfw, aiFilter, qualityFilter, minBookmarks, r18Only);
        });
    }
    /**
     * Search without SFW filter (internal)
     */
    async _searchUnfiltered(query, params) {
        const { offset, sort, pagesToFetch, token, isNovel } = params;
        const allItems = [];
        let lastNextUrl = null;
        for (let page = 0; page < pagesToFetch; page++) {
            const currentOffset = offset + (page * 30);
            const url = new URL(isNovel
                ? 'https://app-api.pixiv.net/v1/search/novel'
                : 'https://app-api.pixiv.net/v1/search/illust');
            url.searchParams.append('word', query);
            url.searchParams.append('search_target', 'partial_match_for_tags');
            url.searchParams.append('sort', sort);
            url.searchParams.append('offset', currentOffset.toString());
            if (page === 0) {
                console.log(`[Pixiv Unfiltered] Query: "${query}" | BaseOffset: ${offset} | Sort: ${sort} | Pages: ${pagesToFetch}`);
            }
            try {
                const response = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${token}`, ...this.baseHeaders }
                });
                if (!response.ok) {
                    if (page === 0)
                        throw new Error(`Pixiv API error: ${response.status}`);
                    break;
                }
                const data = await response.json();
                const items = isNovel ? data.novels : data.illusts;
                if (!items || items.length === 0) {
                    console.log(`[Pixiv Unfiltered] Page ${page} returned no items, stopping`);
                    break;
                }
                console.log(`[Pixiv Unfiltered] Page ${page} (offset ${currentOffset}): Got ${items.length} items`);
                allItems.push(...items);
                lastNextUrl = data.next_url || null;
                if (page < pagesToFetch - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            catch (error) {
                if (page === 0)
                    throw error;
                break;
            }
        }
        const r18Count = allItems.filter(i => i.x_restrict > 0).length;
        const sfwCount = allItems.filter(i => i.x_restrict === 0).length;
        console.log(`[Pixiv Unfiltered] Total: ${allItems.length} items (${r18Count} R18, ${sfwCount} SFW)`);
        return { items: allItems, nextUrl: lastNextUrl };
    }
    /**
     * Search with SFW filter (internal)
     */
    async _searchSFW(query, params) {
        const { offset, sort, pagesToFetch, token, isNovel } = params;
        const allItems = [];
        let lastNextUrl = null;
        for (let page = 0; page < pagesToFetch; page++) {
            const currentOffset = offset + (page * 30);
            const url = new URL(isNovel
                ? 'https://app-api.pixiv.net/v1/search/novel'
                : 'https://app-api.pixiv.net/v1/search/illust');
            url.searchParams.append('word', query);
            url.searchParams.append('search_target', 'partial_match_for_tags');
            url.searchParams.append('sort', sort);
            url.searchParams.append('offset', currentOffset.toString());
            url.searchParams.append('filter', 'for_android');
            if (page === 0) {
                console.log(`[Pixiv SFW] Query: "${query}" | BaseOffset: ${offset} | Sort: ${sort} | Pages: ${pagesToFetch}`);
            }
            try {
                const response = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${token}`, ...this.baseHeaders }
                });
                if (!response.ok) {
                    if (page === 0)
                        throw new Error(`Pixiv API error: ${response.status}`);
                    break;
                }
                const data = await response.json();
                const items = isNovel ? data.novels : data.illusts;
                if (!items || items.length === 0)
                    break;
                console.log(`[Pixiv SFW] Page ${page} (offset ${currentOffset}): Got ${items.length} items`);
                allItems.push(...items);
                lastNextUrl = data.next_url || null;
                if (page < pagesToFetch - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            catch (error) {
                if (page === 0)
                    throw error;
                break;
            }
        }
        console.log(`[Pixiv SFW] Total: ${allItems.length} items`);
        return { items: allItems, nextUrl: lastNextUrl };
    }
    /**
     * Get ranking illustrations with circuit breaker
     */
    async getRanking(options = {}) {
        const { mode = 'day', contentType = 'illust', showNsfw = false, r18Only = false, aiFilter = false, offset = 0, qualityFilter = false, minBookmarks = 0 } = options;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('pixiv', async () => {
            const token = await this.authenticate();
            let rankingMode = mode;
            if (showNsfw) {
                if (mode === 'day')
                    rankingMode = 'day_r18';
                else if (mode === 'week')
                    rankingMode = 'week_r18';
                else if (mode === 'month')
                    rankingMode = 'month_r18';
            }
            const url = new URL('https://app-api.pixiv.net/v1/illust/ranking');
            url.searchParams.append('mode', rankingMode);
            url.searchParams.append('offset', offset.toString());
            if (!showNsfw) {
                url.searchParams.append('filter', 'for_android');
            }
            console.log(`[Pixiv Ranking] Mode: ${rankingMode}, NSFW: ${showNsfw}`);
            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...this.baseHeaders
                }
            });
            if (!response.ok) {
                throw new Error(`Pixiv API error: ${response.status}`);
            }
            const data = await response.json();
            return this._filterResults({ illusts: data.illusts, next_url: data.next_url }, contentType, showNsfw, aiFilter, qualityFilter, minBookmarks, r18Only);
        });
    }
    /**
     * Filter results based on options
     */
    _filterResults(data, contentType, showNsfw, aiFilter, qualityFilter = false, minBookmarks = 0, r18Only = false) {
        const isNovel = contentType === 'novel';
        let items = (isNovel ? data.novels : data.illusts);
        if (!items)
            return { items: [], nextUrl: data.next_url };
        const originalCount = items.length;
        const originalR18 = items.filter(i => i.x_restrict > 0).length;
        const originalSFW = items.filter(i => i.x_restrict === 0).length;
        // NSFW Filter Logic
        if (r18Only) {
            items = items.filter(item => item.x_restrict > 0);
        }
        else if (!showNsfw) {
            items = items.filter(item => item.x_restrict === 0);
        }
        // AI Filter
        if (aiFilter) {
            const beforeAI = items.length;
            items = items.filter(item => item.illust_ai_type !== 2);
            const removed = beforeAI - items.length;
            if (removed > 0) {
                console.log(`[Pixiv Filter] AI filter removed ${removed} items`);
            }
        }
        // Quality Filter
        if (qualityFilter) {
            const beforeQuality = items.length;
            items = items.filter(item => (item.total_view || 0) >= 1000);
            const removed = beforeQuality - items.length;
            if (removed > 0) {
                console.log(`[Pixiv Filter] Quality filter removed ${removed} items`);
            }
        }
        // Minimum bookmarks filter
        if (minBookmarks > 0) {
            const beforeBookmarks = items.length;
            items = items.filter(item => (item.total_bookmarks || 0) >= minBookmarks);
            const removed = beforeBookmarks - items.length;
            if (removed > 0) {
                console.log(`[Pixiv Filter] Bookmark filter removed ${removed} items`);
            }
        }
        // Content type filter (manga vs illust)
        if (!isNovel && contentType !== 'all') {
            if (contentType === 'manga') {
                items = items.filter(item => item.type === 'manga');
            }
            else if (contentType === 'illust') {
                items = items.filter(item => item.type === 'illust' || item.type === 'ugoira');
            }
        }
        // Sort by bookmarks for better results
        items.sort((a, b) => (b.total_bookmarks || 0) - (a.total_bookmarks || 0));
        // Final stats
        const finalR18 = items.filter(i => i.x_restrict > 0).length;
        const finalSFW = items.filter(i => i.x_restrict === 0).length;
        console.log(`[Pixiv Filter] Final: ${items.length}/${originalCount} | R18: ${finalR18}/${originalR18} | SFW: ${finalSFW}/${originalSFW}`);
        return { items, nextUrl: data.next_url };
    }
    /**
     * Get autocomplete suggestions with circuit breaker
     */
    async getAutocompleteSuggestions(query) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('pixiv', async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);
            const url = `https://www.pixiv.net/rpc/cps.php?keyword=${encodeURIComponent(query)}&lang=en`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Referer': 'https://www.pixiv.net/',
                    'Accept': 'application/json, text/javascript, */*; q=0.01'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok)
                return [];
            const data = await res.json();
            const candidates = data?.candidates || [];
            const suggestions = candidates.map(tag => {
                const tagName = tag.tag_name || '';
                const romaji = tag.tag_translation || '';
                const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(tagName);
                const hasJapaneseInRomaji = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(romaji);
                if (hasJapanese) {
                    // Try to extract English name from both tagName and romaji
                    const englishName = this._extractEnglishName(tagName, hasJapaneseInRomaji ? '' : romaji);
                    if (englishName && englishName !== tagName) {
                        return {
                            name: `${englishName} • ${tagName}`,
                            value: tagName
                        };
                    }
                    // If romaji is also Japanese, don't show it - just show the tag
                    return { name: tagName, value: tagName };
                }
                else if (hasJapaneseInRomaji) {
                    // When tag_translation contains Japanese (common for character names),
                    // try to extract English name from the romaji field itself
                    const englishFromRomaji = this._extractEnglishName(romaji, '');
                    if (englishFromRomaji && englishFromRomaji !== romaji) {
                        return {
                            name: `${tagName} (${englishFromRomaji})`,
                            value: tagName
                        };
                    }
                    // Fallback: just show tagName without the Japanese romaji
                    return { name: tagName, value: tagName };
                }
                else if (romaji && romaji !== tagName) {
                    const cleanRomaji = this._cleanRomaji(romaji);
                    if (cleanRomaji !== tagName) {
                        return {
                            name: `${tagName} • ${cleanRomaji}`,
                            value: tagName
                        };
                    }
                }
                return { name: tagName, value: tagName };
            }).filter(s => s.name);
            return suggestions;
        });
    }
    /**
     * Extract English name from Japanese tag (async version with Google Translate fallback)
     */
    async extractEnglishNameAsync(japaneseTag, romaji) {
        // Try sync method first (constants)
        const syncResult = this._extractEnglishName(japaneseTag, romaji);
        if (syncResult)
            return syncResult;
        // Fallback to Google Translate for unknown tags
        if (this.isJapaneseText(japaneseTag)) {
            const translated = await this.translateToEnglish(japaneseTag);
            if (translated && translated !== japaneseTag) {
                return translated;
            }
        }
        return romaji ? this._cleanRomaji(romaji) : null;
    }
    /**
     * Extract English name from Japanese tag (sync version - series map only)
     */
    _extractEnglishName(japaneseTag, romaji) {
        // Check if it's a known series
        if (SERIES_MAP[japaneseTag]) {
            return SERIES_MAP[japaneseTag];
        }
        // Try to extract character(series) pattern
        const match = japaneseTag.match(/^(.+?)[（(](.+?)[）)]$/);
        if (match && match[1] && match[2]) {
            const charJp = match[1].trim();
            const seriesJp = match[2].trim();
            const seriesEn = SERIES_MAP[seriesJp] || seriesJp;
            // Use romaji for character name if available
            if (romaji) {
                const charEn = this._cleanRomaji(romaji.split(/[（(]/)[0] || romaji);
                return `${charEn} (${seriesEn})`;
            }
        }
        // Fallback to cleaned romaji
        if (romaji) {
            return this._cleanRomaji(romaji);
        }
        return null;
    }
    /**
     * Check if text contains Japanese characters
     */
    isJapaneseText(text) {
        return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    }
    /**
     * Clean romaji for display
     */
    _cleanRomaji(romaji) {
        if (!romaji)
            return '';
        // Capitalize first letter and clean up
        return romaji
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    /**
     * Translate text to Japanese
     */
    async translateToJapanese(text) {
        const cacheKey = `translate:en_ja_${text}`;
        const cached = await CacheService_1.default.get('api', cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(text)}`, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await response.json();
            const result = data?.[0]?.[0]?.[0];
            if (result) {
                await CacheService_1.default.set('api', cacheKey, result, 3600); // 1 hour TTL
                return result;
            }
            return text;
        }
        catch {
            return text;
        }
    }
    /**
     * Translate text to English
     */
    async translateToEnglish(text) {
        const cacheKey = `translate:ja_en_${text}`;
        const cached = await CacheService_1.default.get('api', cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await response.json();
            const result = data?.[0]?.[0]?.[0];
            if (result) {
                await CacheService_1.default.set('api', cacheKey, result, 3600); // 1 hour TTL
                return result;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Check if text is English
     */
    isEnglishText(text) {
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
        if (japaneseRegex.test(text)) {
            return false;
        }
        const asciiLetters = text.match(/[a-zA-Z]/g);
        return !!asciiLetters && asciiLetters.length / text.length > 0.3;
    }
    /**
     * Get proxied image URL
     */
    async getProxyImageUrl(item, mangaPageIndex = 0) {
        let imageUrl;
        if (item.page_count > 1 && item.meta_pages?.length > mangaPageIndex) {
            const metaPage = item.meta_pages[mangaPageIndex];
            if (metaPage) {
                const page = metaPage.image_urls;
                imageUrl = page.large || page.medium || page.square_medium || page.original;
            }
        }
        else {
            imageUrl = item.image_urls.large || item.image_urls.medium || item.image_urls.square_medium;
        }
        if (!imageUrl) {
            return '';
        }
        for (const proxy of this.proxies) {
            try {
                const proxyUrl = imageUrl.replace('i.pximg.net', proxy);
                const response = await fetch(proxyUrl, { method: 'HEAD' });
                if (response.ok) {
                    return proxyUrl;
                }
            }
            catch {
                continue;
            }
        }
        return imageUrl.replace('i.pximg.net', 'i.pixiv.cat');
    }
    /**
     * Get artwork by ID with circuit breaker
     */
    async getArtworkById(artworkId) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('pixiv', async () => {
            const token = await this.authenticate();
            const url = new URL('https://app-api.pixiv.net/v1/illust/detail');
            url.searchParams.append('illust_id', String(artworkId));
            Logger_1.default.debug('Pixiv', `Fetching artwork ID: ${artworkId}`);
            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...this.baseHeaders
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                Logger_1.default.error('Pixiv', `API Error ${response.status}: ${errorText}`);
                throw new Error(`Artwork not found or API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.illust) {
                throw new Error('Artwork not found');
            }
            const illust = data.illust;
            Logger_1.default.debug('Pixiv', `Found artwork: "${illust.title}" | R18: ${illust.x_restrict > 0} | AI: ${illust.illust_ai_type === 2}`);
            return illust;
        });
    }
}
exports.PixivService = PixivService;
// Export singleton instance
const pixivService = new PixivService();
exports.pixivService = pixivService;
exports.default = pixivService;
// CommonJS compatibility
module.exports = pixivService;
module.exports.pixivService = pixivService;
module.exports.PixivService = PixivService;
//# sourceMappingURL=pixivService.js.map