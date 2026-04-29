import {
  API_TIMEOUT_DEFAULT,
  MAX_RETRIES,
  RECONNECT_DELAY_MS,
  STORAGE_KEYS,
  API_CACHE_TTL_DEFAULT,
} from '@/constants/app.constants';
import { ApiError, parseApiError } from '@/utils/error-handler';
import { ErrorType, ErrorInfo } from '@/utils/errorUtils';

export type { ErrorInfo };

const DEFAULT_TIMEOUT_MS = API_TIMEOUT_DEFAULT;
const API_MAX_RETRIES = MAX_RETRIES;
const RETRY_DELAY_MS = RECONNECT_DELAY_MS;
const DEFAULT_TTL_MS = API_CACHE_TTL_DEFAULT;

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor<T = any> = (response: T) => Promise<T> | T;

/**
 * Error interceptor function type
 */
export type ErrorInterceptor = (error: Error) => Promise<void> | void;

/**
 * Request configuration for the API client
 */
export interface RequestConfig extends RequestInit {
  url: string;
  retries?: number;
  timeout?: number;
  useCache?: boolean;
  ttl?: number;
  _bypassCacheRead?: boolean; // Internal flag for SWR revalidation
}

/**
 * API Client configuration options
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  defaultTTL?: number;
}

function statusToErrorType(status: number): ErrorType {
  if (status === 401) return ErrorType.AUTHENTICATION;
  if (status === 403) return ErrorType.AUTHORIZATION;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status >= 500) return ErrorType.SERVER;
  return ErrorType.VALIDATION;
}

function statusToUserMessage(status: number): string {
  if (status === 401) return 'Please log in again.';
  if (status === 403) return 'You do not have permission to access this resource.';
  if (status === 404) return 'The resource you are looking for does not exist.';
  if (status >= 500) return 'The server is having trouble. Please try again later.';
  return 'There was a problem with your request.';
}

/**
 * Should retry on specific status codes
 */
function shouldRetry(status: number, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  // Retry on 408, 429, 500, 502, 503, 504
  return [408, 429, 500, 502, 503, 504].includes(status);
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
}

/**
 * Unified API Client with interceptors, retry logic, and SWR caching.
 *
 * Caching is opt-in per request via `useCache: true`.
 * Default TTL is 5 minutes; override per-request with `ttl` (ms).
 *
 * @example
 * // Cached GET – returns instantly on repeat calls within TTL
 * await apiClient.get('/api/courses', { useCache: true });
 *
 * // Custom TTL (1 minute)
 * await apiClient.get('/api/feed', { useCache: true, ttl: 60_000 });
 *
 * // Manually bust a specific cache entry
 * apiClient.invalidateCache('/api/courses');
 */
class ApiClientImpl {
  private config: Required<ApiClientConfig>;
  private cache = new Map<string, CacheEntry<any>>();
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor<unknown>[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || process.env.NEXT_PUBLIC_API_URL || '',
      timeout: config.timeout || DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries || API_MAX_RETRIES,
      retryDelay: config.retryDelay || RETRY_DELAY_MS,
      defaultTTL: config.defaultTTL || DEFAULT_TTL_MS,
    };
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor<unknown>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Apply all request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * Apply all response interceptors
   */
  private async applyResponseInterceptors<T>(response: T): Promise<T> {
    let processedResponse: any = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = (await interceptor(processedResponse)) as T;
    }
    return processedResponse as T;
  }

  /**
   * Apply all error interceptors
   */
  private async applyErrorInterceptors(error: Error): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
  }

  /**
   * Get authentication token
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Invalidate cache for a specific URL or clear all
   */
  invalidateCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async requestWithRetry<T>(config: RequestConfig, attempt = 1): Promise<T> {
    const token = this.getToken();
    const url = this.config.baseURL ? `${this.config.baseURL}${config.url}` : config.url;

    // Include token in cache key to prevent cross-user cache leakage (security best practice)
    const cacheKey = `${url}:${token || 'anonymous'}`;

    // Handle caching for GET requests
    if (config.method === 'GET' && config.useCache && !config._bypassCacheRead) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const ttl = config.ttl ?? this.config.defaultTTL;
        const isExpired = Date.now() - cached.timestamp > ttl;

        if (!isExpired) {
          return cached.data as T;
        }

        // Stale-While-Revalidate: Return stale data and revalidate in background
        // We set _bypassCacheRead: true so the background request skips the cache check
        // but still updates the cache when it completes.
        this.requestWithRetry<T>({ ...config, _bypassCacheRead: true }).catch((err) => {
          console.error('Background revalidation failed:', err);
        });
        return cached.data as T;
      }
    }

    const controller = new AbortController();
    const timeout = config.timeout || this.config.timeout;
    const maxRetries = config.retries ?? this.config.maxRetries;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config.headers as Record<string, string>),
    };

    try {
      const processedConfig = await this.applyRequestInterceptors({
        ...config,
        headers,
        signal: controller.signal,
      });

      const response = await fetch(url, processedConfig);
      clearTimeout(timer);

      if (!response.ok) {
        if (shouldRetry(response.status, attempt, maxRetries)) {
          const delay = getRetryDelay(attempt, this.config.retryDelay);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.requestWithRetry<T>(config, attempt + 1);
        }

        let message = response.statusText;
        try {
          const body = await response.json();
          message = body?.message ?? message;
        } catch {
          // ignore parse errors
        }
        throw new ApiError(
          statusToErrorType(response.status),
          message,
          statusToUserMessage(response.status),
          response.status,
        );
      }

      const data = (await response.json()) as T;

      const processedResponse = await this.applyResponseInterceptors(data);

      // Cache the response if it's a GET request and caching is enabled
      if (config.method === 'GET' && config.useCache) {
        this.cache.set(cacheKey, {
          data: processedResponse,
          timestamp: Date.now(),
        });
      }

      // Invalidate cache on mutations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method || '')) {
        this.invalidateCache(cacheKey);
      }

      return processedResponse;
    } catch (err) {
      clearTimeout(timer);

      const error = err instanceof Error ? err : new Error('Unknown error occurred');

      await this.applyErrorInterceptors(error);

      if (err instanceof ApiError) throw err;

      // Retry on network failures or internal timeouts (not on non-retriable errors)
      const isNetworkError = err instanceof TypeError;
      const isTimeout = timedOut && err instanceof DOMException && err.name === 'AbortError';
      if ((isNetworkError || isTimeout) && attempt < maxRetries) {
        const delay = getRetryDelay(attempt, this.config.retryDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(config, attempt + 1);
      }

      throw parseApiError(err);
    }
  }

  /**
   * GET request
   * @param useCache - Enable SWR caching for this request (default: false)
   * @param ttl      - Cache lifetime in ms (default: defaultTTL from config)
   */
  async get<T>(url: string, options?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'GET',
    });
  }

  /**
   * POST request – automatically invalidates the cache entry for this URL on success.
   */
  async post<T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestConfig, 'url' | 'method'>,
  ): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request – automatically invalidates the cache entry for this URL on success.
   */
  async patch<T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestConfig, 'url' | 'method'>,
  ): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request – automatically invalidates the cache entry for this URL on success.
   */
  async put<T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestConfig, 'url' | 'method'>,
  ): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request – automatically invalidates the cache entry for this URL on success.
   */
  async delete<T>(url: string, options?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClientImpl();

// Export types for external use
export type { ApiClientImpl };
