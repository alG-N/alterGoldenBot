/**
 * Lavalink Configuration
 * Settings for the Lavalink music server
 * @module config/lavalink
 */

module.exports = {
    nodes: [
        {
            name: 'main-node',
            url: 'localhost:2333',
            auth: 'youshallnotpass',
            secure: false
        }
    ],
    clientName: 'alterGolden',
    defaultSearchPlatform: 'ytsearch',
    fallbackSearchPlatform: 'scsearch',
    playerOptions: {
        volume: 80,
        selfDeafen: true,
        selfMute: false
    },
    shoukakuOptions: {
        resume: false,
        resumeTimeout: 30,
        resumeByLibrary: false,
        reconnectTries: 5,
        reconnectInterval: 5000,
        restTimeout: 60000,
        moveOnDisconnect: false,
        userAgent: 'alterGolden/1.0'
    }
};
