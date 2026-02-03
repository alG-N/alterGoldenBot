"use strict";
/**
 * Auto-Play Service
 * Handles finding similar tracks for auto-play feature
 * Extracted from MusicService for single responsibility
 * @module services/music/autoplay/AutoPlayService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoPlayService = void 0;
const LavalinkService_js_1 = __importDefault(require("../LavalinkService.js"));
const index_js_1 = require("../queue/index.js");
// AUTO-PLAY SERVICE CLASS
class AutoPlayService {
    MIN_SEARCH_INTERVAL = 3000; // 3 seconds between searches
    /**
     * Find a similar track based on the last played track
     */
    async findSimilarTrack(guildId, lastTrack) {
        const queue = index_js_1.queueService.get(guildId);
        const now = Date.now();
        // Rate limiting
        if (queue?.lastAutoplaySearch && (now - queue.lastAutoplaySearch) < this.MIN_SEARCH_INTERVAL) {
            console.log('[AutoPlay] Rate limited, skipping search');
            return null;
        }
        if (queue)
            queue.lastAutoplaySearch = now;
        // Handle different track structures
        const trackInfo = lastTrack?.info || lastTrack;
        const title = trackInfo?.title;
        const author = trackInfo?.author;
        const uri = trackInfo?.uri || lastTrack?.url;
        if (!title) {
            console.log('[AutoPlay] No track title available');
            return null;
        }
        const recentTitles = queue?.lastPlayedTracks || [];
        console.log(`[AutoPlay] Finding similar to: "${title}" by "${author}"`);
        // Clean up title
        const cleanTitle = this._cleanTitle(title);
        const cleanAuthor = this._cleanAuthor(author || '');
        const genreKeywords = this._extractGenreKeywords(title);
        // Build and shuffle strategies
        const strategies = this._buildSearchStrategies(cleanTitle, cleanAuthor, genreKeywords, uri);
        const shuffledStrategies = strategies.sort(() => Math.random() - 0.5);
        // Try strategies
        for (const strategy of shuffledStrategies.slice(0, 5)) {
            try {
                console.log(`[AutoPlay] Trying strategy: ${strategy.name} - "${strategy.query}"`);
                const results = await this._searchWithLimit(strategy.query, 5);
                if (results && results.length > 0) {
                    const validTracks = this._filterRecentTracks(results, recentTitles, title);
                    if (validTracks.length > 0) {
                        const randomIndex = Math.floor(Math.random() * Math.min(validTracks.length, 3));
                        const selectedTrack = validTracks[randomIndex];
                        console.log(`[AutoPlay] Selected: ${selectedTrack.info?.title ?? 'Unknown'} (strategy: ${strategy.name})`);
                        return selectedTrack;
                    }
                }
            }
            catch {
                continue;
            }
        }
        // Fallback search
        return this._fallbackSearch(cleanAuthor, recentTitles, title);
    }
    /**
     * Clean title for search
     */
    _cleanTitle(title) {
        return title
            .replace(/\(official.*?\)/gi, '')
            .replace(/\[.*?\]/gi, '')
            .replace(/\|.*$/gi, '')
            .replace(/ft\.?.*$/gi, '')
            .replace(/feat\.?.*$/gi, '')
            .replace(/\(.*?remix.*?\)/gi, '')
            .replace(/\(.*?cover.*?\)/gi, '')
            .replace(/\(.*?version.*?\)/gi, '')
            .replace(/\(.*?edit.*?\)/gi, '')
            .replace(/-\s*(lyrics|audio|video|music)/gi, '')
            .trim();
    }
    /**
     * Clean author name
     */
    _cleanAuthor(author) {
        return author
            .replace(/\s*-\s*Topic$/gi, '')
            .replace(/VEVO$/gi, '')
            .replace(/Official$/gi, '')
            .trim();
    }
    /**
     * Extract genre keywords from title
     */
    _extractGenreKeywords(title) {
        const keywords = [];
        const lowerTitle = title.toLowerCase();
        const genrePatterns = [
            { pattern: /\b(lofi|lo-fi|lo fi)\b/i, genre: 'lofi' },
            { pattern: /\b(edm|electronic|electro)\b/i, genre: 'edm' },
            { pattern: /\b(rock|metal|punk)\b/i, genre: 'rock' },
            { pattern: /\b(jazz|blues)\b/i, genre: 'jazz' },
            { pattern: /\b(hip\s?hop|rap|trap)\b/i, genre: 'hip hop' },
            { pattern: /\b(pop|k-?pop|j-?pop)\b/i, genre: 'pop' },
            { pattern: /\b(anime|ost|soundtrack)\b/i, genre: 'anime' },
            { pattern: /\b(nightcore)\b/i, genre: 'nightcore' },
            { pattern: /\b(remix|bootleg)\b/i, genre: 'remix' },
            { pattern: /\b(acoustic|unplugged)\b/i, genre: 'acoustic' },
            { pattern: /\b(piano|instrumental)\b/i, genre: 'instrumental' },
            { pattern: /\b(chill|relaxing|calm)\b/i, genre: 'chill' },
            { pattern: /\b(classical|orchestra)\b/i, genre: 'classical' },
            { pattern: /\b(r&b|rnb|soul)\b/i, genre: 'r&b' },
            { pattern: /\b(country|folk)\b/i, genre: 'country' },
            { pattern: /\b(latin|reggaeton|salsa)\b/i, genre: 'latin' },
            { pattern: /\b(dubstep|bass|dnb|drum\s?and\s?bass)\b/i, genre: 'bass music' },
            { pattern: /\b(house|techno|trance)\b/i, genre: 'house' },
            { pattern: /\b(vocaloid|hatsune|miku)\b/i, genre: 'vocaloid' },
            { pattern: /\b(game|gaming|video\s?game)\b/i, genre: 'gaming' },
        ];
        for (const { pattern, genre } of genrePatterns) {
            if (pattern.test(lowerTitle)) {
                keywords.push(genre);
            }
        }
        return keywords;
    }
    /**
     * Build diverse search strategies
     */
    _buildSearchStrategies(cleanTitle, cleanAuthor, genres, uri) {
        const strategies = [];
        // Artist-based strategies
        if (cleanAuthor && cleanAuthor.length > 2) {
            strategies.push({ name: 'artist_mix', query: `${cleanAuthor} mix` }, { name: 'artist_popular', query: `${cleanAuthor} popular songs` }, { name: 'artist_best', query: `${cleanAuthor} best hits` }, { name: 'artist_radio', query: `${cleanAuthor} radio` }, { name: 'artist_similar', query: `artists like ${cleanAuthor}` });
        }
        // Title-based strategies
        if (cleanTitle && cleanTitle.length > 3) {
            const titleWords = cleanTitle.split(' ').filter(w => w.length > 2);
            strategies.push({ name: 'title_similar', query: `songs like ${cleanTitle}` }, { name: 'title_partial', query: titleWords.slice(0, 3).join(' ') });
            if (titleWords.length >= 2) {
                strategies.push({ name: 'title_keywords', query: `${titleWords[0]} ${titleWords[titleWords.length - 1]} music` });
            }
        }
        // Genre-based strategies
        for (const genre of genres) {
            strategies.push({ name: `genre_${genre}`, query: `${genre} music` }, { name: `genre_${genre}_mix`, query: `${genre} mix 2024` }, { name: `genre_${genre}_popular`, query: `popular ${genre}` });
        }
        // YouTube-specific strategies
        if (uri && uri.includes('youtube')) {
            strategies.push({ name: 'yt_recommended', query: `${cleanAuthor} ${cleanTitle.split(' ')[0]}` });
        }
        // Mood/vibe based
        const moods = ['chill', 'upbeat', 'energetic', 'relaxing', 'happy', 'sad', 'party'];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        strategies.push({ name: 'mood_based', query: `${randomMood} music playlist` });
        // Time-based variety
        const years = ['2024', '2023', '2022', '2021', '2020'];
        const randomYear = years[Math.floor(Math.random() * years.length)];
        strategies.push({ name: 'year_hits', query: `top hits ${randomYear}` });
        return strategies;
    }
    /**
     * Search with limit
     */
    async _searchWithLimit(query, limit = 5) {
        try {
            const results = await LavalinkService_js_1.default.searchMultiple?.(query, limit);
            if (results && results.length > 0) {
                return results;
            }
            const result = await LavalinkService_js_1.default.search(query, undefined);
            if (result?.track) {
                return [result];
            }
            return [];
        }
        catch (error) {
            const err = error;
            console.error('[AutoPlay] Search error:', err.message);
            return [];
        }
    }
    /**
     * Filter out recently played tracks
     */
    _filterRecentTracks(results, recentTitles, currentTitle) {
        return results.filter(result => {
            const trackTitle = result.info?.title || '';
            const isDuplicate = recentTitles.some(t => t.toLowerCase().includes(trackTitle.toLowerCase().substring(0, 20)) ||
                trackTitle.toLowerCase().includes(t.toLowerCase().substring(0, 20)));
            return !isDuplicate && trackTitle.toLowerCase() !== currentTitle.toLowerCase();
        });
    }
    /**
     * Fallback search when strategies fail
     */
    async _fallbackSearch(cleanAuthor, recentTitles, currentTitle) {
        try {
            const fallbackQueries = [
                'top hits 2024',
                'popular music',
                'trending songs',
                `best ${cleanAuthor?.split(' ')[0] || 'music'} songs`
            ];
            const randomFallback = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)] ?? 'popular music';
            console.log(`[AutoPlay] Fallback search: "${randomFallback}"`);
            const results = await LavalinkService_js_1.default.searchMultiple(randomFallback, 5);
            if (results && results.length > 0) {
                const validTracks = this._filterRecentTracks(results, recentTitles, currentTitle);
                if (validTracks.length > 0) {
                    const randomIndex = Math.floor(Math.random() * Math.min(validTracks.length, 3));
                    const selectedTrack = validTracks[randomIndex];
                    console.log(`[AutoPlay] Fallback selected: ${selectedTrack.info?.title ?? 'Unknown'}`);
                    return selectedTrack;
                }
                const selectedTrack = results[0];
                console.log(`[AutoPlay] Fallback (no filter): ${selectedTrack.info?.title ?? 'Unknown'}`);
                return selectedTrack;
            }
        }
        catch (e) {
            const error = e;
            console.error('[AutoPlay] Fallback search error:', error.message);
        }
        return null;
    }
}
exports.AutoPlayService = AutoPlayService;
// Export singleton instance and class
const autoPlayService = new AutoPlayService();
exports.default = autoPlayService;
//# sourceMappingURL=AutoPlayService.js.map