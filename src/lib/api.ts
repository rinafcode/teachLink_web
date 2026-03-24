import { ApiError, parseApiError } from '@/utils/error-handler';
import { ErrorType, ErrorInfo } from '@/utils/errorUtils';

export type { ErrorInfo };

const DEFAULT_TIMEOUT_MS = 10_000;

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

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
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

    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof ApiError) throw err;
    throw parseApiError(err);
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
