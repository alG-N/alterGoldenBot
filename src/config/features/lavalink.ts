/**
 * Lavalink Feature Configuration
 * @module config/features/lavalink
 */

export const nodes = [
    {
        name: 'main-node',
        url: `${process.env.LAVALINK_HOST || 'localhost'}:${process.env.LAVALINK_PORT || 2333}`,
        auth: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
        secure: false
    }
];

export const clientName = 'alterGolden';
export const defaultSearchPlatform = 'ytsearch';
export const fallbackSearchPlatform = 'scsearch';

export const playerOptions = {
    volume: 80,
    selfDeafen: true,
    selfMute: false
};

export const shoukakuOptions = {
    resume: false,
    resumeTimeout: 30,
    resumeByLibrary: false,
    reconnectTries: 5,
    reconnectInterval: 5000,
    restTimeout: 60000,
    moveOnDisconnect: false,
    userAgent: 'alterGolden/2.0'
};

export default {
    nodes,
    clientName,
    defaultSearchPlatform,
    fallbackSearchPlatform,
    playerOptions,
    shoukakuOptions
};
