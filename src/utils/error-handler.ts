import { ErrorType, ErrorInfo } from './errorUtils';

export type { ErrorType, ErrorInfo };

export function parseApiError(error: unknown): ErrorInfo {
  const now = Date.now();

  // Network / fetch failure
  if (error instanceof TypeError) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      timestamp: now,
      retryable: true,
      userMessage: 'Unable to connect. Please check your internet connection.',
      actionSuggestion: 'Retry connection',
    };
  }

  // Abort / timeout
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      type: ErrorType.TIMEOUT,
      message: 'Request timed out',
      timestamp: now,
      retryable: true,
      userMessage: 'The request took too long. Please try again.',
      actionSuggestion: 'Retry',
    };
  }

  // ApiError thrown by the client
  if (error instanceof ApiError) {
    return {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: now,
      retryable: error.statusCode ? error.statusCode >= 500 : true,
      userMessage: error.userMessage,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : String(error),
    timestamp: now,
    retryable: true,
    userMessage: 'Something went wrong. Please try again.',
    actionSuggestion: 'Try again',
  };
}

export class ApiError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly userMessage: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
