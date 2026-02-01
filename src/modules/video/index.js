/**
 * Video Module Exports
 * Services, utilities for video download functionality
 * NOTE: Commands are loaded from src/commands/video/ by CommandRegistry
 * @module modules/video
 */

// Services
const CobaltService = require('./service/CobaltService');
const VideoDownloadService = require('./service/VideoDownloadService');
const VideoProcessingService = require('./service/VideoProcessingService');
const YtDlpService = require('./service/YtDlpService');

// Utils
const platformDetector = require('./utils/platformDetector');
const progressAnimator = require('./utils/progressAnimator');
const videoEmbedBuilder = require('./utils/videoEmbedBuilder');

// Config
const videoConfig = require('./config/videoConfig');

// Middleware
const urlValidator = require('./middleware/urlValidator');

module.exports = {
    // Services
    services: {
        CobaltService,
        VideoDownloadService,
        VideoProcessingService,
        YtDlpService
    },
    CobaltService,
    VideoDownloadService,
    VideoProcessingService,
    YtDlpService,
    
    // Utilities
    utils: {
        platformDetector,
        progressAnimator,
        videoEmbedBuilder
    },
    platformDetector,
    progressAnimator,
    videoEmbedBuilder,
    
    // Config
    config: videoConfig,
    
    // Middleware
    middleware: {
        urlValidator
    },
    urlValidator
};
