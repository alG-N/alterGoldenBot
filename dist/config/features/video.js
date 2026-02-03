"use strict";
/**
 * Video Feature Configuration
 * @module config/features/video
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAgent = exports.messages = exports.ui = exports.network = exports.FRAGMENT_RETRIES = exports.MAX_RETRIES = exports.DOWNLOAD_TIMEOUT = exports.cleanup = exports.FILE_DELETE_DELAY = exports.TEMP_FILE_MAX_AGE = exports.TEMP_FILE_CLEANUP_INTERVAL = exports.limits = exports.USER_COOLDOWN_SECONDS = exports.MAX_CONCURRENT_DOWNLOADS = exports.MAX_VIDEO_DURATION_SECONDS = exports.MAX_FILE_SIZE_MB = exports.mobile = exports.MOBILE_PRESET = exports.MOBILE_CRF = exports.MOBILE_AUDIO_CODEC = exports.MOBILE_VIDEO_CODEC = exports.ENABLE_MOBILE_PROCESSING = exports.quality = exports.YTDLP_VIDEO_QUALITY = exports.COBALT_VIDEO_QUALITY = void 0;
// Quality settings
exports.COBALT_VIDEO_QUALITY = '720';
exports.YTDLP_VIDEO_QUALITY = '720';
exports.quality = {
    video: '720',
    audio: '192'
};
// Mobile compatibility
exports.ENABLE_MOBILE_PROCESSING = true;
exports.MOBILE_VIDEO_CODEC = 'libx264';
exports.MOBILE_AUDIO_CODEC = 'aac';
exports.MOBILE_CRF = '23';
exports.MOBILE_PRESET = 'fast';
exports.mobile = {
    enabled: true,
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '28',
    preset: 'ultrafast',
    useHardwareAccel: true,
    hardwareEncoders: ['h264_nvenc', 'h264_qsv', 'h264_vaapi']
};
// Limits
exports.MAX_FILE_SIZE_MB = 100;
exports.MAX_VIDEO_DURATION_SECONDS = 600;
exports.MAX_CONCURRENT_DOWNLOADS = 3;
exports.USER_COOLDOWN_SECONDS = 30;
exports.limits = {
    maxFileSizeMB: 100,
    maxDurationSeconds: 600,
    maxConcurrentDownloads: 3,
    userCooldownSeconds: 30
};
// Cleanup
exports.TEMP_FILE_CLEANUP_INTERVAL = 5 * 60 * 1000;
exports.TEMP_FILE_MAX_AGE = 15 * 60 * 1000;
exports.FILE_DELETE_DELAY = 5000;
exports.cleanup = {
    tempFileInterval: 5 * 60 * 1000,
    tempFileMaxAge: 15 * 60 * 1000,
    fileDeleteDelay: 5000
};
// Network
exports.DOWNLOAD_TIMEOUT = 120000;
exports.MAX_RETRIES = 5;
exports.FRAGMENT_RETRIES = 5;
exports.network = {
    downloadTimeout: 120000,
    maxRetries: 5,
    fragmentRetries: 5,
    bufferSize: '8M',
    concurrentFragments: 8,
    ffmpegThreads: 0
};
// UI
exports.ui = {
    progressUpdateInterval: 1500,
    progressBarStyle: 'default',
    showDownloadSpeed: true,
    showEta: true,
    showFileSize: true,
    animationEnabled: true
};
// Messages
exports.messages = {
    downloadTip: ' *Tip: Lower quality = faster download & smaller file size*',
    successTip: '> *Video will be attached below* '
};
// User Agent
exports.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
exports.default = {
    COBALT_VIDEO_QUALITY: exports.COBALT_VIDEO_QUALITY,
    YTDLP_VIDEO_QUALITY: exports.YTDLP_VIDEO_QUALITY,
    quality: exports.quality,
    ENABLE_MOBILE_PROCESSING: exports.ENABLE_MOBILE_PROCESSING,
    MOBILE_VIDEO_CODEC: exports.MOBILE_VIDEO_CODEC,
    MOBILE_AUDIO_CODEC: exports.MOBILE_AUDIO_CODEC,
    MOBILE_CRF: exports.MOBILE_CRF,
    MOBILE_PRESET: exports.MOBILE_PRESET,
    mobile: exports.mobile,
    MAX_FILE_SIZE_MB: exports.MAX_FILE_SIZE_MB,
    MAX_VIDEO_DURATION_SECONDS: exports.MAX_VIDEO_DURATION_SECONDS,
    MAX_CONCURRENT_DOWNLOADS: exports.MAX_CONCURRENT_DOWNLOADS,
    USER_COOLDOWN_SECONDS: exports.USER_COOLDOWN_SECONDS,
    limits: exports.limits,
    TEMP_FILE_CLEANUP_INTERVAL: exports.TEMP_FILE_CLEANUP_INTERVAL,
    TEMP_FILE_MAX_AGE: exports.TEMP_FILE_MAX_AGE,
    FILE_DELETE_DELAY: exports.FILE_DELETE_DELAY,
    cleanup: exports.cleanup,
    DOWNLOAD_TIMEOUT: exports.DOWNLOAD_TIMEOUT,
    MAX_RETRIES: exports.MAX_RETRIES,
    FRAGMENT_RETRIES: exports.FRAGMENT_RETRIES,
    network: exports.network,
    ui: exports.ui,
    messages: exports.messages,
    userAgent: exports.userAgent
};
//# sourceMappingURL=video.js.map