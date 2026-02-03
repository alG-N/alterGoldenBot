"use strict";
/**
 * Music Events Module
 * @module services/music/events
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaybackEventHandler = exports.playbackEventHandler = exports.MusicEvents = exports.MusicEventBus = exports.musicEventBus = void 0;
var MusicEventBus_js_1 = require("./MusicEventBus.js");
Object.defineProperty(exports, "musicEventBus", { enumerable: true, get: function () { return __importDefault(MusicEventBus_js_1).default; } });
Object.defineProperty(exports, "MusicEventBus", { enumerable: true, get: function () { return MusicEventBus_js_1.MusicEventBus; } });
var MusicEvents_js_1 = require("./MusicEvents.js");
Object.defineProperty(exports, "MusicEvents", { enumerable: true, get: function () { return __importDefault(MusicEvents_js_1).default; } });
var PlaybackEventHandler_js_1 = require("./PlaybackEventHandler.js");
Object.defineProperty(exports, "playbackEventHandler", { enumerable: true, get: function () { return __importDefault(PlaybackEventHandler_js_1).default; } });
Object.defineProperty(exports, "PlaybackEventHandler", { enumerable: true, get: function () { return PlaybackEventHandler_js_1.PlaybackEventHandler; } });
//# sourceMappingURL=index.js.map