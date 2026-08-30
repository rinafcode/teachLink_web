/**
 * Unit tests for CORS failure detection.
 *
 * Covers:
 *  - isCorsError() utility (errorUtils)
 *  - classifyError() CORS path (errorUtils)
 *  - loggingErrorInterceptor branching (apiInterceptors)
 *  - errorReportingService CORS tagging (errorReporting)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() ensures these are available inside vi.mock() factories, which
// are hoisted to the top of the file before any const/let declarations.
// ---------------------------------------------------------------------------
const { mockLogError, mockLogDebug } = vi.hoisted(() => ({
  mockLogError: vi.fn(),
  mockLogDebug: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/logging', () => ({
  createLogger: () => ({
    debug: mockLogDebug,
    error: mockLogError,
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock tokenManager — required by apiInterceptors even though we only test the
// error interceptor path.
vi.mock('@/lib/auth/tokenManager', () => ({
  tokenManager: {
    getValidAccessToken: vi.fn().mockResolvedValue(null),
    refresh: vi.fn(),
    forceLogout: vi.fn(),
  },
}));

// Mock the api client — setupApiInterceptors() is called at module init time.
vi.mock('@/lib/api', () => ({
  apiClient: {
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
    addErrorInterceptor: vi.fn(),
  },
}));

// Mock app constants consumed by apiInterceptors.
vi.mock('@/constants/app.constants', () => ({
  API_TIMEOUT_UPLOAD: 60_000,
  API_TIMEOUT_DOWNLOAD: 60_000,
  API_TIMEOUT_SEARCH: 10_000,
  STORAGE_KEYS: { AUTH_TOKEN: 'auth_token' },
}));

// ---------------------------------------------------------------------------
// Imports — must happen after vi.mock() calls.
// ---------------------------------------------------------------------------
import { isCorsError, classifyError, ErrorType } from '@/utils/errorUtils';
import { loggingErrorInterceptor } from '@/lib/apiInterceptors';
import { errorReportingService } from '@/services/errorReporting';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a TypeError with the given message, optionally attaching a status. */
function makeTypeError(message: string, statusCode?: number): TypeError {
  const err = new TypeError(message);
  if (statusCode !== undefined) {
    (err as TypeError & { status: number }).status = statusCode;
  }
  return err;
}

// ---------------------------------------------------------------------------
// isCorsError()
// ---------------------------------------------------------------------------

describe('isCorsError()', () => {
  describe('returns true for CORS-like TypeErrors', () => {
    const corsMessages = [
      'Failed to fetch',
      'failed to fetch', // case-insensitive
      'NetworkError when attempting to fetch resource',
      'A cross-origin error occurred',
      'Access-Control-Allow-Origin header is missing',
      'Load failed', // Safari
      'CORS policy blocked the request',
    ];

    corsMessages.forEach((message) => {
      it(`detects: "${message}"`, () => {
        expect(isCorsError(makeTypeError(message))).toBe(true);
      });
    });
  });

  describe('returns false for non-CORS errors', () => {
    it('returns false for a generic Error (not TypeError)', () => {
      expect(isCorsError(new Error('Failed to fetch'))).toBe(false);
    });

    it('returns false for a TypeError with an attached HTTP status', () => {
      expect(isCorsError(makeTypeError('Failed to fetch', 403))).toBe(false);
    });

    it('returns false for a TypeError whose message does not match CORS patterns', () => {
      expect(isCorsError(new TypeError('Cannot read properties of undefined'))).toBe(false);
    });

    it('returns false for null', () => {
      expect(isCorsError(null)).toBe(false);
    });

    it('returns false for a plain string', () => {
      expect(isCorsError('Failed to fetch')).toBe(false);
    });

    it('returns false for an abort error', () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      expect(isCorsError(err)).toBe(false);
    });

    it('returns false for a TypeError with a statusCode property', () => {
      const err = new TypeError('Failed to fetch') as TypeError & { statusCode: number };
      err.statusCode = 0;
      expect(isCorsError(err)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// classifyError() — CORS path
// ---------------------------------------------------------------------------

describe('classifyError() CORS path', () => {
  it('classifies a "Failed to fetch" TypeError as CORS_BLOCKED', () => {
    const result = classifyError(makeTypeError('Failed to fetch'));
    expect(result.type).toBe(ErrorType.CORS_BLOCKED);
  });

  it('marks CORS errors as non-retryable', () => {
    const result = classifyError(makeTypeError('Failed to fetch'));
    expect(result.retryable).toBe(false);
  });

  it('provides a user-facing message for CORS errors', () => {
    const result = classifyError(makeTypeError('Failed to fetch'));
    expect(result.userMessage).toBeTruthy();
  });

  it('does NOT classify a "Failed to fetch" TypeError with a status as CORS_BLOCKED', () => {
    // Should fall through to NETWORK or another http-status path.
    const result = classifyError(makeTypeError('Failed to fetch', 403));
    expect(result.type).not.toBe(ErrorType.CORS_BLOCKED);
  });

  it('still classifies generic network TypeErrors as NETWORK (not CORS_BLOCKED)', () => {
    const err = new TypeError('fetch is not defined');
    const result = classifyError(err);
    // "fetch is not defined" does not match CORS patterns → NETWORK.
    expect(result.type).toBe(ErrorType.NETWORK);
  });
});

// ---------------------------------------------------------------------------
// loggingErrorInterceptor — apiInterceptors.ts
// ---------------------------------------------------------------------------

describe('loggingErrorInterceptor()', () => {
  beforeEach(() => {
    mockLogError.mockClear();
  });

  it('calls logger.error with CORS_BLOCKED context for a CORS TypeError', async () => {
    const corsError = makeTypeError('Failed to fetch');
    await loggingErrorInterceptor(corsError);

    expect(mockLogError).toHaveBeenCalledTimes(1);
    const [message, payload] = mockLogError.mock.calls[0];
    expect(message).toMatch(/cors/i);
    expect(payload.context.errorType).toBe(ErrorType.CORS_BLOCKED);
  });

  it('calls logger.error with the generic message for a non-CORS error', async () => {
    const genericError = new Error('500 Internal Server Error');
    await loggingErrorInterceptor(genericError as unknown as TypeError);

    expect(mockLogError).toHaveBeenCalledTimes(1);
    const [message] = mockLogError.mock.calls[0];
    // Should use the generic "API request failed" message, not the CORS one.
    expect(message).not.toMatch(/cors/i);
    expect(message).toMatch(/failed/i);
  });

  it('does not tag a network error that carries an HTTP status as CORS', async () => {
    const networkError = makeTypeError('Failed to fetch', 403);
    await loggingErrorInterceptor(networkError);

    expect(mockLogError).toHaveBeenCalledTimes(1);
    const [, payload] = mockLogError.mock.calls[0];
    // context should not have a CORS_BLOCKED errorType
    expect(payload?.context?.errorType).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ErrorReportingService — errorReporting.ts
// ---------------------------------------------------------------------------

describe('ErrorReportingService CORS handling', () => {
  beforeEach(() => {
    // Reset internal state between tests via the public API.
    errorReportingService.clearBreadcrumbs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a "corsBlocked" breadcrumb when reporting a CORS error', async () => {
    const corsError = makeTypeError('Failed to fetch');
    await errorReportingService.reportError(corsError);

    const breadcrumbs = errorReportingService.getBreadcrumbs();
    const corsEntry = breadcrumbs.find((b) => b.action === 'corsBlocked');
    expect(corsEntry).toBeDefined();
  });

  it('does NOT add a "corsBlocked" breadcrumb for a generic error', async () => {
    const genericError = new Error('Something went wrong');
    await errorReportingService.reportError(genericError);

    const breadcrumbs = errorReportingService.getBreadcrumbs();
    const corsEntry = breadcrumbs.find((b) => b.action === 'corsBlocked');
    expect(corsEntry).toBeUndefined();
  });

  it('sets corsBlocked:true in errorData for a CORS error', async () => {
    const corsError = makeTypeError('Failed to fetch');
    const report = await errorReportingService.reportError(corsError);

    expect(report.errorData.corsBlocked).toBe(true);
  });

  it('sets corsBlocked:false in errorData for a non-CORS error', async () => {
    const genericError = new Error('Something went wrong');
    const report = await errorReportingService.reportError(genericError);

    expect(report.errorData.corsBlocked).toBe(false);
  });

  it('sets errorData.type to CORS_BLOCKED for CORS errors', async () => {
    const corsError = makeTypeError('Failed to fetch');
    const report = await errorReportingService.reportError(corsError);

    expect(report.errorData.type).toBe(ErrorType.CORS_BLOCKED);
  });

  it('counts CORS breadcrumbs separately in getAnalyticsSummary()', async () => {
    const corsError = makeTypeError('Failed to fetch');
    await errorReportingService.reportError(corsError);
    await errorReportingService.reportError(corsError);
    await errorReportingService.reportError(new Error('generic'));

    const summary = errorReportingService.getAnalyticsSummary();
    expect(summary.corsBlockedCount).toBe(2);
  });

  it('includes CORS breadcrumbs in totalErrors count in getAnalyticsSummary()', async () => {
    const corsError = makeTypeError('Failed to fetch');
    await errorReportingService.reportError(corsError);

    const summary = errorReportingService.getAnalyticsSummary();
    expect(summary.totalErrors).toBeGreaterThanOrEqual(1);
    expect(summary.errorTypes['corsBlocked']).toBe(1);
  });

  it('corsBlockedCount is 0 when no CORS errors have been reported', () => {
    const summary = errorReportingService.getAnalyticsSummary();
    expect(summary.corsBlockedCount).toBe(0);
  });
});
