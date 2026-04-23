import { apiClient, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from './api';
import { RequestConfig } from './api';

declare global {
  interface Window {
    __APP_VERSION__?: string;
  }
}

/**
 * Request logging interceptor - logs outgoing requests
 */
export const loggingRequestInterceptor: RequestInterceptor = async (config: RequestConfig) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Request] ${config.method} ${config.url}`, {
      headers: config.headers,
      body: config.body ? JSON.parse(config.body as string) : undefined,
    });
  }
  return config;
};

/**
 * Response logging interceptor - logs successful responses
 */
export const loggingResponseInterceptor: ResponseInterceptor = async (response: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Response]', response);
  }
  return response;
};

/**
 * Error logging interceptor - logs errors
 */
export const loggingErrorInterceptor: ErrorInterceptor = async (error: Error) => {
  console.error('[API Error]', error.message, error);
};

/**
 * Authentication refresh interceptor - handles 401 and refreshes token
 */
export const authRefreshInterceptor: ErrorInterceptor = async (error: Error) => {
  // Only handle authentication errors
  if (error.message && error.message.includes('401')) {
    // Clear invalid token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Optionally redirect to login
      window.location.href = '/login';
    }
  }
};

/**
 * Request timeout customization interceptor
 * Allows per-request timeout overrides
 */
export const timeoutInterceptor: RequestInterceptor = async (config: RequestConfig) => {
  // You can customize timeout per endpoint
  const urlPatterns: Array<{ pattern: string | RegExp; timeout: number }> = [
    { pattern: /\/upload/, timeout: 60000 }, // 60s for uploads
    { pattern: /\/download/, timeout: 60000 }, // 60s for downloads
    { pattern: /\/search/, timeout: 15000 }, // 15s for search
  ];

  const url = config.url;
  for (const { pattern, timeout } of urlPatterns) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    if (regex.test(url)) {
      config.timeout = timeout;
      break;
    }
  }

  return config;
};

/**
 * Request header enhancement interceptor
 * Adds custom headers to all requests
 */
export const headerEnhancementInterceptor: RequestInterceptor = async (config: RequestConfig) => {
  const headers = (config.headers as Record<string, string>) || {};

  // Add request ID for tracing
  headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add client version if available
  if (typeof window !== 'undefined' && window.__APP_VERSION__) {
    headers['X-Client-Version'] = window.__APP_VERSION__;
  }

  config.headers = headers;
  return config;
};

/**
 * Setup all default interceptors
 * Call this during app initialization
 */
export function setupApiInterceptors(): void {
  // Add request interceptors
  apiClient.addRequestInterceptor(loggingRequestInterceptor);
  apiClient.addRequestInterceptor(timeoutInterceptor);
  apiClient.addRequestInterceptor(headerEnhancementInterceptor);

  // Add response interceptors
  apiClient.addResponseInterceptor(loggingResponseInterceptor);

  // Add error interceptors
  apiClient.addErrorInterceptor(loggingErrorInterceptor);
  apiClient.addErrorInterceptor(authRefreshInterceptor);
}
