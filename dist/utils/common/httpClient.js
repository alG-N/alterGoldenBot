"use strict";
/**
 * Shared HTTP Client
 * Centralized axios wrapper with retry, timeout, and error handling
 * @module utils/common/httpClient
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clients = exports.HttpClient = exports.USER_AGENTS = void 0;
exports.getClient = getClient;
const axios_1 = __importDefault(require("axios"));
// CONFIGURATION
const DEFAULT_CONFIG = {
    timeout: 15000,
    retries: 2,
    retryDelay: 1000,
    userAgent: 'alterGolden/2.0 (Discord Bot)'
};
exports.USER_AGENTS = {
    default: 'alterGolden/2.0 (Discord Bot)',
    browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    pixiv: 'PixivAndroidApp/5.0.234 (Android 11; Pixel 5)',
    reddit: 'DiscordBot/1.0',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
};
// HTTP CLIENT CLASS
/**
 * HTTP Client with retry and error handling
 */
class HttpClient {
    config;
    client;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.client = axios_1.default.create({
            timeout: this.config.timeout,
            headers: { 'User-Agent': this.config.userAgent }
        });
        // Request timing for performance monitoring
        this.client.interceptors.request.use((config) => {
            config.metadata = { startTime: Date.now() };
            return config;
        });
        this.client.interceptors.response.use((response) => {
            const config = response.config;
            response.duration = Date.now() - (config.metadata?.startTime || Date.now());
            return response;
        });
    }
    async get(url, options = {}) {
        return this._request('get', url, null, options);
    }
    async post(url, data, options = {}) {
        return this._request('post', url, data, options);
    }
    async put(url, data, options = {}) {
        return this._request('put', url, data, options);
    }
    async delete(url, options = {}) {
        return this._request('delete', url, null, options);
    }
    async _request(method, url, data = null, options = {}) {
        const maxRetries = options.retries ?? this.config.retries;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const config = {
                    method,
                    url,
                    timeout: options.timeout ?? this.config.timeout,
                    headers: {
                        'User-Agent': options.userAgent ?? this.config.userAgent,
                        ...options.headers
                    },
                    params: options.params,
                    responseType: options.responseType || 'json'
                };
                if (data)
                    config.data = data;
                const response = await this.client.request(config);
                return {
                    success: true,
                    data: response.data,
                    status: response.status,
                    duration: response.duration || 0
                };
            }
            catch (error) {
                lastError = error;
                const axiosError = error;
                // Don't retry client errors (except rate limits)
                if (axiosError.response?.status &&
                    axiosError.response.status >= 400 &&
                    axiosError.response.status < 500 &&
                    axiosError.response.status !== 429) {
                    break;
                }
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, this.config.retryDelay * (attempt + 1)));
                }
            }
        }
        return this._handleError(lastError);
    }
    _handleError(error) {
        const status = error.response?.status;
        let errorMessage = 'Request failed. Please try again.';
        let errorCode = 'UNKNOWN_ERROR';
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out.';
            errorCode = 'TIMEOUT';
        }
        else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Service unavailable.';
            errorCode = 'SERVICE_UNAVAILABLE';
        }
        else if (status === 404) {
            errorMessage = 'Not found.';
            errorCode = 'NOT_FOUND';
        }
        else if (status === 403) {
            errorMessage = 'Access denied.';
            errorCode = 'FORBIDDEN';
        }
        else if (status === 429) {
            errorMessage = 'Rate limited. Please wait.';
            errorCode = 'RATE_LIMITED';
        }
        else if (status && status >= 500) {
            errorMessage = 'Server error.';
            errorCode = 'SERVER_ERROR';
        }
        return { success: false, error: errorMessage, errorCode, status };
    }
}
exports.HttpClient = HttpClient;
// PRE-CONFIGURED CLIENTS
/**
 * Pre-configured clients for common use cases
 */
exports.clients = {
    default: new HttpClient(),
    browser: new HttpClient({ userAgent: exports.USER_AGENTS.browser }),
    reddit: new HttpClient({ userAgent: exports.USER_AGENTS.reddit }),
    pixiv: new HttpClient({ userAgent: exports.USER_AGENTS.pixiv, timeout: 30000 })
};
/**
 * Get or create a client with specific config
 * @param name - Client name
 * @param config - Client config
 */
function getClient(name, config = {}) {
    if (exports.clients[name])
        return exports.clients[name];
    exports.clients[name] = new HttpClient(config);
    return exports.clients[name];
}
//# sourceMappingURL=httpClient.js.map