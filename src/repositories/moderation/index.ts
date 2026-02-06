/**
 * Moderation Repository Index
 */

// Import repositories
import InfractionRepository from './InfractionRepository.js';
import AutoModRepository from './AutoModRepository.js';
import FilterRepository from './FilterRepository.js';
import ModLogRepository from './ModLogRepository.js';

// Import types
import type { 
    Infraction, 
    InfractionType, 
    InfractionCreateData, 
    InfractionQueryOptions, 
    InfractionSearchCriteria,
    InfractionStats,
    InfractionUpdateData
} from './InfractionRepository.js';

import type { 
    AutoModSettings, 
    AutoModUpdateData, 
    AutoModAction 
} from './AutoModRepository.js';

import type { 
    WordFilter, 
    FilterMatchType, 
    FilterAction, 
    FilterAddData, 
    FilterBulkItem, 
    FilterUpdateData 
} from './FilterRepository.js';

import type { 
    ModLogSettings, 
    ModLogUpdateData, 
    LogType 
} from './ModLogRepository.js';

// Re-export repositories
export {
    InfractionRepository,
    AutoModRepository,
    FilterRepository,
    ModLogRepository
};

// Re-export types
export type {
    // Infraction types
    Infraction,
    InfractionType,
    InfractionCreateData,
    InfractionQueryOptions,
    InfractionSearchCriteria,
    InfractionStats,
    InfractionUpdateData,
    
    // AutoMod types
    AutoModSettings,
    AutoModUpdateData,
    AutoModAction,
    
    // Filter types
    WordFilter,
    FilterMatchType,
    FilterAction,
    FilterAddData,
    FilterBulkItem,
    FilterUpdateData,
    
    // ModLog types
    ModLogSettings,
    ModLogUpdateData,
    LogType
};

// Default export
export default {
    InfractionRepository,
    AutoModRepository,
    FilterRepository,
    ModLogRepository
};
