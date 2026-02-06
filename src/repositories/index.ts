/**
 * Repositories - Data access layer organized by feature
 * Note: Music caches have been moved to src/cache/music/
 */

// Import all repository modules
import * as api from './api/index.js';
import * as moderation from './moderation/index.js';
import * as general from './general/index.js';

// Re-export all modules
export { api, moderation, general };

// Re-export individual repositories for convenience
export { 
    animeRepository, 
    nhentaiRepository, 
    pixivCache, 
    redditCache, 
    rule34Cache 
} from './api/index.js';

// Music caches are now in src/cache/music/
// Import from there: import { MusicCache } from '../../cache/music.js';

export { 
    InfractionRepository, 
    AutoModRepository, 
    FilterRepository, 
    ModLogRepository 
} from './moderation/index.js';

export {
    afkRepository,
    AfkRepository
} from './general/index.js';

// Default export
export default {
    api,
    moderation,
    general
};
