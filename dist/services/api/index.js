"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule34Service = exports.rule34Service = exports.NHentaiService = exports.nhentaiService = exports.PixivService = exports.pixivService = exports.RedditService = exports.redditService = exports.SteamService = exports.steamService = exports.MyAnimeListService = exports.myAnimeListService = exports.AnilistService = exports.anilistService = exports.POPULAR_WIKIS = exports.FandomService = exports.fandomService = exports.WikipediaService = exports.wikipediaService = exports.GoogleService = exports.googleService = void 0;
/**
 * API Services Index
 * Re-exports all API services (TypeScript)
 * @module services/api
 */
// GENERAL API SERVICES
// Google Service
var googleService_1 = require("./googleService");
Object.defineProperty(exports, "googleService", { enumerable: true, get: function () { return googleService_1.googleService; } });
Object.defineProperty(exports, "GoogleService", { enumerable: true, get: function () { return googleService_1.GoogleService; } });
// Wikipedia Service
var wikipediaService_1 = require("./wikipediaService");
Object.defineProperty(exports, "wikipediaService", { enumerable: true, get: function () { return wikipediaService_1.wikipediaService; } });
Object.defineProperty(exports, "WikipediaService", { enumerable: true, get: function () { return wikipediaService_1.WikipediaService; } });
// Fandom Wiki Service
var fandomService_1 = require("./fandomService");
Object.defineProperty(exports, "fandomService", { enumerable: true, get: function () { return fandomService_1.fandomService; } });
Object.defineProperty(exports, "FandomService", { enumerable: true, get: function () { return fandomService_1.FandomService; } });
Object.defineProperty(exports, "POPULAR_WIKIS", { enumerable: true, get: function () { return fandomService_1.POPULAR_WIKIS; } });
// ANIME/MANGA SERVICES
// AniList Service
var anilistService_1 = require("./anilistService");
Object.defineProperty(exports, "anilistService", { enumerable: true, get: function () { return anilistService_1.anilistService; } });
Object.defineProperty(exports, "AnilistService", { enumerable: true, get: function () { return anilistService_1.AnilistService; } });
// MyAnimeList Service
var myAnimeListService_1 = require("./myAnimeListService");
Object.defineProperty(exports, "myAnimeListService", { enumerable: true, get: function () { return myAnimeListService_1.myAnimeListService; } });
Object.defineProperty(exports, "MyAnimeListService", { enumerable: true, get: function () { return myAnimeListService_1.MyAnimeListService; } });
// GAMING SERVICES
// Steam Service
var steamService_1 = require("./steamService");
Object.defineProperty(exports, "steamService", { enumerable: true, get: function () { return steamService_1.steamService; } });
Object.defineProperty(exports, "SteamService", { enumerable: true, get: function () { return steamService_1.SteamService; } });
// SOCIAL MEDIA SERVICES
// Reddit Service
var redditService_1 = require("./redditService");
Object.defineProperty(exports, "redditService", { enumerable: true, get: function () { return redditService_1.redditService; } });
Object.defineProperty(exports, "RedditService", { enumerable: true, get: function () { return redditService_1.RedditService; } });
// Pixiv Service
var pixivService_1 = require("./pixivService");
Object.defineProperty(exports, "pixivService", { enumerable: true, get: function () { return pixivService_1.pixivService; } });
Object.defineProperty(exports, "PixivService", { enumerable: true, get: function () { return pixivService_1.PixivService; } });
// NSFW SERVICES
// NHentai Service
var nhentaiService_1 = require("./nhentaiService");
Object.defineProperty(exports, "nhentaiService", { enumerable: true, get: function () { return nhentaiService_1.nhentaiService; } });
Object.defineProperty(exports, "NHentaiService", { enumerable: true, get: function () { return nhentaiService_1.NHentaiService; } });
// Rule34 Service
var rule34Service_1 = require("./rule34Service");
Object.defineProperty(exports, "rule34Service", { enumerable: true, get: function () { return rule34Service_1.rule34Service; } });
Object.defineProperty(exports, "Rule34Service", { enumerable: true, get: function () { return rule34Service_1.Rule34Service; } });
//# sourceMappingURL=index.js.map