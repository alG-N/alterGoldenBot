/**
 * Repositories - Data access layer organized by feature
 */

// Import all repository modules
import * as api from './api';
import * as music from './music';
import * as moderation from './moderation';

// Re-export all modules
export { api, music, moderation };

// Re-export individual repositories for convenience
export { 
    animeRepository, 
    cacheManager, 
    nhentaiRepository, 
    pixivCache, 
    redditCache, 
    rule34Cache 
} from './api';

export { 
    QueueCache, 
    UserMusicCache, 
    VoteCache, 
    GuildMusicCache, 
    MusicCacheFacade, 
    MusicCache 
} from './music';

export { 
    InfractionRepository, 
    AutoModRepository, 
    FilterRepository, 
    ModLogRepository 
} from './moderation';

// Default export
export default {
    api,
    music,
    moderation
};
