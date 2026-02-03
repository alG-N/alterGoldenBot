/**
 * Moderation Repository Index
 */

// Import repositories
import InfractionRepository from './InfractionRepository';
import AutoModRepository from './AutoModRepository';
import FilterRepository from './FilterRepository';
import ModLogRepository from './ModLogRepository';

// Import types
import type { 
    Infraction, 
    InfractionType, 
    InfractionCreateData, 
    InfractionQueryOptions, 
    InfractionSearchCriteria,
    InfractionStats,
    InfractionUpdateData
} from './InfractionRepository';

import type { 
    AutoModSettings, 
    AutoModUpdateData, 
    AutoModAction 
} from './AutoModRepository';

import type { 
    WordFilter, 
    FilterMatchType, 
    FilterAction, 
    FilterAddData, 
    FilterBulkItem, 
    FilterUpdateData 
} from './FilterRepository';

import type { 
    ModLogSettings, 
    ModLogUpdateData, 
    LogType 
} from './ModLogRepository';

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
