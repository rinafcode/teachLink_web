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
  RATE_LIMIT = 'RATE_LIMIT',
  /**
   * A cross-origin request was blocked by the browser's CORS policy.
   * These arrive as opaque TypeErrors with no HTTP status — keep them
   * separate from generic NETWORK failures so backend / infra teams can
   * triage misconfigured CORS headers independently.
   */
  CORS_BLOCKED = 'CORS_BLOCKED',
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
 * Returns `true` when an error is most likely a browser CORS block.
 *
 * CORS violations are surfaced by the browser as an opaque `TypeError` with
 * no HTTP status code.  We detect them by checking for:
 *   1. A `TypeError` (the only error type the Fetch API emits for CORS)
 *   2. A message pattern that matches known browser CORS wording
 *   3. No attached HTTP status (rules out genuine server 4xx/5xx errors)
 *
 * This is deliberately conservative: if the message doesn't match we fall
 * back to the generic NETWORK type rather than produce a false positive.
 */
export function isCorsError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;

  // Browsers deliberately give only a generic message for CORS failures.
  // The exact wording varies by browser but all contain one of these tokens.
  const CORS_MESSAGE_PATTERNS = [
    /cors/i,
    /cross.?origin/i,
    /access.?control/i,
    /failed to fetch/i,
    /networkerror/i,
    /load failed/i, // Safari
  ];

  const message = error.message ?? '';
  const matchesCorsPattern = CORS_MESSAGE_PATTERNS.some((re) => re.test(message));

  // A genuine network error or abort has no status; CORS blocks also have none.
  // We narrow further by requiring the message to match — this avoids mis-tagging
  // plain "fetch is not defined" TypeErrors in server-side environments.
  const hasNoStatus =
    !('status' in (error as object)) && !('statusCode' in (error as object));

  return matchesCorsPattern && hasNoStatus;
}

export function classifyError(error: any): ErrorInfo {
  const now = Date.now();
  const isValidationTypedError =
    error &&
    typeof error === 'object' &&
    'type' in error &&
    (error as { type?: ErrorType }).type === ErrorType.VALIDATION;

  // Check for CORS blocks before generic network errors: both arrive as
  // TypeErrors but they require different remediation actions.
  if (isCorsError(error)) {
    return {
      type: ErrorType.CORS_BLOCKED,
      message: error.message,
      timestamp: now,
      retryable: false, // Retrying won't help — the server config must change.
      userMessage: 'The request was blocked by a CORS policy. Please contact support.',
      actionSuggestion: 'Contact support or check CORS configuration',
    };
  }

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

  if (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message?.includes('timeout'))
  ) {
    return {
      type: ErrorType.TIMEOUT,
      message: error.message || 'Request timeout',
      timestamp: now,
      retryable: true,
      userMessage: 'The request took too long. Please try again.',
      actionSuggestion: 'Retry',
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      type: ErrorType.OFFLINE,
      message: 'Application is offline',
      timestamp: now,
      retryable: true,
      userMessage: 'You are offline. Features will be limited.',
      actionSuggestion: 'Check connection',
    };
  }

  if (error && typeof error === 'object' && ('status' in error || 'statusCode' in error)) {
    const statusCode =
      (error as { status?: number; statusCode?: number }).status ||
      (error as { status?: number; statusCode?: number }).statusCode;
    const message = (error as { message?: string }).message || '';
    return classifyHttpError(statusCode as number, message, now);
  }

  if ((error instanceof Error && error.name === 'ValidationError') || isValidationTypedError) {
    return {
      type: ErrorType.VALIDATION,
      message: (error as { message?: string }).message || 'Validation error',
      details: (error as { details?: Record<string, unknown> }).details,
      timestamp: now,
      retryable: false,
      userMessage: 'Please check your input and try again.',
      actionSuggestion: 'Review and correct your input',
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || String(error),
    details: { originalError: error },
    timestamp: now,
    retryable: true,
    userMessage: 'Something went wrong. Please try again.',
    actionSuggestion: 'Try again',
  };
}

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

  if (statusCode === 429) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: message || 'Rate limit exceeded',
      statusCode,
      timestamp,
      retryable: true,
      userMessage: 'Too many requests. Please wait before trying again.',
      actionSuggestion: 'Wait and retry',
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

export function isRetryable(error: any): boolean {
  const errorInfo = classifyError(error);
  return errorInfo.retryable;
}

export function getUserFriendlyMessage(error: any): string {
  const errorInfo = classifyError(error);
  return errorInfo.userMessage;
}

export function getActionSuggestion(error: any): string | undefined {
  const errorInfo = classifyError(error);
  return errorInfo.actionSuggestion;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    jitterMs?: number;
  },
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffFactor = 2,
    jitterMs = 500,
  } = options || {};

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === maxAttempts) {
        throw error;
      }

      const actualDelay = Math.min(
        initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * jitterMs,
        maxDelayMs,
      );
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}

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

export class TypedError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: Record<string, any>,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'TypedError';
  }
}
