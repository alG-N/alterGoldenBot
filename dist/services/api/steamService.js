"use strict";
/**
 * Steam Service
 * Handles Steam API interactions for game sales and data
 * @module services/api/steamService
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
exports.steamService = exports.SteamService = void 0;
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
dotenv.config({ path: path.join(__dirname, '../.env') });
// STEAM SERVICE CLASS
/**
 * Steam Service
 * Provides methods to fetch Steam sales, game data, and SteamSpy statistics
 */
class SteamService {
    // Reserved for future authenticated Steam API calls
    apiKey;
    userAgent;
    constructor() {
        this.apiKey = process.env.STEAM_API_KEY || '';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    }
    /**
     * Fetch Steam sales with pagination
     * @param maxResults - Maximum number of results to fetch
     * @returns Array of games on sale
     */
    async fetchSteamSales(maxResults = 300) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('steam', async () => {
            const allGames = [];
            const resultsPerPage = 100;
            const pages = Math.ceil(maxResults / resultsPerPage);
            for (let page = 0; page < pages; page++) {
                try {
                    const games = await this._fetchSalesPage(page, resultsPerPage);
                    if (!games || games.length === 0)
                        break;
                    allGames.push(...games);
                    if (page < pages - 1) {
                        await this._delay(500);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`[Steam Search] Failed to fetch page ${page + 1}:`, errorMessage);
                    break;
                }
            }
            // Fetch USD prices for all games
            const gamesWithUsdPrices = await this._fetchUsdPrices(allGames);
            return this._deduplicateGames(gamesWithUsdPrices);
        });
    }
    /**
     * Fetch a single page of sales results
     * @param page - Page number (0-indexed)
     * @param resultsPerPage - Number of results per page
     * @returns Array of games from this page
     */
    async _fetchSalesPage(page, resultsPerPage) {
        const start = page * resultsPerPage;
        // Force US region with cc=us parameter
        const searchUrl = `https://store.steampowered.com/search/results/?query&start=${start}&count=${resultsPerPage}&dynamic_data=&sort_by=_ASC&specials=1&snr=1_7_7_151_7&filter=topsellers&infinite=1&cc=us`;
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(searchUrl, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': this.userAgent,
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const html = await response.text();
            let data;
            try {
                data = JSON.parse(html);
            }
            catch {
                throw new Error('Failed to parse response');
            }
            if (!data.results_html)
                return [];
            return this._parseGamesFromHtml(data.results_html, page);
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    /**
     * Parse games from HTML response
     * @param html - HTML string containing game data
     * @param page - Current page number for logging
     * @returns Array of parsed games
     */
    _parseGamesFromHtml(html, page) {
        const games = [];
        const gameMatches = [...html.matchAll(/data-ds-appid="(\d+)"/g)];
        const nameMatches = [...html.matchAll(/<span class="title">([^<]+)<\/span>/g)];
        const discountMatches = [...html.matchAll(/<div class="discount_pct">-(\d+)%<\/div>/g)];
        const originalPriceMatches = [...html.matchAll(/<div class="discount_original_price">([^<]+)<\/div>/g)];
        const finalPriceMatches = [...html.matchAll(/<div class="discount_final_price">([^<]+)<\/div>/g)];
        console.log(`[Steam Search] Page ${page + 1}: Found ${gameMatches.length} games`);
        for (let i = 0; i < gameMatches.length; i++) {
            const gameMatch = gameMatches[i];
            const discountMatch = discountMatches[i];
            const nameMatch = nameMatches[i];
            const originalPriceMatch = originalPriceMatches[i];
            const finalPriceMatch = finalPriceMatches[i];
            if (!gameMatch || !discountMatch)
                continue;
            const gameId = parseInt(gameMatch[1] ?? '0');
            const gameName = nameMatch?.[1] ?? `Game ${gameId}`;
            const discountPercent = parseInt(discountMatch[1] ?? '0');
            // Parse prices - these may be in local currency from HTML
            let originalPrice = 0;
            let finalPrice = 0;
            if (originalPriceMatch?.[1]) {
                originalPrice = this._parsePrice(originalPriceMatch[1]);
            }
            if (finalPriceMatch?.[1]) {
                finalPrice = this._parsePrice(finalPriceMatch[1]);
            }
            games.push({
                id: gameId,
                name: gameName,
                discount_percent: discountPercent,
                original_price: originalPrice,
                final_price: finalPrice,
                needsUsdPrice: true // Flag to fetch USD price
            });
        }
        return games;
    }
    /**
     * Parse price string to number
     * @param priceStr - Price string with currency symbols
     * @returns Parsed price as number
     */
    _parsePrice(priceStr) {
        if (!priceStr)
            return 0;
        // Remove currency symbols and parse number
        const cleaned = priceStr.trim().replace(/[^0-9.,]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }
    /**
     * Fetch USD prices for games in batches
     * @param games - Array of games to fetch prices for
     * @returns Games with updated USD prices
     */
    async _fetchUsdPrices(games) {
        if (games.length === 0)
            return games;
        // Batch fetch USD prices (max 50 at a time due to API limits)
        const batchSize = 50;
        const enrichedGames = [...games];
        for (let i = 0; i < games.length; i += batchSize) {
            const batch = games.slice(i, i + batchSize);
            const appIds = batch.map(g => g.id).join(',');
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appIds}&cc=us&filters=price_overview`, {
                    headers: {
                        'User-Agent': this.userAgent,
                        'Accept-Language': 'en-US,en;q=0.9'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    const data = await response.json();
                    for (const game of batch) {
                        const gameIndex = enrichedGames.findIndex(g => g.id === game.id);
                        if (gameIndex === -1)
                            continue;
                        const appData = data[game.id];
                        const enrichedGame = enrichedGames[gameIndex];
                        if (appData?.success && appData?.data?.price_overview && enrichedGame) {
                            const priceInfo = appData.data.price_overview;
                            enrichedGame.original_price = priceInfo.initial / 100;
                            enrichedGame.final_price = priceInfo.final / 100;
                            enrichedGame.discount_percent = priceInfo.discount_percent;
                            enrichedGame.currency = 'USD';
                        }
                    }
                }
                // Rate limit delay
                if (i + batchSize < games.length) {
                    await this._delay(300);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.log(`[Steam USD Price] Batch fetch error:`, errorMessage);
            }
        }
        return enrichedGames;
    }
    /**
     * Remove duplicate games and filter out non-discounted items
     * @param games - Array of games to deduplicate
     * @returns Deduplicated array of games
     */
    _deduplicateGames(games) {
        const uniqueGames = [];
        const seenIds = new Set();
        for (const game of games) {
            if (!seenIds.has(game.id) && game.discount_percent > 0) {
                seenIds.add(game.id);
                uniqueGames.push(game);
            }
        }
        return uniqueGames;
    }
    /**
     * Fetch featured sales from Steam API
     * @returns Array of featured sale games
     */
    async fetchFeaturedSales() {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('steam', async () => {
            try {
                // Force US region
                const response = await fetch('https://store.steampowered.com/api/featuredcategories?cc=us&l=english');
                const data = await response.json();
                if (data.specials?.items) {
                    return data.specials.items.map(game => ({
                        id: game.id,
                        name: game.name,
                        discount_percent: game.discount_percent,
                        original_price: game.original_price / 100,
                        final_price: game.final_price / 100,
                        currency: 'USD'
                    }));
                }
                return [];
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('[Featured API Error]', errorMessage);
                return [];
            }
        });
    }
    /**
     * Get SteamSpy data for a specific app
     * @param appId - Steam app ID
     * @returns SteamSpy data or null if unavailable
     */
    async getSteamSpyData(appId) {
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('steam', async () => {
            try {
                const response = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appId}`);
                if (!response.ok)
                    return null;
                return await response.json();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[SteamSpy Error for ${appId}]`, errorMessage);
                return null;
            }
        });
    }
    /**
     * Filter games by minimum discount percentage
     * @param games - Array of games to filter
     * @param minDiscount - Minimum discount percentage (0 = free games only)
     * @returns Filtered and sorted array of games
     */
    filterGamesByDiscount(games, minDiscount) {
        return games.filter(game => {
            if (minDiscount === 0) {
                return game.discount_percent === 100;
            }
            return game.discount_percent >= minDiscount;
        }).sort((a, b) => b.discount_percent - a.discount_percent);
    }
    /**
     * Format owners string from SteamSpy
     * @param ownersString - Raw owners string (e.g., "1,000,000 .. 2,000,000")
     * @returns Formatted string (e.g., "~1.5M")
     */
    formatOwners(ownersString) {
        if (!ownersString)
            return 'Unknown';
        const parts = ownersString.split('..');
        if (parts.length === 2 && parts[0] && parts[1]) {
            const min = parseInt(parts[0].replace(/,/g, '').trim());
            const max = parseInt(parts[1].replace(/,/g, '').trim());
            const avg = Math.floor((min + max) / 2);
            if (avg >= 1000000)
                return `~${(avg / 1000000).toFixed(1)}M`;
            if (avg >= 1000)
                return `~${(avg / 1000).toFixed(0)}K`;
            return `~${avg}`;
        }
        return ownersString;
    }
    /**
     * Delay utility function
     * @param ms - Milliseconds to delay
     * @returns Promise that resolves after the delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.SteamService = SteamService;
// EXPORTS
// Export singleton instance and class
const steamService = new SteamService();
exports.steamService = steamService;
exports.default = steamService;
// CommonJS compatibility
module.exports = steamService;
module.exports.SteamService = SteamService;
//# sourceMappingURL=steamService.js.map