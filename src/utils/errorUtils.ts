/**
 * Error utility functions for classification, formatting, and retry logic
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
  userMessage: string;
  actionSuggestion?: string;
}

/**
 * Classify an error based on its type and properties
 */
export function classifyError(error: any): ErrorInfo {
  const now = Date.now();

  // Check if error is a network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      timestamp: now,
      retryable: true,
      userMessage: 'Unable to connect. Please check your internet connection.',
      actionSuggestion: 'Retry connection',
    };
  }

  // Check for timeout
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: error.message || 'Request timeout',
      timestamp: now,
      retryable: true,
      userMessage: 'The request took too long. Please try again.',
      actionSuggestion: 'Retry',
    };
  }

  // Check if offline
  if (!navigator.onLine) {
    return {
      type: ErrorType.OFFLINE,
      message: 'Application is offline',
      timestamp: now,
      retryable: true,
      userMessage: 'You are offline. Features will be limited.',
      actionSuggestion: 'Check connection',
    };
  }

  // Check for HTTP response errors
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    return classifyHttpError(statusCode, error.message || '', now);
  }

  // Check for validation errors
  if (error.name === 'ValidationError' || error.type === ErrorType.VALIDATION) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      details: error.details,
      timestamp: now,
      retryable: false,
      userMessage: 'Please check your input and try again.',
      actionSuggestion: 'Review and correct your input',
    };
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || String(error),
    details: { originalError: error },
    timestamp: now,
    retryable: true,
    userMessage: 'Something went wrong. Please try again.',
    actionSuggestion: 'Try again',
  };
}

/**
 * Classify HTTP errors by status code
 */
function classifyHttpError(statusCode: number, message: string, timestamp: number): ErrorInfo {
  if (statusCode === 401) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: message || 'Authentication failed',
      statusCode,
      timestamp,
      retryable: false,
      userMessage: 'Please log in again.',
      actionSuggestion: 'Log in',
    };
  }

  if (statusCode === 403) {
    return {
      type: ErrorType.AUTHORIZATION,
      message: message || 'Access denied',
      statusCode,
      timestamp,
      retryable: false,
      userMessage: 'You do not have permission to access this resource.',
      actionSuggestion: 'Contact support',
    };
  }

  if (statusCode === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      message: message || 'Resource not found',
      statusCode,
      timestamp,
      retryable: false,
      userMessage: 'The resource you are looking for does not exist.',
      actionSuggestion: 'Go back',
    };
  }

  if (statusCode >= 500) {
    return {
      type: ErrorType.SERVER,
      message: message || `Server error (${statusCode})`,
      statusCode,
      timestamp,
      retryable: true,
      userMessage: 'The server is having trouble. Please try again later.',
      actionSuggestion: 'Try again later',
    };
  }

  if (statusCode >= 400) {
    return {
      type: ErrorType.VALIDATION,
      message: message || `Client error (${statusCode})`,
      statusCode,
      timestamp,
      retryable: false,
      userMessage: 'There was a problem with your request.',
      actionSuggestion: 'Try again',
    };
  }

  // Network error
  return {
    type: ErrorType.NETWORK,
    message: message || 'Network error',
    statusCode,
    timestamp,
    retryable: true,
    userMessage: 'Network connection issue. Please try again.',
    actionSuggestion: 'Retry',
  };
}

/**
 * Determine if an error is retryable
 */
export function isRetryable(error: any): boolean {
  const errorInfo = classifyError(error);
  return errorInfo.retryable;
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const errorInfo = classifyError(error);
  return errorInfo.userMessage;
}

/**
 * Get an action suggestion for the error
 */
export function getActionSuggestion(error: any): string | undefined {
  const errorInfo = classifyError(error);
  return errorInfo.actionSuggestion;
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
  }
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffFactor = 2,
  } = options || {};

  let lastError: any;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if not retryable or on last attempt
      if (!isRetryable(error) || attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const actualDelay = Math.min(delayMs, maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, actualDelay));

      // Increase delay for next attempt
      delayMs *= backoffFactor;
    }
  }

  throw lastError;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: any): Record<string, any> {
  const errorInfo = classifyError(error);
  return {
    type: errorInfo.type,
    message: errorInfo.message,
    statusCode: errorInfo.statusCode,
    timestamp: new Date(errorInfo.timestamp).toISOString(),
    retryable: errorInfo.retryable,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    details: errorInfo.details,
  };
}

/**
 * Create a custom error with type info
 */
export class TypedError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: Record<string, any>,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TypedError';
  }
}
