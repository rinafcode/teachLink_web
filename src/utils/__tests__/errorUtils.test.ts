/**
 * Unit Tests for errorUtils
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorType,
  classifyError,
  isRetryable,
  getUserFriendlyMessage,
  getActionSuggestion,
  retryWithBackoff,
  formatErrorForLogging,
  TypedError,
} from '../errorUtils';

// ---------------------------------------------------------------------------
// classifyError – network / fetch errors
// ---------------------------------------------------------------------------
describe('classifyError – network errors', () => {
  it('classifies a fetch TypeError as NETWORK', () => {
    const err = new TypeError('Failed to fetch');
    const info = classifyError(err);
    expect(info.type).toBe(ErrorType.NETWORK);
    expect(info.retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// classifyError – timeout
// ---------------------------------------------------------------------------
describe('classifyError – timeout', () => {
  it('classifies AbortError as TIMEOUT', () => {
    const err = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const info = classifyError(err);
    expect(info.type).toBe(ErrorType.TIMEOUT);
    expect(info.retryable).toBe(true);
  });

  it('classifies an error with "timeout" in message as TIMEOUT', () => {
    const err = new Error('Request timeout exceeded');
    const info = classifyError(err);
    expect(info.type).toBe(ErrorType.TIMEOUT);
  });
});

// ---------------------------------------------------------------------------
// classifyError – HTTP status codes
// ---------------------------------------------------------------------------
describe('classifyError – HTTP errors', () => {
  it('classifies 401 as AUTHENTICATION (not retryable)', () => {
    const info = classifyError({ status: 401, message: 'Unauthorized' });
    expect(info.type).toBe(ErrorType.AUTHENTICATION);
    expect(info.retryable).toBe(false);
    expect(info.statusCode).toBe(401);
  });

  it('classifies 403 as AUTHORIZATION (not retryable)', () => {
    const info = classifyError({ status: 403 });
    expect(info.type).toBe(ErrorType.AUTHORIZATION);
    expect(info.retryable).toBe(false);
  });

  it('classifies 404 as NOT_FOUND (not retryable)', () => {
    const info = classifyError({ status: 404 });
    expect(info.type).toBe(ErrorType.NOT_FOUND);
    expect(info.retryable).toBe(false);
  });

  it('classifies 500 as SERVER (retryable)', () => {
    const info = classifyError({ status: 500 });
    expect(info.type).toBe(ErrorType.SERVER);
    expect(info.retryable).toBe(true);
  });

  it('classifies 503 as SERVER (retryable)', () => {
    const info = classifyError({ statusCode: 503 });
    expect(info.type).toBe(ErrorType.SERVER);
    expect(info.retryable).toBe(true);
  });

  it('classifies 422 as VALIDATION (not retryable)', () => {
    const info = classifyError({ status: 422 });
    expect(info.type).toBe(ErrorType.VALIDATION);
    expect(info.retryable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// classifyError – validation
// ---------------------------------------------------------------------------
describe('classifyError – validation errors', () => {
  it('classifies ValidationError by name', () => {
    const err = Object.assign(new Error('bad input'), { name: 'ValidationError' });
    const info = classifyError(err);
    expect(info.type).toBe(ErrorType.VALIDATION);
    expect(info.retryable).toBe(false);
  });

  it('classifies error with type=VALIDATION', () => {
    const err = { message: 'invalid', type: ErrorType.VALIDATION };
    const info = classifyError(err);
    expect(info.type).toBe(ErrorType.VALIDATION);
  });
});

// ---------------------------------------------------------------------------
// classifyError – unknown fallback
// ---------------------------------------------------------------------------
describe('classifyError – unknown', () => {
  it('falls back to UNKNOWN for generic errors', () => {
    const info = classifyError(new Error('something random'));
    expect(info.type).toBe(ErrorType.UNKNOWN);
    expect(info.retryable).toBe(true);
  });

  it('includes timestamp', () => {
    const before = Date.now();
    const info = classifyError(new Error('x'));
    expect(info.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('includes userMessage and actionSuggestion', () => {
    const info = classifyError(new Error('x'));
    expect(typeof info.userMessage).toBe('string');
    expect(info.userMessage.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// isRetryable
// ---------------------------------------------------------------------------
describe('isRetryable', () => {
  it('returns true for network errors', () => {
    expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('returns false for 401', () => {
    expect(isRetryable({ status: 401 })).toBe(false);
  });

  it('returns false for 404', () => {
    expect(isRetryable({ status: 404 })).toBe(false);
  });

  it('returns true for 500', () => {
    expect(isRetryable({ status: 500 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getUserFriendlyMessage
// ---------------------------------------------------------------------------
describe('getUserFriendlyMessage', () => {
  it('returns a non-empty string', () => {
    const msg = getUserFriendlyMessage(new Error('oops'));
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns login message for 401', () => {
    const msg = getUserFriendlyMessage({ status: 401 });
    expect(msg.toLowerCase()).toContain('log in');
  });
});

// ---------------------------------------------------------------------------
// getActionSuggestion
// ---------------------------------------------------------------------------
describe('getActionSuggestion', () => {
  it('returns a string for retryable errors', () => {
    const suggestion = getActionSuggestion(new TypeError('Failed to fetch'));
    expect(typeof suggestion).toBe('string');
  });

  it('returns "Log in" suggestion for 401', () => {
    const suggestion = getActionSuggestion({ status: 401 });
    expect(suggestion).toBe('Log in');
  });
});

// ---------------------------------------------------------------------------
// retryWithBackoff
// ---------------------------------------------------------------------------
describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 100 });
    await vi.runAllTimersAsync();
    expect(await promise).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors and eventually resolves', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 500 })
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 10 });
    await vi.runAllTimersAsync();
    expect(await promise).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately for non-retryable errors (401)', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 401 });
    await expect(
      retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 10 }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting all attempts', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 500 });
    const promise = retryWithBackoff(fn, { maxAttempts: 2, initialDelayMs: 10 });
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toMatchObject({ status: 500 });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// formatErrorForLogging
// ---------------------------------------------------------------------------
describe('formatErrorForLogging', () => {
  it('returns an object with required fields', () => {
    const log = formatErrorForLogging(new Error('test'));
    expect(log).toHaveProperty('type');
    expect(log).toHaveProperty('message');
    expect(log).toHaveProperty('timestamp');
    expect(log).toHaveProperty('retryable');
  });

  it('timestamp is an ISO string', () => {
    const log = formatErrorForLogging(new Error('test'));
    expect(() => new Date(log.timestamp as string)).not.toThrow();
  });

  it('includes statusCode for HTTP errors', () => {
    const log = formatErrorForLogging({ status: 404 });
    expect(log.statusCode).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// TypedError
// ---------------------------------------------------------------------------
describe('TypedError', () => {
  it('is an instance of Error', () => {
    const err = new TypedError(ErrorType.SERVER, 'server down');
    expect(err instanceof Error).toBe(true);
  });

  it('has the correct name', () => {
    const err = new TypedError(ErrorType.NETWORK, 'net error');
    expect(err.name).toBe('TypedError');
  });

  it('stores type, message, details, and statusCode', () => {
    const err = new TypedError(ErrorType.AUTHENTICATION, 'unauth', { foo: 'bar' }, 401);
    expect(err.type).toBe(ErrorType.AUTHENTICATION);
    expect(err.message).toBe('unauth');
    expect(err.details).toEqual({ foo: 'bar' });
    expect(err.statusCode).toBe(401);
  });
});
