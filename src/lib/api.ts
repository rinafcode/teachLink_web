// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { z } from 'zod';
import { validateData } from './validation/validator';
import { ApiError, parseApiError } from '@/utils/error-handler';
import { ErrorType, ErrorInfo } from '@/utils/errorUtils';
import { API_VERSION_HEADER, DEFAULT_API_VERSION, getVersionedApiPath } from './apiVersioning';
import {
  API_TIMEOUT_DEFAULT,
  MAX_RETRIES,
  RECONNECT_DELAY_MS,
  STORAGE_KEYS,
  API_CACHE_TTL_DEFAULT,
} from '@/constants/app.constants';
import { logContextStorage } from './logging/context';

export type { ErrorInfo };

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = API_TIMEOUT_DEFAULT;
const API_MAX_RETRIES = MAX_RETRIES;
const RETRY_DELAY_MS = RECONNECT_DELAY_MS;
const DEFAULT_TTL_MS = API_CACHE_TTL_DEFAULT;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
export type ResponseInterceptor<T = any> = (response: T) => Promise<T> | T;
export type ErrorInterceptor = (error: Error) => Promise<void> | void;

export interface RequestConfig extends RequestInit {
  url: string;
  retries?: number;
  timeout?: number;
  schema?: z.ZodSchema;
  useCache?: boolean;
  _bypassCacheRead?: boolean;
  ttl?: number;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  apiVersion?: string;
  defaultTTL?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusToErrorType(status: number): ErrorType {
  if (status === 401) return ErrorType.AUTHENTICATION;
  if (status === 403) return ErrorType.AUTHORIZATION;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status >= 500) return ErrorType.SERVER;
  return ErrorType.VALIDATION;
}

function statusToUserMessage(status: number): string {
  if (status === 401) return 'Please log in again.';
  if (status === 403) return 'You do not have permission.';
  if (status === 404) return 'Resource not found.';
  if (status >= 500) return 'Server error. Try again later.';
  return 'Request failed.';
}

function shouldRetry(status: number, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  return [408, 429, 500, 502, 503, 504].includes(status);
}

function getRetryDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
}

// ---------------------------------------------------------------------------
// API CLIENT
// ---------------------------------------------------------------------------

class ApiClientImpl {
  private config: Required<ApiClientConfig>;
  private cache = new Map<string, CacheEntry<any>>();
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || process.env.NEXT_PUBLIC_API_URL || '',
      timeout: config.timeout || DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries || API_MAX_RETRIES,
      retryDelay: config.retryDelay || RETRY_DELAY_MS,
      apiVersion: config.apiVersion || DEFAULT_API_VERSION,
      defaultTTL: config.defaultTTL || DEFAULT_TTL_MS,
    };
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  invalidateCache(url?: string) {
    if (url) this.cache.delete(url);
    else this.cache.clear();
  }

  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  private async requestWithRetry<T>(config: RequestConfig, attempt = 1): Promise<T> {
    const token = this.getToken();

    const baseURL = this.config.baseURL.replace(/\/+$/, '');
    const resolvedUrl = getVersionedApiPath(config.url);
    const url = baseURL ? `${baseURL}${resolvedUrl}` : resolvedUrl;

    const cacheKey = `${url}:${token || 'anon'}`;

    // CACHE
    if (config.method === 'GET' && config.useCache && !config._bypassCacheRead) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const ttl = config.ttl ?? this.config.defaultTTL;
        if (Date.now() - cached.timestamp < ttl) return cached.data;

        this.requestWithRetry<T>({ ...config, _bypassCacheRead: true }).catch(() => {});
        return cached.data;
      }
    }

    const controller = new AbortController();
    const timeout = config.timeout || this.config.timeout;

    const timer = setTimeout(() => controller.abort(), timeout);

    const contextStore = logContextStorage.getStore();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config.headers || {}),
      [API_VERSION_HEADER]: this.config.apiVersion,
      ...(contextStore?.traceId ? { 'x-trace-id': contextStore.traceId } : {}),
    };

    try {
      const response = await fetch(url, {
        ...config,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (shouldRetry(response.status, attempt, this.config.maxRetries)) {
          await new Promise((r) => setTimeout(r, getRetryDelay(attempt, this.config.retryDelay)));
          return this.requestWithRetry<T>(config, attempt + 1);
        }

        const body = await response.json().catch(() => ({}));

        throw new ApiError(
          statusToErrorType(response.status),
          body?.message || response.statusText,
          statusToUserMessage(response.status),
          response.status,
        );
      }

      const data = await response.json();

      if (config.method === 'GET' && config.useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method || '')) {
        this.invalidateCache(cacheKey);
      }

      return data;
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof ApiError) throw err;

      throw parseApiError(err);
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'GET',
    });
  }

  /**
   * POST request
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
   * PATCH request
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
   * PUT request
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
   * DELETE request
   */
  async delete<T>(url: string, options?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'DELETE',
    });
  }
}

// Singleton
export const apiClient = new ApiClientImpl();
export type { ApiClientImpl };