"use strict";
/**
 * Music Services
 *
 * Architecture (Phase 2 Week 6-7):
 * - MusicFacade: Orchestrator providing backward-compatible API
 * - QueueService: Queue CRUD operations
 * - PlaybackService: Play, pause, skip, stop operations
 * - VoiceConnectionService: Voice channel connection and monitoring
 * - AutoPlayService: Similar track discovery for auto-play
 * - LavalinkService: Low-level Lavalink connection management
 *
 * Event System (Week 7):
 * - MusicEventBus: Central event emitter for decoupled communication
 * - MusicEvents: Event name constants
 * - PlaybackEventHandler: Handles player lifecycle events
 * @module services/music
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicService = exports.LavalinkService = exports.lavalinkService = exports.PlaybackEventHandler = exports.playbackEventHandler = exports.MusicEvents = exports.MusicEventBus = exports.musicEventBus = exports.AutoPlayService = exports.autoPlayService = exports.VoiceConnectionService = exports.voiceConnectionService = exports.PlaybackService = exports.playbackService = exports.QueueService = exports.queueService = exports.MusicFacade = exports.musicFacade = void 0;
// New architecture (Phase 2)
var MusicFacade_js_1 = require("./MusicFacade.js");
Object.defineProperty(exports, "musicFacade", { enumerable: true, get: function () { return __importDefault(MusicFacade_js_1).default; } });
Object.defineProperty(exports, "MusicFacade", { enumerable: true, get: function () { return MusicFacade_js_1.musicFacade; } });
var index_js_1 = require("./queue/index.js");
Object.defineProperty(exports, "queueService", { enumerable: true, get: function () { return index_js_1.queueService; } });
Object.defineProperty(exports, "QueueService", { enumerable: true, get: function () { return index_js_1.QueueService; } });
var index_js_2 = require("./playback/index.js");
Object.defineProperty(exports, "playbackService", { enumerable: true, get: function () { return index_js_2.playbackService; } });
Object.defineProperty(exports, "PlaybackService", { enumerable: true, get: function () { return index_js_2.PlaybackService; } });
var index_js_3 = require("./voice/index.js");
Object.defineProperty(exports, "voiceConnectionService", { enumerable: true, get: function () { return index_js_3.voiceConnectionService; } });
Object.defineProperty(exports, "VoiceConnectionService", { enumerable: true, get: function () { return index_js_3.VoiceConnectionService; } });
var index_js_4 = require("./autoplay/index.js");
Object.defineProperty(exports, "autoPlayService", { enumerable: true, get: function () { return index_js_4.autoPlayService; } });
Object.defineProperty(exports, "AutoPlayService", { enumerable: true, get: function () { return index_js_4.AutoPlayService; } });
// Event system (Week 7)
var index_js_5 = require("./events/index.js");
Object.defineProperty(exports, "musicEventBus", { enumerable: true, get: function () { return index_js_5.musicEventBus; } });
Object.defineProperty(exports, "MusicEventBus", { enumerable: true, get: function () { return index_js_5.MusicEventBus; } });
Object.defineProperty(exports, "MusicEvents", { enumerable: true, get: function () { return index_js_5.MusicEvents; } });
Object.defineProperty(exports, "playbackEventHandler", { enumerable: true, get: function () { return index_js_5.playbackEventHandler; } });
Object.defineProperty(exports, "PlaybackEventHandler", { enumerable: true, get: function () { return index_js_5.PlaybackEventHandler; } });
// Core services
var LavalinkService_js_1 = require("./LavalinkService.js");
Object.defineProperty(exports, "lavalinkService", { enumerable: true, get: function () { return __importDefault(LavalinkService_js_1).default; } });
Object.defineProperty(exports, "LavalinkService", { enumerable: true, get: function () { return LavalinkService_js_1.LavalinkService; } });
// Re-export MusicFacade as MusicService for backward compatibility
var MusicFacade_js_2 = require("./MusicFacade.js");
Object.defineProperty(exports, "MusicService", { enumerable: true, get: function () { return MusicFacade_js_2.musicFacade; } });
//# sourceMappingURL=index.js.map