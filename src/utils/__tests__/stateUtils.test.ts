/**
 * Unit Tests for stateUtils
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deepMerge, isObject, debounce, generateTempId } from '../stateUtils';

// ---------------------------------------------------------------------------
// isObject
// ---------------------------------------------------------------------------
describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
  });

  it('returns false for functions', () => {
    expect(isObject(() => {})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deepMerge
// ---------------------------------------------------------------------------
describe('deepMerge', () => {
  it('merges flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('source values overwrite target values', () => {
    const result = deepMerge({ a: 1 }, { a: 99 });
    expect(result.a).toBe(99);
  });

  it('deep merges nested objects', () => {
    const target = { a: { x: 1, y: 2 } };
    const source = { a: { y: 99, z: 3 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { x: 1, y: 99, z: 3 } });
  });

  it('adds new nested keys from source', () => {
    const result = deepMerge({ a: 1 }, { b: { c: 2 } });
    expect(result).toEqual({ a: 1, b: { c: 2 } });
  });

  it('does not mutate the target object', () => {
    const target = { a: 1 };
    deepMerge(target, { b: 2 });
    expect(target).toEqual({ a: 1 });
  });

  it('returns source when target is falsy', () => {
    const source = { a: 1 };
    const result = deepMerge(null as unknown as Record<string, unknown>, source);
    expect(result).toEqual(source);
  });

  it('returns target when source is falsy', () => {
    const target = { a: 1 };
    const result = deepMerge(target, null as unknown as Record<string, unknown>);
    expect(result).toEqual(target);
  });

  it('handles arrays as leaf values (not deep merged)', () => {
    const result = deepMerge({ a: [1, 2] }, { a: [3, 4] });
    expect(result.a).toEqual([3, 4]);
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('only calls the function once for rapid successive calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on each call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced();
    vi.advanceTimersByTime(100);
    debounced(); // reset
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the wrapped function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('hello', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });
});

// ---------------------------------------------------------------------------
// generateTempId
// ---------------------------------------------------------------------------
describe('generateTempId', () => {
  it('returns a string starting with "temp_"', () => {
    expect(generateTempId()).toMatch(/^temp_/);
  });

  it('generates unique IDs on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTempId()));
    expect(ids.size).toBe(100);
  });

  it('has a reasonable length', () => {
    const id = generateTempId();
    expect(id.length).toBeGreaterThan(5);
  });
});
