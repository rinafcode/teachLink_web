import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRetryDelay } from '../api';

describe('getRetryDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses full jitter across the exponential backoff window', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(getRetryDelay(1, 100)).toBe(50);
    expect(getRetryDelay(2, 100)).toBe(100);
    expect(getRetryDelay(3, 100)).toBe(200);
  });

  it('can produce the minimum delay', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(getRetryDelay(3, 100)).toBe(0);
  });

  it('can produce the maximum backoff window', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    expect(getRetryDelay(3, 100)).toBe(400);
  });
});
