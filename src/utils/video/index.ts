/**
 * Video Utilities Index
 * @module utils/video
 */

import platformDetector, { PlatformDetector, PlatformInfo, PlatformConfig } from './platformDetector.js';
import progressAnimator, { ProgressAnimator, DetailedProgressOptions, StepInfo, PlatformStyle } from './progressAnimator.js';
import videoEmbedBuilder, { VideoEmbedBuilder, ProgressOptions, SuccessOptions } from './videoEmbedBuilder.js';

// Default exports
export default {
    platformDetector,
    progressAnimator,
    videoEmbedBuilder
};

// Named exports
export {
    platformDetector,
    progressAnimator,
    videoEmbedBuilder,
    // Classes
    PlatformDetector,
    ProgressAnimator,
    VideoEmbedBuilder,
};

// Types
export type {
    PlatformInfo,
    PlatformConfig,
    DetailedProgressOptions,
    StepInfo,
    PlatformStyle,
    ProgressOptions,
    SuccessOptions
};
