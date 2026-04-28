import { apiClient, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from './api';
import { RequestConfig } from './api';
import { createLogger } from '@/lib/logging';

declare global {
  interface Window {
    __APP_VERSION__?: string;
  }
}

const apiLogger = createLogger('api-client');

function safeBody(body: RequestConfig['body']): unknown {
  if (!body || typeof body !== 'string') {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export const loggingRequestInterceptor: RequestInterceptor = async (config: RequestConfig) => {
  if (process.env.NODE_ENV === 'development') {
    apiLogger.debug('API request started', {
      context: {
        method: config.method,
        url: config.url,
        headers: config.headers as Record<string, unknown>,
        body: safeBody(config.body),
      },
    });
  }
  return config;
};

export const loggingResponseInterceptor: ResponseInterceptor = async (response: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    apiLogger.debug('API response received', {
      context: {
        response,
      },
    });
  }
  return response;
};

export const loggingErrorInterceptor: ErrorInterceptor = async (error: Error) => {
  apiLogger.error('API request failed', { error });
};

export const authRefreshInterceptor: ErrorInterceptor = async (error: Error) => {
  if (error.message && error.message.includes('401')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
};

export const timeoutInterceptor: RequestInterceptor = async (config: RequestConfig) => {
  const urlPatterns: Array<{ pattern: string | RegExp; timeout: number }> = [
    { pattern: /\/upload/, timeout: 60000 },
    { pattern: /\/download/, timeout: 60000 },
    { pattern: /\/search/, timeout: 15000 },
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

export const headerEnhancementInterceptor: RequestInterceptor = async (config: RequestConfig) => {
  const headers = (config.headers as Record<string, string>) || {};

  headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  if (typeof window !== 'undefined' && window.__APP_VERSION__) {
    headers['X-Client-Version'] = window.__APP_VERSION__;
  }

  config.headers = headers;
  return config;
};

export function setupApiInterceptors(): void {
  apiClient.addRequestInterceptor(loggingRequestInterceptor);
  apiClient.addRequestInterceptor(timeoutInterceptor);
  apiClient.addRequestInterceptor(headerEnhancementInterceptor);
  apiClient.addResponseInterceptor(loggingResponseInterceptor);
  apiClient.addErrorInterceptor(loggingErrorInterceptor);
  apiClient.addErrorInterceptor(authRefreshInterceptor);
}
