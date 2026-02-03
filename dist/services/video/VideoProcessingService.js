"use strict";
/**
 * VideoProcessingService - Ensures videos are mobile-compatible
 * Converts videos to H.264 + AAC format for universal playback
 * @module services/video/VideoProcessingService
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProcessingService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const videoConfig = __importStar(require("../../config/features/video.js"));
const config = videoConfig;
// VIDEO PROCESSING SERVICE CLASS
class VideoProcessingService extends events_1.EventEmitter {
    ffmpegPath = 'ffmpeg';
    ffprobePath = 'ffprobe';
    initialized = false;
    hardwareEncoder = null;
    hardwareChecked = false;
    constructor() {
        super();
    }
    /**
     * Initialize and check if FFmpeg is available
     */
    async initialize() {
        if (this.initialized)
            return true;
        try {
            (0, child_process_1.execSync)('ffmpeg -version', { stdio: 'pipe', windowsHide: true });
            (0, child_process_1.execSync)('ffprobe -version', { stdio: 'pipe', windowsHide: true });
            this.initialized = true;
            console.log('✅ VideoProcessingService initialized (FFmpeg available)');
            return true;
        }
        catch {
            console.warn('⚠️ FFmpeg not found - video processing disabled');
            console.warn('   Install FFmpeg for mobile-compatible video encoding');
            return false;
        }
    }
    /**
     * Detect available hardware encoder
     * @returns Hardware encoder name or null
     */
    async detectHardwareEncoder() {
        if (this.hardwareChecked)
            return this.hardwareEncoder;
        this.hardwareChecked = true;
        const encoders = config.HARDWARE_ENCODERS || ['h264_nvenc', 'h264_qsv', 'h264_vaapi'];
        for (const encoder of encoders) {
            try {
                // Test if encoder is available
                (0, child_process_1.execSync)(`ffmpeg -hide_banner -encoders 2>&1 | findstr /i ${encoder}`, {
                    stdio: 'pipe',
                    windowsHide: true,
                    shell: 'cmd.exe'
                });
                // Test if encoder actually works with a quick encode
                (0, child_process_1.execSync)(`ffmpeg -f lavfi -i color=black:s=64x64:d=0.1 -c:v ${encoder} -f null - 2>&1`, {
                    stdio: 'pipe',
                    windowsHide: true,
                    timeout: 5000
                });
                this.hardwareEncoder = encoder;
                console.log(`🎮 Hardware encoder detected: ${encoder}`);
                return encoder;
            }
            catch {
                // Try next encoder
                continue;
            }
        }
        console.log('💻 No hardware encoder available, using software encoding');
        return null;
    }
    /**
     * Check if video needs re-encoding for mobile compatibility
     * @param videoPath - Path to video file
     * @returns Video info and whether it needs re-encoding
     */
    async analyzeVideo(videoPath) {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.initialized) {
            return { needsReencoding: false, reason: 'FFmpeg not available' };
        }
        return new Promise((resolve) => {
            const args = [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                videoPath
            ];
            const ffprobe = (0, child_process_1.spawn)(this.ffprobePath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true
            });
            let output = '';
            let errorOutput = '';
            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });
            ffprobe.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            ffprobe.on('close', (code) => {
                if (code !== 0) {
                    console.error('FFprobe error:', errorOutput);
                    resolve({ needsReencoding: false, reason: 'Analysis failed' });
                    return;
                }
                try {
                    const info = JSON.parse(output);
                    const videoStream = info.streams?.find(s => s.codec_type === 'video');
                    const audioStream = info.streams?.find(s => s.codec_type === 'audio');
                    if (!videoStream) {
                        resolve({ needsReencoding: false, reason: 'No video stream' });
                        return;
                    }
                    const videoCodec = videoStream.codec_name?.toLowerCase() || '';
                    const audioCodec = audioStream?.codec_name?.toLowerCase() || '';
                    const container = path.extname(videoPath).toLowerCase();
                    // Mobile-compatible codecs
                    const mobileVideoCodecs = ['h264', 'avc', 'avc1'];
                    const mobileAudioCodecs = ['aac', 'mp3', 'mp4a'];
                    const isVideoCompatible = mobileVideoCodecs.some(c => videoCodec.includes(c));
                    const isAudioCompatible = !audioStream || mobileAudioCodecs.some(c => audioCodec.includes(c));
                    const isContainerCompatible = container === '.mp4';
                    const needsReencoding = !isVideoCompatible || !isAudioCompatible || !isContainerCompatible;
                    const result = {
                        needsReencoding,
                        videoCodec,
                        audioCodec,
                        container,
                        width: videoStream.width,
                        height: videoStream.height,
                        duration: parseFloat(info.format?.duration || '0'),
                        reason: needsReencoding
                            ? `Video: ${videoCodec}${!isVideoCompatible ? ' (incompatible)' : ''}, ` +
                                `Audio: ${audioCodec || 'none'}${!isAudioCompatible ? ' (incompatible)' : ''}, ` +
                                `Container: ${container}${!isContainerCompatible ? ' (incompatible)' : ''}`
                            : 'Already mobile-compatible'
                    };
                    console.log(`📊 Video analysis: ${result.reason}`);
                    resolve(result);
                }
                catch (parseError) {
                    console.error('FFprobe parse error:', parseError.message);
                    resolve({ needsReencoding: false, reason: 'Parse failed' });
                }
            });
            ffprobe.on('error', (err) => {
                console.error('FFprobe spawn error:', err.message);
                resolve({ needsReencoding: false, reason: 'Spawn failed' });
            });
        });
    }
    /**
     * Convert video to mobile-compatible format (H.264 + AAC in MP4)
     * @param inputPath - Input video path
     * @param options - Processing options
     * @returns Path to processed video
     */
    async processForMobile(inputPath, options = {}) {
        // Check if mobile processing is enabled
        if (config.ENABLE_MOBILE_PROCESSING === false) {
            console.log('⏭️ Mobile processing disabled in config');
            return inputPath;
        }
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.initialized) {
            console.log('⚠️ FFmpeg not available, skipping processing');
            return inputPath;
        }
        // Analyze the video first
        const analysis = await this.analyzeVideo(inputPath);
        if (!analysis.needsReencoding) {
            console.log('✅ Video is already mobile-compatible');
            return inputPath;
        }
        this.emit('stage', { stage: 'processing', message: 'Converting for mobile compatibility...' });
        console.log(`🔄 Re-encoding video for mobile: ${analysis.reason}`);
        return new Promise(async (resolve) => {
            const timestamp = Date.now();
            const outputPath = inputPath.replace(/\.[^.]+$/, `_mobile_${timestamp}.mp4`);
            // Get settings from config or use defaults
            let videoCodec = config.MOBILE_VIDEO_CODEC || 'libx264';
            const audioCodec = config.MOBILE_AUDIO_CODEC || 'aac';
            const crf = config.MOBILE_CRF || '28';
            const preset = config.MOBILE_PRESET || 'ultrafast';
            const threads = config.FFMPEG_THREADS ?? 0;
            // Try hardware acceleration if enabled
            if (config.USE_HARDWARE_ACCEL) {
                const hwEncoder = await this.detectHardwareEncoder();
                if (hwEncoder) {
                    videoCodec = hwEncoder;
                    console.log(`🚀 Using hardware encoder: ${hwEncoder}`);
                }
            }
            // FFmpeg arguments for mobile-compatible encoding - OPTIMIZED FOR SPEED
            const args = [
                '-i', inputPath,
                '-y', // Overwrite output
                '-threads', String(threads), // Use all CPU cores
                '-c:v', videoCodec, // Video codec (hw or libx264)
            ];
            // Add codec-specific options
            if (videoCodec === 'libx264') {
                args.push('-preset', preset, // ultrafast for max speed
                '-crf', crf, // Higher CRF = faster
                '-tune', 'fastdecode' // Optimize for fast decoding
                );
            }
            else if (videoCodec.includes('nvenc')) {
                args.push('-preset', 'p1', // Fastest NVENC preset
                '-rc', 'vbr', // Variable bitrate
                '-cq', crf // Quality level
                );
            }
            else if (videoCodec.includes('qsv')) {
                args.push('-preset', 'veryfast', '-global_quality', crf);
            }
            args.push('-profile:v', 'high', // High profile for compression
            '-level', '4.1', // Compatible with most devices
            '-pix_fmt', 'yuv420p', // Required for some players
            '-c:a', audioCodec, // AAC audio codec
            '-b:a', '128k', // Lower audio bitrate for speed
            '-ar', '44100', // Audio sample rate
            '-movflags', '+faststart', // Enable fast start for streaming
            '-max_muxing_queue_size', '2048', outputPath);
            // Add duration limit if needed
            const maxDuration = config.MAX_VIDEO_DURATION_SECONDS || 600;
            if (analysis.duration && analysis.duration > maxDuration) {
                args.splice(2, 0, '-t', String(maxDuration));
            }
            console.log(`🎬 FFmpeg processing: ${inputPath} -> ${outputPath}`);
            console.log(`   Codec: ${videoCodec}, Preset: ${preset}, CRF: ${crf}`);
            const ffmpeg = (0, child_process_1.spawn)(this.ffmpegPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true
            });
            let lastProgressUpdate = 0;
            let errorOutput = '';
            ffmpeg.stderr.on('data', (data) => {
                const line = data.toString();
                errorOutput += line;
                // Parse progress from FFmpeg output
                const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.?\d*)/);
                if (timeMatch && analysis.duration && analysis.duration > 0) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const seconds = parseFloat(timeMatch[3]);
                    const currentTime = hours * 3600 + minutes * 60 + seconds;
                    const percent = Math.min((currentTime / analysis.duration) * 100, 99);
                    const now = Date.now();
                    if (now - lastProgressUpdate >= 500) {
                        this.emit('progress', {
                            percent,
                            stage: 'processing',
                            message: `Converting: ${percent.toFixed(0)}%`
                        });
                        lastProgressUpdate = now;
                    }
                }
            });
            ffmpeg.on('close', (code) => {
                if (code !== 0) {
                    console.error('❌ FFmpeg error:', errorOutput.slice(-500));
                    // Return original file if processing fails
                    resolve(inputPath);
                    return;
                }
                // Verify output file exists and has content
                if (fs.existsSync(outputPath)) {
                    const stats = fs.statSync(outputPath);
                    if (stats.size > 0) {
                        console.log(`✅ Video processed: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                        // Delete original file
                        try {
                            fs.unlinkSync(inputPath);
                        }
                        catch (e) {
                            console.warn('Could not delete original file:', e.message);
                        }
                        this.emit('progress', { percent: 100, stage: 'processing', message: 'Processing complete!' });
                        resolve(outputPath);
                        return;
                    }
                }
                // Output file invalid, return original
                console.warn('⚠️ Processed file invalid, using original');
                try {
                    if (fs.existsSync(outputPath))
                        fs.unlinkSync(outputPath);
                }
                catch {
                    // Ignore cleanup errors
                }
                resolve(inputPath);
            });
            ffmpeg.on('error', (err) => {
                console.error('FFmpeg spawn error:', err.message);
                resolve(inputPath);
            });
            // Timeout for processing (5 minutes max)
            const timeout = setTimeout(() => {
                console.warn('⚠️ FFmpeg processing timeout');
                ffmpeg.kill('SIGKILL');
            }, 5 * 60 * 1000);
            ffmpeg.on('close', () => clearTimeout(timeout));
        });
    }
    /**
     * Quick check if file is mobile-compatible without full analysis
     * @param videoPath - Video file path
     * @returns True if likely compatible
     */
    isLikelyMobileCompatible(videoPath) {
        const ext = path.extname(videoPath).toLowerCase();
        // WebM files are almost never mobile-compatible
        // MKV files need conversion
        return ext === '.mp4';
    }
}
exports.VideoProcessingService = VideoProcessingService;
// Create default instance
const videoProcessingService = new VideoProcessingService();
exports.default = videoProcessingService;
//# sourceMappingURL=VideoProcessingService.js.map