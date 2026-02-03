"use strict";
/**
 * Handler Index
 * Exports all music command handlers
 *
 * Note: We export the entire handler modules (not individual functions)
 * to preserve 'this' context for internal method calls
 * @module handlers/music
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyHandler = exports.favoritesHandler = exports.settingsHandler = exports.buttonHandler = exports.queueHandler = exports.controlHandler = exports.playHandler = exports.handlers = exports.trackHandler = void 0;
const playHandler_js_1 = require("./playHandler.js");
const controlHandler_js_1 = require("./controlHandler.js");
const queueHandler_js_1 = require("./queueHandler.js");
const buttonHandler_js_1 = require("./buttonHandler.js");
const settingsHandler_js_1 = require("./settingsHandler.js");
const favoritesHandler_js_1 = require("./favoritesHandler.js");
const historyHandler_js_1 = require("./historyHandler.js");
var trackHandler_js_1 = require("./trackHandler.js");
Object.defineProperty(exports, "trackHandler", { enumerable: true, get: function () { return trackHandler_js_1.trackHandler; } });
// Export handlers with bound methods to preserve 'this' context
exports.handlers = {
    // Play handlers
    handlePlay: playHandler_js_1.playHandler.handlePlay.bind(playHandler_js_1.playHandler),
    handlePlaylistAdd: playHandler_js_1.playHandler.handlePlaylistAdd.bind(playHandler_js_1.playHandler),
    handleLongTrackConfirmation: playHandler_js_1.playHandler.handleLongTrackConfirmation.bind(playHandler_js_1.playHandler),
    handleLongTrackButton: playHandler_js_1.playHandler.handleLongTrackButton.bind(playHandler_js_1.playHandler),
    handlePriorityVote: playHandler_js_1.playHandler.handlePriorityVote.bind(playHandler_js_1.playHandler),
    refreshNowPlayingMessage: playHandler_js_1.playHandler.refreshNowPlayingMessage.bind(playHandler_js_1.playHandler),
    isPlaylistUrl: playHandler_js_1.playHandler.isPlaylistUrl.bind(playHandler_js_1.playHandler),
    // Control handlers
    handleStop: controlHandler_js_1.controlHandler.handleStop.bind(controlHandler_js_1.controlHandler),
    handleSkip: controlHandler_js_1.controlHandler.handleSkip.bind(controlHandler_js_1.controlHandler),
    handleVoteSkip: controlHandler_js_1.controlHandler.handleVoteSkip.bind(controlHandler_js_1.controlHandler),
    handlePause: controlHandler_js_1.controlHandler.handlePause.bind(controlHandler_js_1.controlHandler),
    handleVolume: controlHandler_js_1.controlHandler.handleVolume.bind(controlHandler_js_1.controlHandler),
    handleLoop: controlHandler_js_1.controlHandler.handleLoop.bind(controlHandler_js_1.controlHandler),
    handleShuffle: controlHandler_js_1.controlHandler.handleShuffle.bind(controlHandler_js_1.controlHandler),
    handleSeek: controlHandler_js_1.controlHandler.handleSeek.bind(controlHandler_js_1.controlHandler),
    handleAutoPlay: controlHandler_js_1.controlHandler.handleAutoPlay.bind(controlHandler_js_1.controlHandler),
    // Queue handlers
    handleQueue: queueHandler_js_1.queueHandler.handleQueue.bind(queueHandler_js_1.queueHandler),
    handleNowPlaying: queueHandler_js_1.queueHandler.handleNowPlaying.bind(queueHandler_js_1.queueHandler),
    handleRemove: queueHandler_js_1.queueHandler.handleRemove.bind(queueHandler_js_1.queueHandler),
    handleMove: queueHandler_js_1.queueHandler.handleMove.bind(queueHandler_js_1.queueHandler),
    handleClear: queueHandler_js_1.queueHandler.handleClear.bind(queueHandler_js_1.queueHandler),
    handleRecent: queueHandler_js_1.queueHandler.handleRecent.bind(queueHandler_js_1.queueHandler),
    // Button handlers
    handleButton: buttonHandler_js_1.buttonHandler.handleButton.bind(buttonHandler_js_1.buttonHandler),
    handleButtonPause: buttonHandler_js_1.buttonHandler.handleButtonPause.bind(buttonHandler_js_1.buttonHandler),
    handleButtonStop: buttonHandler_js_1.buttonHandler.handleButtonStop.bind(buttonHandler_js_1.buttonHandler),
    handleButtonSkip: buttonHandler_js_1.buttonHandler.handleButtonSkip.bind(buttonHandler_js_1.buttonHandler),
    handleButtonLoop: buttonHandler_js_1.buttonHandler.handleButtonLoop.bind(buttonHandler_js_1.buttonHandler),
    handleButtonShuffle: buttonHandler_js_1.buttonHandler.handleButtonShuffle.bind(buttonHandler_js_1.buttonHandler),
    handleButtonAutoplay: buttonHandler_js_1.buttonHandler.handleButtonAutoplay.bind(buttonHandler_js_1.buttonHandler),
    handleButtonVolume: buttonHandler_js_1.buttonHandler.handleButtonVolume.bind(buttonHandler_js_1.buttonHandler),
    handleButtonQueue: buttonHandler_js_1.buttonHandler.handleButtonQueue.bind(buttonHandler_js_1.buttonHandler),
    handleButtonFavorite: buttonHandler_js_1.buttonHandler.handleButtonFavorite.bind(buttonHandler_js_1.buttonHandler),
    handleButtonLyrics: buttonHandler_js_1.buttonHandler.handleButtonLyrics.bind(buttonHandler_js_1.buttonHandler),
    handleButtonVoteSkip: buttonHandler_js_1.buttonHandler.handleButtonVoteSkip.bind(buttonHandler_js_1.buttonHandler),
    handleButtonQueuePage: buttonHandler_js_1.buttonHandler.handleButtonQueuePage.bind(buttonHandler_js_1.buttonHandler),
    handleButtonConfirm: buttonHandler_js_1.buttonHandler.handleButtonConfirm.bind(buttonHandler_js_1.buttonHandler),
    fetchLyrics: buttonHandler_js_1.buttonHandler.fetchLyrics.bind(buttonHandler_js_1.buttonHandler),
    // Settings handlers
    handleSettings: settingsHandler_js_1.settingsHandler.handleSettings.bind(settingsHandler_js_1.settingsHandler),
    handleSelectMenu: settingsHandler_js_1.settingsHandler.handleSelectMenu.bind(settingsHandler_js_1.settingsHandler),
    handleStatus: settingsHandler_js_1.settingsHandler.handleStatus.bind(settingsHandler_js_1.settingsHandler),
    handleVolumeSelect: settingsHandler_js_1.settingsHandler.handleVolumeSelect.bind(settingsHandler_js_1.settingsHandler),
    // Favorites handlers
    handleFavorites: favoritesHandler_js_1.favoritesHandler.handleFavorites.bind(favoritesHandler_js_1.favoritesHandler),
    handleFavoritesList: favoritesHandler_js_1.favoritesHandler.handleFavoritesList.bind(favoritesHandler_js_1.favoritesHandler),
    handleFavoritesPlay: favoritesHandler_js_1.favoritesHandler.handleFavoritesPlay.bind(favoritesHandler_js_1.favoritesHandler),
    handleFavoritesRemove: favoritesHandler_js_1.favoritesHandler.handleFavoritesRemove.bind(favoritesHandler_js_1.favoritesHandler),
    handleFavoritesClear: favoritesHandler_js_1.favoritesHandler.handleFavoritesClear.bind(favoritesHandler_js_1.favoritesHandler),
    // History handlers
    handleHistory: historyHandler_js_1.historyHandler.handleHistory.bind(historyHandler_js_1.historyHandler),
    handleHistoryList: historyHandler_js_1.historyHandler.handleHistoryList.bind(historyHandler_js_1.historyHandler),
    handleHistoryPlay: historyHandler_js_1.historyHandler.handleHistoryPlay.bind(historyHandler_js_1.historyHandler),
    handleHistoryClear: historyHandler_js_1.historyHandler.handleHistoryClear.bind(historyHandler_js_1.historyHandler)
};
// Named exports for direct imports
var playHandler_js_2 = require("./playHandler.js");
Object.defineProperty(exports, "playHandler", { enumerable: true, get: function () { return playHandler_js_2.playHandler; } });
var controlHandler_js_2 = require("./controlHandler.js");
Object.defineProperty(exports, "controlHandler", { enumerable: true, get: function () { return controlHandler_js_2.controlHandler; } });
var queueHandler_js_2 = require("./queueHandler.js");
Object.defineProperty(exports, "queueHandler", { enumerable: true, get: function () { return queueHandler_js_2.queueHandler; } });
var buttonHandler_js_2 = require("./buttonHandler.js");
Object.defineProperty(exports, "buttonHandler", { enumerable: true, get: function () { return buttonHandler_js_2.buttonHandler; } });
var settingsHandler_js_2 = require("./settingsHandler.js");
Object.defineProperty(exports, "settingsHandler", { enumerable: true, get: function () { return settingsHandler_js_2.settingsHandler; } });
var favoritesHandler_js_2 = require("./favoritesHandler.js");
Object.defineProperty(exports, "favoritesHandler", { enumerable: true, get: function () { return favoritesHandler_js_2.favoritesHandler; } });
var historyHandler_js_2 = require("./historyHandler.js");
Object.defineProperty(exports, "historyHandler", { enumerable: true, get: function () { return historyHandler_js_2.historyHandler; } });
// Default export
exports.default = exports.handlers;
//# sourceMappingURL=index.js.map