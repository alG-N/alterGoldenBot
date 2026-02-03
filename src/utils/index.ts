/**
 * Utils Module Index
 * Pure utility functions and helpers
 * @module utils
 */

// Common utilities
export * from './common/index.js';
import * as common from './common/index.js';
export { common };

// Feature-specific utils
import * as music from './music/index.js';
import * as video from './video/index.js';
import * as deathbattle from './deathbattle/index.js';
import * as say from './say/index.js';

export { music, video, deathbattle, say };

// Re-export types for convenience
export type {
    // From pagination
    PaginationState
} from './common/pagination.js';

export type {
    // From video
    PlatformInfo,
    PlatformConfig,
    DetailedProgressOptions,
    StepInfo,
    PlatformStyle,
    ProgressOptions,
    SuccessOptions
} from './video/index.js';

export type {
    // From deathbattle
    BattleState,
    Player,
    Skillset
} from './deathbattle/index.js';
