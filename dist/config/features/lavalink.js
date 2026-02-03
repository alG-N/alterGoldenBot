"use strict";
/**
 * Lavalink Feature Configuration
 * @module config/features/lavalink
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shoukakuOptions = exports.playerOptions = exports.fallbackSearchPlatform = exports.defaultSearchPlatform = exports.clientName = exports.nodes = void 0;
exports.nodes = [
    {
        name: 'main-node',
        url: `${process.env.LAVALINK_HOST || 'localhost'}:${process.env.LAVALINK_PORT || 2333}`,
        auth: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
        secure: false
    }
];
exports.clientName = 'alterGolden';
exports.defaultSearchPlatform = 'ytsearch';
exports.fallbackSearchPlatform = 'scsearch';
exports.playerOptions = {
    volume: 80,
    selfDeafen: true,
    selfMute: false
};
exports.shoukakuOptions = {
    resume: false,
    resumeTimeout: 30,
    resumeByLibrary: false,
    reconnectTries: 5,
    reconnectInterval: 5000,
    restTimeout: 60000,
    moveOnDisconnect: false,
    userAgent: 'alterGolden/2.0'
};
exports.default = {
    nodes: exports.nodes,
    clientName: exports.clientName,
    defaultSearchPlatform: exports.defaultSearchPlatform,
    fallbackSearchPlatform: exports.fallbackSearchPlatform,
    playerOptions: exports.playerOptions,
    shoukakuOptions: exports.shoukakuOptions
};
//# sourceMappingURL=lavalink.js.map