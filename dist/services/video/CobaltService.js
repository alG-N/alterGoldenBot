"use strict";
/**
 * Cobalt Service
 * Enhanced Cobalt API client with progress tracking and event emission
 * @module services/video/CobaltService
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CobaltService = void 0;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const videoConfig = __importStar(require("../../config/features/video.js"));
// COBALT SERVICE CLASS
class CobaltService extends events_1.EventEmitter {
    apiUrls;
    currentApiIndex = 0;
    currentQuality = '720';
    constructor() {
        super();
        // Use configured Cobalt instances
        this.apiUrls = videoConfig.COBALT_INSTANCES || [
            'http://localhost:9000'
        ];
    }
    get apiUrl() {
        return this.apiUrls[this.currentApiIndex];
    }
    switchApi() {
        this.currentApiIndex = (this.currentApiIndex + 1) % this.apiUrls.length;
        console.log(`🔄 Switching to Cobalt API: ${this.apiUrl}`);
        this.emit('apiSwitch', { api: this.apiUrl });
    }
    async downloadVideo(url, tempDir, options = {}) {
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        const timestamp = Date.now();
        let lastError = null;
        this.currentQuality = options.quality || videoConfig.COBALT_VIDEO_QUALITY || '720';
        console.log(`🎯 Cobalt quality requested: ${this.currentQuality}p`);
        this.emit('stage', { stage: 'connecting', message: 'Connecting to Cobalt API...' });
        // Try each API instance
        for (let attempt = 0; attempt < this.apiUrls.length; attempt++) {
            try {
                this.emit('attempt', { attempt: attempt + 1, total: this.apiUrls.length, api: this.apiUrl });
                const result = await this._tryDownload(url, tempDir, timestamp);
                return result;
            }
            catch (error) {
                lastError = error;
                console.log(`⚠️ Cobalt failed: ${lastError.message}`);
                this.emit('error', { api: this.apiUrl, error: lastError.message });
                this.switchApi();
            }
        }
        throw lastError || new Error('All Cobalt API instances failed');
    }
    async _tryDownload(url, tempDir, timestamp) {
        this.emit('stage', { stage: 'analyzing', message: 'Analyzing video...' });
        const downloadInfo = await this._requestDownload(url);
        if (!downloadInfo.url) {
            throw new Error(downloadInfo.error || 'Failed to get download URL');
        }
        this.emit('stage', { stage: 'downloading', message: 'Downloading video file...' });
        const extension = downloadInfo.filename?.split('.').pop() || 'mp4';
        const outputPath = path_1.default.join(tempDir, `video_${timestamp}.${extension}`);
        await this._downloadFile(downloadInfo.url, outputPath);
        if (!fs_1.default.existsSync(outputPath)) {
            throw new Error('Video file not found after download');
        }
        const stats = fs_1.default.statSync(outputPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB === 0) {
            fs_1.default.unlinkSync(outputPath);
            throw new Error('Downloaded file is empty');
        }
        this.emit('complete', {
            path: outputPath,
            size: fileSizeInMB,
            filename: downloadInfo.filename
        });
        return outputPath;
    }
    _requestDownload(url) {
        return new Promise((resolve, reject) => {
            // Cobalt API format (v10+ compatible)
            const requestBody = JSON.stringify({
                url: url,
                videoQuality: this.currentQuality || videoConfig.COBALT_VIDEO_QUALITY || '720',
                filenameStyle: 'basic'
            });
            const apiUrlParsed = new URL(this.apiUrl);
            const isHttps = apiUrlParsed.protocol === 'https:';
            const protocol = isHttps ? https_1.default : http_1.default;
            const options = {
                hostname: apiUrlParsed.hostname,
                port: apiUrlParsed.port || (isHttps ? '443' : '80'),
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                    'User-Agent': videoConfig.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: videoConfig.network?.downloadTimeout || 120000
            };
            console.log(`🔗 Requesting from Cobalt: ${this.apiUrl}`);
            const req = protocol.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        // Check if response is HTML (error page)
                        if (data.trim().startsWith('<!') || data.trim().startsWith('<html')) {
                            reject(new Error('API returned HTML instead of JSON (might be blocked or down)'));
                            return;
                        }
                        const parsed = JSON.parse(data);
                        console.log(`📦 Cobalt response status: ${parsed.status}`);
                        // Handle error responses
                        if (parsed.status === 'error' || parsed.error) {
                            const errorCode = typeof parsed.error === 'object' ? parsed.error?.code : parsed.error;
                            const errorMsg = errorCode || parsed.text || 'Cobalt API error';
                            reject(new Error(errorMsg));
                            return;
                        }
                        // Handle different response formats
                        if (parsed.status === 'tunnel' || parsed.status === 'redirect' || parsed.status === 'stream') {
                            resolve({ url: parsed.url, filename: parsed.filename });
                        }
                        else if (parsed.status === 'picker' && parsed.picker?.length) {
                            // Multiple options available, pick video
                            const videoOption = parsed.picker.find(p => p.type === 'video') || parsed.picker[0];
                            if (videoOption?.url) {
                                resolve({ url: videoOption.url, filename: videoOption.filename });
                            }
                            else {
                                reject(new Error('No video found in picker response'));
                            }
                        }
                        else if (parsed.url) {
                            // Direct URL response
                            resolve({ url: parsed.url, filename: parsed.filename });
                        }
                        else {
                            reject(new Error(`Unexpected response: ${parsed.status || 'unknown'}`));
                        }
                    }
                    catch {
                        reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
                    }
                });
            });
            req.on('error', (err) => {
                reject(new Error(`Connection error: ${err.message}`));
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.write(requestBody);
            req.end();
        });
    }
    _downloadFile(url, outputPath, maxFileSizeMB = null) {
        return new Promise((resolve, reject) => {
            let redirectCount = 0;
            const maxRedirects = 10;
            let totalBytes = 0;
            let downloadedBytes = 0;
            let lastProgressUpdate = 0;
            const progressUpdateInterval = 500;
            const startTime = Date.now();
            const sizeLimit = maxFileSizeMB || videoConfig.MAX_FILE_SIZE_MB || 100;
            const download = (downloadUrl) => {
                if (redirectCount >= maxRedirects) {
                    reject(new Error('Too many redirects'));
                    return;
                }
                const urlObj = new URL(downloadUrl);
                const isHttps = urlObj.protocol === 'https:';
                const protocol = isHttps ? https_1.default : http_1.default;
                const options = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || (isHttps ? '443' : '80'),
                    path: urlObj.pathname + urlObj.search,
                    method: 'GET',
                    headers: {
                        'User-Agent': videoConfig.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: videoConfig.network?.downloadTimeout || 120000
                };
                const req = protocol.request(options, (response) => {
                    if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        redirectCount++;
                        let newUrl = response.headers.location;
                        if (!newUrl.startsWith('http')) {
                            newUrl = `${urlObj.protocol}//${urlObj.host}${newUrl}`;
                        }
                        download(newUrl);
                        return;
                    }
                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode}`));
                        return;
                    }
                    // Get content length for progress tracking
                    totalBytes = parseInt(response.headers['content-length'] || '0', 10) || 0;
                    // PRE-DOWNLOAD SIZE CHECK
                    if (totalBytes > 0) {
                        const fileSizeMB = totalBytes / (1024 * 1024);
                        if (fileSizeMB > sizeLimit) {
                            console.log(`🚫 File size ${fileSizeMB.toFixed(1)}MB exceeds ${sizeLimit}MB limit (pre-download check)`);
                            req.destroy();
                            reject(new Error(`FILE_TOO_LARGE:${fileSizeMB.toFixed(1)}MB`));
                            return;
                        }
                        console.log(`📊 Pre-download size check: ${fileSizeMB.toFixed(1)}MB (limit: ${sizeLimit}MB) ✓`);
                    }
                    const file = fs_1.default.createWriteStream(outputPath);
                    response.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        const now = Date.now();
                        if (now - lastProgressUpdate >= progressUpdateInterval) {
                            const elapsed = (now - startTime) / 1000;
                            const speed = downloadedBytes / elapsed;
                            const percent = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
                            const eta = totalBytes > 0 && speed > 0 ? (totalBytes - downloadedBytes) / speed : 0;
                            this.emit('progress', {
                                downloaded: downloadedBytes,
                                total: totalBytes,
                                percent: Math.min(percent, 100),
                                speed,
                                eta
                            });
                            lastProgressUpdate = now;
                        }
                    });
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        this.emit('progress', {
                            downloaded: downloadedBytes,
                            total: downloadedBytes,
                            percent: 100,
                            speed: 0,
                            eta: 0
                        });
                        console.log(`✅ Downloaded ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
                        resolve();
                    });
                    file.on('error', (err) => {
                        fs_1.default.unlink(outputPath, () => { });
                        reject(err);
                    });
                });
                req.on('error', (err) => {
                    fs_1.default.unlink(outputPath, () => { });
                    reject(err);
                });
                req.on('timeout', () => {
                    req.destroy();
                    fs_1.default.unlink(outputPath, () => { });
                    reject(new Error('Download timeout'));
                });
                req.end();
            };
            download(url);
        });
    }
    async getVideoInfo(url) {
        return this._requestDownload(url);
    }
}
exports.CobaltService = CobaltService;
// Export singleton
const cobaltService = new CobaltService();
exports.default = cobaltService;
//# sourceMappingURL=CobaltService.js.map