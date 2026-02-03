/**
 * Shared HTTP Client
 * Centralized axios wrapper with retry, timeout, and error handling
 * @module utils/common/httpClient
 */

import axios, { AxiosInstance, AxiosRequestConfig, Method, InternalAxiosRequestConfig } from 'axios';
// TYPES
interface HttpClientConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    userAgent?: string;
}

interface RequestOptions {
    timeout?: number;
    retries?: number;
    userAgent?: string;
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    responseType?: 'json' | 'text' | 'arraybuffer' | 'blob' | 'stream';
}

interface HttpResponse<T = unknown> {
    success: true;
    data: T;
    status: number;
    duration: number;
}

interface HttpError {
    success: false;
    error: string;
    errorCode: string;
    status?: number;
}

type HttpResult<T = unknown> = HttpResponse<T> | HttpError;

interface AxiosConfigWithMetadata extends InternalAxiosRequestConfig {
    metadata?: { startTime: number };
}

interface AxiosResponseWithDuration {
    config: AxiosConfigWithMetadata;
    duration?: number;
    data: unknown;
    status: number;
}
// CONFIGURATION
const DEFAULT_CONFIG: Required<HttpClientConfig> = {
    timeout: 15000,
    retries: 2,
    retryDelay: 1000,
    userAgent: 'alterGolden/2.0 (Discord Bot)'
};

export const USER_AGENTS = {
    default: 'alterGolden/2.0 (Discord Bot)',
    browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    pixiv: 'PixivAndroidApp/5.0.234 (Android 11; Pixel 5)',
    reddit: 'DiscordBot/1.0',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
} as const;
// HTTP CLIENT CLASS
/**
 * HTTP Client with retry and error handling
 */
export class HttpClient {
    private config: Required<HttpClientConfig>;
    private client: AxiosInstance;

    constructor(config: HttpClientConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.client = axios.create({
            timeout: this.config.timeout,
            headers: { 'User-Agent': this.config.userAgent }
        });
        
        // Request timing for performance monitoring
        this.client.interceptors.request.use((config: AxiosConfigWithMetadata) => {
            config.metadata = { startTime: Date.now() };
            return config;
        });
        
        this.client.interceptors.response.use((response) => {
            const config = response.config as AxiosConfigWithMetadata;
            (response as AxiosResponseWithDuration).duration = Date.now() - (config.metadata?.startTime || Date.now());
            return response;
        });
    }

    async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResult<T>> {
        return this._request<T>('get', url, null, options);
    }

    async post<T = unknown>(url: string, data?: unknown, options: RequestOptions = {}): Promise<HttpResult<T>> {
        return this._request<T>('post', url, data, options);
    }

    async put<T = unknown>(url: string, data?: unknown, options: RequestOptions = {}): Promise<HttpResult<T>> {
        return this._request<T>('put', url, data, options);
    }

    async delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResult<T>> {
        return this._request<T>('delete', url, null, options);
    }

    private async _request<T>(
        method: Method, 
        url: string, 
        data: unknown = null, 
        options: RequestOptions = {}
    ): Promise<HttpResult<T>> {
        const maxRetries = options.retries ?? this.config.retries;
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const config: AxiosRequestConfig = {
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

                if (data) config.data = data;

                const response = await this.client.request(config) as AxiosResponseWithDuration;
                return { 
                    success: true, 
                    data: response.data as T, 
                    status: response.status,
                    duration: response.duration || 0
                };

            } catch (error) {
                lastError = error as Error;
                const axiosError = error as { response?: { status?: number } };
                
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

        return this._handleError(lastError!);
    }

    private _handleError(error: Error & { response?: { status?: number }; code?: string }): HttpError {
        const status = error.response?.status;
        let errorMessage = 'Request failed. Please try again.';
        let errorCode = 'UNKNOWN_ERROR';

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out.';
            errorCode = 'TIMEOUT';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Service unavailable.';
            errorCode = 'SERVICE_UNAVAILABLE';
        } else if (status === 404) {
            errorMessage = 'Not found.';
            errorCode = 'NOT_FOUND';
        } else if (status === 403) {
            errorMessage = 'Access denied.';
            errorCode = 'FORBIDDEN';
        } else if (status === 429) {
            errorMessage = 'Rate limited. Please wait.';
            errorCode = 'RATE_LIMITED';
        } else if (status && status >= 500) {
            errorMessage = 'Server error.';
            errorCode = 'SERVER_ERROR';
        }

        return { success: false, error: errorMessage, errorCode, status };
    }
}
// PRE-CONFIGURED CLIENTS
/**
 * Pre-configured clients for common use cases
 */
export const clients: Record<string, HttpClient> = {
    default: new HttpClient(),
    browser: new HttpClient({ userAgent: USER_AGENTS.browser }),
    reddit: new HttpClient({ userAgent: USER_AGENTS.reddit }),
    pixiv: new HttpClient({ userAgent: USER_AGENTS.pixiv, timeout: 30000 })
};

/**
 * Get or create a client with specific config
 * @param name - Client name
 * @param config - Client config
 */
export function getClient(name: string, config: HttpClientConfig = {}): HttpClient {
    if (clients[name]) return clients[name];
    clients[name] = new HttpClient(config);
    return clients[name];
}
