import { ApiError, parseApiError } from '@/utils/error-handler';
import { ErrorType, ErrorInfo } from '@/utils/errorUtils';

export type { ErrorInfo };

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor<T = unknown> = (response: T) => Promise<T> | T;

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
}

/**
 * API Client configuration options
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
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
 * Unified API Client with interceptors and retry logic
 */
class ApiClientImpl {
  private config: Required<ApiClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries || MAX_RETRIES,
      retryDelay: config.retryDelay || RETRY_DELAY_MS,
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
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
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
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = (await interceptor(processedResponse)) as T;
    }
    return processedResponse;
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
    return localStorage.getItem('token');
  }

  /**
   * Make HTTP request with retry logic
   */
  private async requestWithRetry<T>(config: RequestConfig, attempt = 1): Promise<T> {
    const controller = new AbortController();
    const timeout = config.timeout || this.config.timeout;
    const timer = setTimeout(() => controller.abort(), timeout);
    const maxRetries = config.retries ?? this.config.maxRetries;

    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config.headers as Record<string, string>),
    };

    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors({
        ...config,
        headers,
        signal: controller.signal,
      });

      const url = this.config.baseURL ? `${this.config.baseURL}${config.url}` : config.url;

      const response = await fetch(url, processedConfig);
      clearTimeout(timer);

      if (!response.ok) {
        // Check if we should retry
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

      // Apply response interceptors
      const processedResponse = await this.applyResponseInterceptors(data);
      return processedResponse;
    } catch (err) {
      clearTimeout(timer);

      const error = err instanceof Error ? err : new Error('Unknown error occurred');

      // Apply error interceptors
      await this.applyErrorInterceptors(error);

      if (err instanceof ApiError) throw err;
      throw parseApiError(err);
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>({
      ...options,
      url,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
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
  async patch<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
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
  async put<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
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
  async delete<T>(url: string, options?: RequestInit): Promise<T> {
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
