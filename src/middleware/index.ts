/**
 * Middleware Module
 * Centralized access control, validation, and restrictions
 */

// Import modules
import * as access from './access.js';
import * as voiceChannelCheck from './voiceChannelCheck.js';
import * as urlValidator from './urlValidator.js';

// Re-export access control
export {
    AccessType,
    RateLimiter,
    DistributedRateLimiter,
    validators,
    checkMaintenance,
    checkNSFW,
    checkAccess,
    createErrorEmbed,
    createWarningEmbed,
    createSuccessEmbed,
    createInfoEmbed,
    createCooldownEmbed,
    hasPermissions,
    isServerAdmin,
    isServerOwner,
    canModerate,
    botCanModerate,
    validateVideoUrl
} from './access.js';

// Re-export voice channel checks
export {
    checkVoiceChannel,
    checkSameVoiceChannel,
    checkVoicePermissions,
    checkVoiceChannelSync,
    checkVoicePermissionsSync
} from './voiceChannelCheck.js';

// Re-export URL validation
export {
    validateUrl,
    isBlockedHost,
    BLOCKED_HOST_PATTERNS
} from './urlValidator.js';

// Re-export types
export type {
    RateLimiterOptions,
    DistributedRateLimiterOptions,
    RateLimitCheckResult,
    ValidationResult,
    ModerateResult,
    AccessCheckResult,
    MaintenanceCheckResult,
    AccessTypeValue,
    AnyInteraction
} from './access.js';

export type {
    VoiceCheckResult,
    MusicInteraction
} from './voiceChannelCheck.js';

// Default export with all modules
export default {
    // Access module
    ...access,
    
    // Voice channel checks
    ...voiceChannelCheck,
    
    // URL validator
    ...urlValidator
};
