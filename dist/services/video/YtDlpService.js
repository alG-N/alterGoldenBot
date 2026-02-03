"use strict";
/**
 * YtDlpService - Fallback video downloader using yt-dlp via Docker
 * Used when Cobalt fails or returns empty videos
 * @module services/video/YtDlpService
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
exports.YtDlpService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const videoConfig = __importStar(require("../../config/features/video.js"));
const config = videoConfig;
// YTDLP SERVICE CLASS
class YtDlpService extends events_1.EventEmitter {
    containerName = 'yt-dlp';
    dockerDownloadPath = '/downloads';
    tempDir;
    initialized = false;
    constructor() {
        super();
        this.tempDir = path.join(__dirname, 'temp');
    }
    /**
     * Initialize and verify Docker container is running
     */
    async initialize() {
        if (this.initialized)
            return true;
        try {
            // Ensure temp directory exists
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
            // Check if Docker is available
            try {
                (0, child_process_1.execSync)('docker --version', {
                    stdio: 'pipe',
                    encoding: 'utf-8',
                    windowsHide: true
                });
            }
            catch {
                console.warn('⚠️ Docker is not available');
                return false;
            }
            // Check if container is running
            try {
                const result = (0, child_process_1.execSync)(`docker inspect -f "{{.State.Running}}" ${this.containerName}`, {
                    stdio: 'pipe',
                    encoding: 'utf-8',
                    windowsHide: true
                }).trim();
                if (result === 'true') {
                    this.initialized = true;
                    console.log(`✅ yt-dlp Docker container is running`);
                    return true;
                }
            }
            catch {
                // Container doesn't exist or not running
            }
            // Try to start existing container
            try {
                (0, child_process_1.execSync)(`docker start ${this.containerName}`, {
                    stdio: 'pipe',
                    windowsHide: true
                });
                this.initialized = true;
                console.log(`✅ yt-dlp Docker container started`);
                return true;
            }
            catch {
                console.warn(`⚠️ yt-dlp container not found. Run: cd YtDlpLocalServer && docker-compose up -d`);
                return false;
            }
        }
        catch (error) {
            console.warn('⚠️ yt-dlp Docker setup failed:', error.message);
            return false;
        }
    }
    /**
     * Download video using yt-dlp via Docker
     * @param url - Video URL
     * @param tempDir - Temp directory path (optional)
     * @param options - Download options
     * @returns Path to downloaded file
     */
    async downloadVideo(url, tempDir, options = {}) {
        // Ensure temp directory exists
        const downloadDir = tempDir || this.tempDir;
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        const timestamp = Date.now();
        const outputFilename = `video_${timestamp}`;
        this.emit('stage', { stage: 'analyzing', message: 'Analyzing video with yt-dlp...' });
        // Get video info first to check duration and file size
        const maxDuration = config.MAX_VIDEO_DURATION_SECONDS || 600;
        const maxFileSizeMB = config.MAX_FILE_SIZE_MB || 100;
        try {
            const videoInfo = await this._getVideoInfo(url);
            if (videoInfo) {
                // Check duration
                if (videoInfo.duration && videoInfo.duration > maxDuration) {
                    const durationStr = this._formatDuration(videoInfo.duration);
                    const maxStr = this._formatDuration(maxDuration);
                    throw new Error(`DURATION_TOO_LONG:${durationStr} (max: ${maxStr})`);
                }
                // Check actual filesize from yt-dlp (if available)
                if (videoInfo.filesize) {
                    const fileSizeMB = videoInfo.filesize / (1024 * 1024);
                    if (fileSizeMB > maxFileSizeMB) {
                        console.log(`🚫 File size ${fileSizeMB.toFixed(1)}MB exceeds ${maxFileSizeMB}MB limit (pre-download check)`);
                        throw new Error(`FILE_TOO_LARGE:${fileSizeMB.toFixed(1)}MB`);
                    }
                    console.log(`📊 Pre-download size check: ${fileSizeMB.toFixed(1)}MB (limit: ${maxFileSizeMB}MB) ✓`);
                }
                else {
                    // Estimate file size if exact size not available
                    const quality = options.quality || '720';
                    const bitrateMultiplier = quality === '1080' ? 2.5 : (quality === '480' ? 0.5 : 1.2);
                    const estimatedSizeMB = (videoInfo.duration / 60) * bitrateMultiplier * 8;
                    // Block if estimated size is significantly over limit (2x to account for estimation error)
                    if (estimatedSizeMB > maxFileSizeMB * 2) {
                        console.log(`🚫 Estimated size ${estimatedSizeMB.toFixed(1)}MB exceeds ${maxFileSizeMB * 2}MB safety limit`);
                        throw new Error(`FILE_TOO_LARGE:~${estimatedSizeMB.toFixed(0)}MB (estimated)`);
                    }
                    else if (estimatedSizeMB > maxFileSizeMB) {
                        console.log(`⚠️ Estimated size ${estimatedSizeMB.toFixed(1)}MB may exceed ${maxFileSizeMB}MB limit, proceeding with caution...`);
                    }
                }
            }
        }
        catch (infoError) {
            // If it's our custom error, rethrow it
            const errorMsg = infoError.message;
            if (errorMsg.startsWith('DURATION_TOO_LONG') || errorMsg.startsWith('FILE_TOO_LARGE')) {
                throw infoError;
            }
            // Otherwise continue with download attempt
            console.warn('⚠️ Could not get video info, proceeding with download:', errorMsg);
        }
        return new Promise((resolve, reject) => {
            // Build quality format string
            const quality = options.quality || config.YTDLP_VIDEO_QUALITY || config.COBALT_VIDEO_QUALITY || '720';
            const formatString = `bestvideo[height=${quality}][ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=${quality}][ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}][vcodec!*=none]`;
            console.log(`🎯 yt-dlp quality requested: ${quality}p, format: ${formatString}`);
            // Use docker run with volume mount
            const dockerArgs = [
                'run', '--rm',
                '-v', `${downloadDir}:/downloads`,
                'jauderho/yt-dlp:latest',
                url,
                '-f', formatString,
                '-o', `/downloads/${outputFilename}.%(ext)s`,
                '--no-playlist',
                '--no-warnings',
                '--no-check-certificate',
                '--socket-timeout', '30',
                '--retries', String(config.network?.maxRetries || config.MAX_RETRIES || 5),
                '--fragment-retries', String(config.network?.fragmentRetries || config.FRAGMENT_RETRIES || 5),
                '--merge-output-format', 'mp4',
                '--newline',
            ];
            console.log(`📥 yt-dlp downloading (${quality}p): ${url.substring(0, 50)}...`);
            this.emit('stage', { stage: 'downloading', message: 'Downloading with yt-dlp...' });
            const dockerProcess = (0, child_process_1.spawn)('docker', dockerArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true
            });
            let lastProgressUpdate = 0;
            let errorData = '';
            dockerProcess.stdout.on('data', (data) => {
                const line = data.toString();
                // Parse progress from yt-dlp output
                const progressMatch = line.match(/(\d+\.?\d*)%/);
                if (progressMatch) {
                    const now = Date.now();
                    if (now - lastProgressUpdate >= 500) {
                        const percent = parseFloat(progressMatch[1]);
                        // Try to extract more info
                        const sizeMatch = line.match(/of\s+~?(\d+\.?\d*)(Mi?B|Ki?B|Gi?B)/i);
                        const speedMatch = line.match(/at\s+(\d+\.?\d*)(Mi?B|Ki?B|Gi?B)\/s/i);
                        const etaMatch = line.match(/ETA\s+(\d+:\d+|\d+:\d+:\d+)/);
                        let total = 0;
                        if (sizeMatch) {
                            const size = parseFloat(sizeMatch[1]);
                            const unit = sizeMatch[2].toLowerCase();
                            if (unit.includes('g'))
                                total = size * 1024 * 1024 * 1024;
                            else if (unit.includes('m'))
                                total = size * 1024 * 1024;
                            else if (unit.includes('k'))
                                total = size * 1024;
                        }
                        this.emit('progress', {
                            percent,
                            total,
                            downloaded: total * (percent / 100),
                            speed: speedMatch ? speedMatch[0] : null,
                            eta: etaMatch ? etaMatch[1] : null
                        });
                        lastProgressUpdate = now;
                    }
                }
            });
            dockerProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });
            dockerProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('❌ yt-dlp stderr:', errorData);
                    reject(new Error(this._parseYtDlpError(errorData) || `yt-dlp exited with code ${code}`));
                    return;
                }
                // Find the output file in the download directory
                const files = fs.readdirSync(downloadDir);
                const outputFile = files.find(f => f.startsWith(outputFilename));
                if (!outputFile) {
                    reject(new Error('yt-dlp did not produce an output file'));
                    return;
                }
                const finalPath = path.join(downloadDir, outputFile);
                const stats = fs.statSync(finalPath);
                const fileSizeInMB = stats.size / (1024 * 1024);
                if (stats.size === 0) {
                    fs.unlinkSync(finalPath);
                    reject(new Error('Downloaded file is empty'));
                    return;
                }
                console.log(`✅ yt-dlp downloaded ${fileSizeInMB.toFixed(2)} MB to ${finalPath}`);
                this.emit('complete', {
                    path: finalPath,
                    size: fileSizeInMB
                });
                resolve(finalPath);
            });
            dockerProcess.on('error', (err) => {
                reject(new Error(`Docker spawn error: ${err.message}`));
            });
        });
    }
    /**
     * Parse yt-dlp error messages into user-friendly messages
     */
    _parseYtDlpError(errorText) {
        if (!errorText)
            return null;
        const errorLower = errorText.toLowerCase();
        // Duration filter rejection
        if (errorLower.includes('does not pass filter') && errorLower.includes('duration')) {
            const maxMinutes = Math.floor((config.MAX_VIDEO_DURATION_SECONDS || 600) / 60);
            return `DURATION_TOO_LONG:over ${maxMinutes} minutes`;
        }
        if (errorLower.includes('does not pass filter')) {
            return 'DURATION_TOO_LONG:exceeds limit';
        }
        if (errorLower.includes('private video') || errorLower.includes('sign in')) {
            return 'This video is private or requires login';
        }
        if (errorLower.includes('copyright') || errorLower.includes('blocked')) {
            return 'This video is blocked due to copyright';
        }
        if (errorLower.includes('age') || errorLower.includes('confirm your age')) {
            return 'This video is age-restricted';
        }
        if (errorLower.includes('unavailable') || errorLower.includes('not available')) {
            return 'This video is unavailable';
        }
        if (errorLower.includes('live')) {
            return 'Cannot download live streams';
        }
        if (errorLower.includes('premieres') || errorLower.includes('scheduled')) {
            return 'This video has not premiered yet';
        }
        if (errorLower.includes('members only')) {
            return 'This video is for channel members only';
        }
        if (errorLower.includes('file size')) {
            return 'Video exceeds maximum file size limit';
        }
        if (errorLower.includes('unsupported url') || errorLower.includes('no video')) {
            return 'Unsupported URL or no video found';
        }
        // Extract the actual error message if possible
        const errorMatch = errorText.match(/ERROR:\s*(.+)/i);
        if (errorMatch) {
            return errorMatch[1].trim();
        }
        return null;
    }
    /**
     * Format duration in seconds to human readable string
     */
    _formatDuration(seconds) {
        if (!seconds || seconds < 0)
            return 'unknown';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    }
    /**
     * Get video info quickly (internal use)
     */
    async _getVideoInfo(url) {
        return new Promise((resolve, reject) => {
            try {
                const result = (0, child_process_1.execSync)(`docker run --rm jauderho/yt-dlp:latest --dump-single-json --no-warnings --no-check-certificate --no-playlist --skip-download "${url}"`, {
                    stdio: 'pipe',
                    encoding: 'utf-8',
                    timeout: 15000,
                    windowsHide: true
                });
                const info = JSON.parse(result);
                resolve({
                    title: info.title,
                    duration: info.duration,
                    filesize: info.filesize || info.filesize_approx,
                    uploader: info.uploader
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Get video info without downloading (via Docker)
     */
    async getVideoInfo(url) {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.initialized) {
            throw new Error('yt-dlp Docker container is not available');
        }
        return new Promise((resolve, reject) => {
            try {
                const result = (0, child_process_1.execSync)(`docker run --rm jauderho/yt-dlp:latest --dump-single-json --no-warnings --no-check-certificate --no-playlist --extractor-args "youtube:player_client=android,web" --user-agent "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36" --geo-bypass "${url}"`, {
                    stdio: 'pipe',
                    encoding: 'utf-8',
                    timeout: 30000,
                    windowsHide: true
                });
                const info = JSON.parse(result);
                resolve({
                    title: info.title,
                    duration: info.duration,
                    thumbnail: info.thumbnail,
                    uploader: info.uploader,
                    url: info.url || info.webpage_url
                });
            }
            catch (error) {
                reject(new Error(this._parseYtDlpError(error.message) || 'Failed to get video info'));
            }
        });
    }
}
exports.YtDlpService = YtDlpService;
// Create default instance
const ytDlpService = new YtDlpService();
exports.default = ytDlpService;
//# sourceMappingURL=YtDlpService.js.map