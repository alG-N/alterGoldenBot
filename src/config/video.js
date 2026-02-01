/**
 * Video Configuration
 * Settings for video download functionality
 * @module config/video
 */

module.exports = {
    // Cobalt instances for video download
    COBALT_INSTANCES: [
        'http://localhost:9000'
    ],

    // Quality Settings
    COBALT_VIDEO_QUALITY: '720',
    YTDLP_VIDEO_QUALITY: '720',
    YTDLP_AUDIO_QUALITY: '192',

    // Mobile Compatibility - OPTIMIZED FOR SPEED
    ENABLE_MOBILE_PROCESSING: true,
    MOBILE_VIDEO_CODEC: 'libx264',
    MOBILE_AUDIO_CODEC: 'aac',
    MOBILE_CRF: '28',              // Higher = faster, slightly lower quality (was 23)
    MOBILE_PRESET: 'ultrafast',    // Fastest encoding (was 'fast')
    
    // Hardware acceleration (if available)
    USE_HARDWARE_ACCEL: true,      // Try NVENC/QSV/VAAPI if available
    HARDWARE_ENCODERS: ['h264_nvenc', 'h264_qsv', 'h264_vaapi'], // Priority order
    
    // Threading
    FFMPEG_THREADS: 0,             // 0 = auto (use all cores)

    // File Size Settings
    MAX_FILE_SIZE_MB: 500,

    // Duration & Abuse Prevention
    MAX_VIDEO_DURATION_SECONDS: 600,
    MAX_CONCURRENT_DOWNLOADS: 3,
    USER_COOLDOWN_SECONDS: 30,

    // Cleanup Settings
    TEMP_FILE_CLEANUP_INTERVAL: 5 * 60 * 1000,
    TEMP_FILE_MAX_AGE: 15 * 60 * 1000,
    FILE_DELETE_DELAY: 5000,

    // Network Settings
    DOWNLOAD_TIMEOUT: 120000,
    MAX_RETRIES: 5,
    FRAGMENT_RETRIES: 5,
    BUFFER_SIZE: '8M',
    CONCURRENT_FRAGMENTS: 8,

    // UI Settings
    UI: {
        PROGRESS_UPDATE_INTERVAL: 1500,
        PROGRESS_BAR_STYLE: 'default',
        SHOW_DOWNLOAD_SPEED: true,
        SHOW_ETA: true,
        SHOW_FILE_SIZE: true,
        ANIMATION_ENABLED: true
    },

    // Messages
    MESSAGES: {
        DOWNLOAD_TIP: ' *Tip: Lower quality = faster download & smaller file size*',
        SUCCESS_TIP: '> *Video will be attached below* '
    },

    // User Agent
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};
