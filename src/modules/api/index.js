/**
 * API Module Exports
 * Services, handlers, and repositories for API integrations
 * NOTE: Commands are loaded from src/commands/api/ by CommandRegistry
 * @module modules/api
 */

// Services
const anilistService = require('./services/anilistService');
const myAnimeListService = require('./services/myAnimeListService');
const redditService = require('./services/redditService');
const rule34Service = require('./services/rule34Service');
const pixivService = require('./services/pixivService');
const steamService = require('./services/steamService');
const nhentaiService = require('./services/nhentaiService');
const googleService = require('./services/googleService');
const wikipediaService = require('./services/wikipediaService');
const fandomService = require('./services/fandomService');

// Handlers
const animeHandler = require('./handlers/animeHandler');
const redditPostHandler = require('./handlers/redditPostHandler');
const rule34PostHandler = require('./handlers/rule34PostHandler');
const pixivContentHandler = require('./handlers/pixivContentHandler');
const steamSaleHandler = require('./handlers/steamSaleHandler');
const nhentaiHandler = require('./handlers/nhentaiHandler');
const googleHandler = require('./handlers/googleHandler');
const wikipediaHandler = require('./handlers/wikipediaHandler');

// Repositories
const cacheManager = require('./repositories/cacheManager');
const animeRepository = require('./repositories/animeRepository');
const redditCache = require('./repositories/redditCache');
const rule34Cache = require('./repositories/rule34Cache');
const pixivCache = require('./repositories/pixivCache');
const nhentaiRepository = require('./repositories/nhentaiRepository');

// Shared utilities
const { cooldownManager, COOLDOWN_SETTINGS } = require('./shared/utils/cooldown');
const { HttpClient, clients } = require('./shared/utils/httpClient');
const { BaseApiService } = require('./shared/services/BaseApiService');
const { BaseHandler, COLORS } = require('./shared/handlers/BaseHandler');
const { BaseCache } = require('./shared/repositories/BaseCache');

module.exports = {
    // Services
    services: {
        anilistService,
        myAnimeListService,
        redditService,
        rule34Service,
        pixivService,
        steamService,
        nhentaiService,
        googleService,
        wikipediaService,
        fandomService
    },
    
    // Individual service exports (for backward compatibility)
    anilistService,
    myAnimeListService,
    redditService,
    rule34Service,
    pixivService,
    steamService,
    nhentaiService,
    googleService,
    wikipediaService,
    fandomService,
    
    // Handlers
    handlers: {
        animeHandler,
        redditPostHandler,
        rule34PostHandler,
        pixivContentHandler,
        steamSaleHandler,
        nhentaiHandler,
        googleHandler,
        wikipediaHandler
    },
    
    // Individual handler exports
    animeHandler,
    redditPostHandler,
    rule34PostHandler,
    pixivContentHandler,
    steamSaleHandler,
    nhentaiHandler,
    googleHandler,
    wikipediaHandler,
    
    // Repositories
    repositories: {
        cacheManager,
        animeRepository,
        nhentaiRepository,
        redditCache,
        rule34Cache,
        pixivCache
    },
    
    // Individual repository exports
    cacheManager,
    animeRepository,
    nhentaiRepository,
    redditCache,
    rule34Cache,
    pixivCache,
    
    // Shared utilities
    shared: {
        cooldownManager,
        COOLDOWN_SETTINGS,
        HttpClient,
        clients,
        BaseApiService,
        BaseHandler,
        BaseCache,
        COLORS
    },
    
    // Direct utility exports
    cooldownManager,
    COOLDOWN_SETTINGS,
    HttpClient,
    BaseApiService,
    BaseHandler,
    BaseCache
};
