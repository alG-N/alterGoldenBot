"use strict";
/**
 * API Handlers Index
 * Re-exports all API handlers
 * @module handlers/api
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
exports.nhentaiHandlerInstance = exports.rule34PostHandler = exports.steamSaleHandler = exports.redditPostHandler = exports.pixivContentHandler = exports.animeHandler = exports.handleSaleCommand = exports.SORT_DISPLAY = exports.CONTENT_EMOJIS = exports.RATING_EMOJIS = exports.RATING_COLORS = exports.createRule34HistoryEmbed = exports.createRelatedTagsEmbed = exports.createSettingsComponents = exports.createRule34SettingsEmbed = exports.createRule34FavoritesEmbed = exports.createBlacklistEmbed = exports.createRule34ErrorEmbed = exports.createRule34NoResultsEmbed = exports.createRule34SearchSummaryEmbed = exports.createRule34PostButtons = exports.createRule34VideoEmbed = exports.createRule34PostEmbed = exports.POSTS_PER_PAGE = exports.createNotFoundEmbed = exports.createPostEmbed = exports.createPostListEmbed = exports.showPostDetails = exports.sendPostListEmbed = exports.createPixivErrorEmbed = exports.createPixivNoResultsEmbed = exports.createContentEmbed = exports.NHentaiHandler = exports.nhentaiHandler = exports.createMALMangaEmbed = exports.createMALAnimeEmbed = exports.createAniListEmbed = exports.createAnimeEmbed = exports.createMediaEmbed = exports.WikipediaHandler = exports.wikipediaHandler = exports.GoogleHandler = exports.googleHandler = void 0;
// TypeScript handlers
var googleHandler_js_1 = require("./googleHandler.js");
Object.defineProperty(exports, "googleHandler", { enumerable: true, get: function () { return googleHandler_js_1.googleHandler; } });
Object.defineProperty(exports, "GoogleHandler", { enumerable: true, get: function () { return googleHandler_js_1.GoogleHandler; } });
var wikipediaHandler_js_1 = require("./wikipediaHandler.js");
Object.defineProperty(exports, "wikipediaHandler", { enumerable: true, get: function () { return wikipediaHandler_js_1.wikipediaHandler; } });
Object.defineProperty(exports, "WikipediaHandler", { enumerable: true, get: function () { return wikipediaHandler_js_1.WikipediaHandler; } });
// Anime handler
const animeHandlerModule = __importStar(require("./animeHandler.js"));
var animeHandler_js_1 = require("./animeHandler.js");
Object.defineProperty(exports, "createMediaEmbed", { enumerable: true, get: function () { return animeHandler_js_1.createMediaEmbed; } });
Object.defineProperty(exports, "createAnimeEmbed", { enumerable: true, get: function () { return animeHandler_js_1.createAnimeEmbed; } });
Object.defineProperty(exports, "createAniListEmbed", { enumerable: true, get: function () { return animeHandler_js_1.createAniListEmbed; } });
Object.defineProperty(exports, "createMALAnimeEmbed", { enumerable: true, get: function () { return animeHandler_js_1.createMALAnimeEmbed; } });
Object.defineProperty(exports, "createMALMangaEmbed", { enumerable: true, get: function () { return animeHandler_js_1.createMALMangaEmbed; } });
// NHentai handler
const nhentaiHandler_js_1 = __importDefault(require("./nhentaiHandler.js"));
exports.nhentaiHandlerInstance = nhentaiHandler_js_1.default;
var nhentaiHandler_js_2 = require("./nhentaiHandler.js");
Object.defineProperty(exports, "nhentaiHandler", { enumerable: true, get: function () { return __importDefault(nhentaiHandler_js_2).default; } });
Object.defineProperty(exports, "NHentaiHandler", { enumerable: true, get: function () { return nhentaiHandler_js_2.NHentaiHandler; } });
// Pixiv handler
const pixivContentHandlerModule = __importStar(require("./pixivContentHandler.js"));
var pixivContentHandler_js_1 = require("./pixivContentHandler.js");
Object.defineProperty(exports, "createContentEmbed", { enumerable: true, get: function () { return pixivContentHandler_js_1.createContentEmbed; } });
Object.defineProperty(exports, "createPixivNoResultsEmbed", { enumerable: true, get: function () { return pixivContentHandler_js_1.createNoResultsEmbed; } });
Object.defineProperty(exports, "createPixivErrorEmbed", { enumerable: true, get: function () { return pixivContentHandler_js_1.createErrorEmbed; } });
// Reddit handler
const redditPostHandlerModule = __importStar(require("./redditPostHandler.js"));
var redditPostHandler_js_1 = require("./redditPostHandler.js");
Object.defineProperty(exports, "sendPostListEmbed", { enumerable: true, get: function () { return redditPostHandler_js_1.sendPostListEmbed; } });
Object.defineProperty(exports, "showPostDetails", { enumerable: true, get: function () { return redditPostHandler_js_1.showPostDetails; } });
Object.defineProperty(exports, "createPostListEmbed", { enumerable: true, get: function () { return redditPostHandler_js_1.createPostListEmbed; } });
Object.defineProperty(exports, "createPostEmbed", { enumerable: true, get: function () { return redditPostHandler_js_1.createPostEmbed; } });
Object.defineProperty(exports, "createNotFoundEmbed", { enumerable: true, get: function () { return redditPostHandler_js_1.createNotFoundEmbed; } });
Object.defineProperty(exports, "POSTS_PER_PAGE", { enumerable: true, get: function () { return redditPostHandler_js_1.POSTS_PER_PAGE; } });
// Rule34 handler
const rule34PostHandlerModule = __importStar(require("./rule34PostHandler.js"));
var rule34PostHandler_js_1 = require("./rule34PostHandler.js");
Object.defineProperty(exports, "createRule34PostEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createPostEmbed; } });
Object.defineProperty(exports, "createRule34VideoEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createVideoEmbed; } });
Object.defineProperty(exports, "createRule34PostButtons", { enumerable: true, get: function () { return rule34PostHandler_js_1.createPostButtons; } });
Object.defineProperty(exports, "createRule34SearchSummaryEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createSearchSummaryEmbed; } });
Object.defineProperty(exports, "createRule34NoResultsEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createNoResultsEmbed; } });
Object.defineProperty(exports, "createRule34ErrorEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createErrorEmbed; } });
Object.defineProperty(exports, "createBlacklistEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createBlacklistEmbed; } });
Object.defineProperty(exports, "createRule34FavoritesEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createFavoritesEmbed; } });
Object.defineProperty(exports, "createRule34SettingsEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createSettingsEmbed; } });
Object.defineProperty(exports, "createSettingsComponents", { enumerable: true, get: function () { return rule34PostHandler_js_1.createSettingsComponents; } });
Object.defineProperty(exports, "createRelatedTagsEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createRelatedTagsEmbed; } });
Object.defineProperty(exports, "createRule34HistoryEmbed", { enumerable: true, get: function () { return rule34PostHandler_js_1.createHistoryEmbed; } });
Object.defineProperty(exports, "RATING_COLORS", { enumerable: true, get: function () { return rule34PostHandler_js_1.RATING_COLORS; } });
Object.defineProperty(exports, "RATING_EMOJIS", { enumerable: true, get: function () { return rule34PostHandler_js_1.RATING_EMOJIS; } });
Object.defineProperty(exports, "CONTENT_EMOJIS", { enumerable: true, get: function () { return rule34PostHandler_js_1.CONTENT_EMOJIS; } });
Object.defineProperty(exports, "SORT_DISPLAY", { enumerable: true, get: function () { return rule34PostHandler_js_1.SORT_DISPLAY; } });
// Steam handler
const steamSaleHandlerModule = __importStar(require("./steamSaleHandler.js"));
var steamSaleHandler_js_1 = require("./steamSaleHandler.js");
Object.defineProperty(exports, "handleSaleCommand", { enumerable: true, get: function () { return steamSaleHandler_js_1.handleSaleCommand; } });
// Re-export as namespace objects for backward compatibility
exports.animeHandler = animeHandlerModule;
exports.pixivContentHandler = pixivContentHandlerModule;
exports.redditPostHandler = redditPostHandlerModule;
exports.steamSaleHandler = steamSaleHandlerModule;
exports.rule34PostHandler = rule34PostHandlerModule;
//# sourceMappingURL=index.js.map