// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  API_TIMEOUT_UPLOAD,
  API_TIMEOUT_DOWNLOAD,
  API_TIMEOUT_SEARCH,
  STORAGE_KEYS,
} from '@/constants/app.constants';

import {
  apiClient,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RequestConfig,
} from './api';

import { createLogger } from '@/lib/logging';

declare global {
  interface Window {
    __APP_VERSION__?: string;
  }
}

const apiLogger = createLogger('api-client');

function safeBody(body: RequestConfig['body']): unknown {
  if (!body || typeof body !== 'string') return undefined;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export const loggingRequestInterceptor: RequestInterceptor = async (config) => {
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

export const loggingResponseInterceptor: ResponseInterceptor = async (response) => {
  if (process.env.NODE_ENV === 'development') {
    apiLogger.debug('API response received', {
      context: { response },
    });
  }
  return response;
};

export const loggingErrorInterceptor: ErrorInterceptor = async (error: Error) => {
  apiLogger.error('API request failed', { error });
};

export const authRefreshInterceptor: ErrorInterceptor = async (error: Error) => {
  const isUnauthorized = error.message?.includes('401') || error.message?.includes('Unauthorized');

  if (isUnauthorized && typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = '/login';
  }
};

export const timeoutInterceptor: RequestInterceptor = async (config) => {
  const urlPatterns: Array<{ pattern: RegExp; timeout: number }> = [
    { pattern: /\/upload/, timeout: API_TIMEOUT_UPLOAD },
    { pattern: /\/download/, timeout: API_TIMEOUT_DOWNLOAD },
    { pattern: /\/search/, timeout: API_TIMEOUT_SEARCH },
  ];

  const url = config.url;

  for (const { pattern, timeout } of urlPatterns) {
    if (pattern.test(url)) {
      config.timeout = timeout;
      break;
    }
  }

  return config;
};

export const headerEnhancementInterceptor: RequestInterceptor = async (config) => {
  const headers: Record<string, string> = (config.headers as Record<string, string>) || {};

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
