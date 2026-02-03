/**
 * Video Feature Configuration
 * @module config/features/video
 */

// Quality settings
export const COBALT_VIDEO_QUALITY = '720';
export const YTDLP_VIDEO_QUALITY = '720';
export const quality = {
    video: '720',
    audio: '192'
};

// Mobile compatibility
export const ENABLE_MOBILE_PROCESSING = true;
export const MOBILE_VIDEO_CODEC = 'libx264';
export const MOBILE_AUDIO_CODEC = 'aac';
export const MOBILE_CRF = '23';
export const MOBILE_PRESET = 'fast';
export const mobile = {
    enabled: true,
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '28',
    preset: 'ultrafast',
    useHardwareAccel: true,
    hardwareEncoders: ['h264_nvenc', 'h264_qsv', 'h264_vaapi']
};

// Limits
export const MAX_FILE_SIZE_MB = 100;
export const MAX_VIDEO_DURATION_SECONDS = 600;
export const MAX_CONCURRENT_DOWNLOADS = 3;
export const USER_COOLDOWN_SECONDS = 30;
export const limits = {
    maxFileSizeMB: 100,
    maxDurationSeconds: 600,
    maxConcurrentDownloads: 3,
    userCooldownSeconds: 30
};

// Cleanup
export const TEMP_FILE_CLEANUP_INTERVAL = 5 * 60 * 1000;
export const TEMP_FILE_MAX_AGE = 15 * 60 * 1000;
export const FILE_DELETE_DELAY = 5000;
export const cleanup = {
    tempFileInterval: 5 * 60 * 1000,
    tempFileMaxAge: 15 * 60 * 1000,
    fileDeleteDelay: 5000
};

// Network
export const DOWNLOAD_TIMEOUT = 120000;
export const MAX_RETRIES = 5;
export const FRAGMENT_RETRIES = 5;
export const network = {
    downloadTimeout: 120000,
    maxRetries: 5,
    fragmentRetries: 5,
    bufferSize: '8M',
    concurrentFragments: 8,
    ffmpegThreads: 0
};

// UI
export const ui = {
    progressUpdateInterval: 1500,
    progressBarStyle: 'default',
    showDownloadSpeed: true,
    showEta: true,
    showFileSize: true,
    animationEnabled: true
};

// Messages
export const messages = {
    downloadTip: ' *Tip: Lower quality = faster download & smaller file size*',
    successTip: '> *Video will be attached below* '
};

// User Agent
export const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export default {
    COBALT_VIDEO_QUALITY,
    YTDLP_VIDEO_QUALITY,
    quality,
    ENABLE_MOBILE_PROCESSING,
    MOBILE_VIDEO_CODEC,
    MOBILE_AUDIO_CODEC,
    MOBILE_CRF,
    MOBILE_PRESET,
    mobile,
    MAX_FILE_SIZE_MB,
    MAX_VIDEO_DURATION_SECONDS,
    MAX_CONCURRENT_DOWNLOADS,
    USER_COOLDOWN_SECONDS,
    limits,
    TEMP_FILE_CLEANUP_INTERVAL,
    TEMP_FILE_MAX_AGE,
    FILE_DELETE_DELAY,
    cleanup,
    DOWNLOAD_TIMEOUT,
    MAX_RETRIES,
    FRAGMENT_RETRIES,
    network,
    ui,
    messages,
    userAgent
};
