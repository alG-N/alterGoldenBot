/**
 * Music Module Exports
 * Services, handlers, repositories for music functionality
 * NOTE: Commands are loaded from src/commands/music/ by CommandRegistry
 * @module modules/music
 */

// Services
const LavalinkService = require('./service/LavalinkService');
const MusicService = require('./service/MusicService');

// Repositories
const GuildMusicCache = require('./repository/GuildMusicCache');
const MusicCache = require('./repository/MusicCache');
const MusicCacheFacade = require('./repository/MusicCacheFacade');
const QueueCache = require('./repository/QueueCache');
const UserMusicCache = require('./repository/UserMusicCache');
const VoteCache = require('./repository/VoteCache');

// Handlers
const trackHandler = require('./handler/trackHandler');
const commandHandlers = require('./main/handlers');

// Config
const musicConfig = require('./config/musicConfig');

// Utilities
const utils = require('./utils');

// Middleware
const voiceChannelCheck = require('./middleware/voiceChannelCheck');

module.exports = {
    // Services
    services: {
        LavalinkService,
        MusicService
    },
    LavalinkService,
    MusicService,
    
    // Repositories
    repositories: {
        GuildMusicCache,
        MusicCache,
        MusicCacheFacade,
        QueueCache,
        UserMusicCache,
        VoteCache
    },
    GuildMusicCache,
    MusicCache,
    MusicCacheFacade,
    QueueCache,
    UserMusicCache,
    VoteCache,
    
    // Handlers
    handlers: {
        trackHandler,
        ...commandHandlers
    },
    trackHandler,
    commandHandlers,
    
    // Config
    config: musicConfig,
    
    // Utilities
    utils,
    
    // Middleware
    middleware: {
        voiceChannelCheck
    },
    voiceChannelCheck
};
