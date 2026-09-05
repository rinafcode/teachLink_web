import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memoizeByInputs } from '../stateManager';
import { selectUnreadNotifications } from '../selectors';
import type { AppNotification } from '@/lib/notifications/types';

const notification = (id: string, read = false): AppNotification =>
  ({
    id,
    title: `n-${id}`,
    body: '',
    read,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    type: 'system',
  }) as unknown as AppNotification;

describe('memoizeByInputs', () => {
  it('returns the computed value', () => {
    const double = memoizeByInputs((n: number) => n * 2);

    expect(double(21)).toBe(42);
  });

  // The whole point: zustand compares results with Object.is, so a stable
  // reference is what stops the re-render.
  it('returns the identical reference for the same input reference', () => {
    const compute = vi.fn((values: number[]) => values.filter((v) => v > 1));
    const memoized = memoizeByInputs(compute);
    const input = [1, 2, 3];

    const first = memoized(input);
    const second = memoized(input);

    expect(second).toBe(first);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes when an input reference changes', () => {
    const compute = vi.fn((values: number[]) => values.length);
    const memoized = memoizeByInputs(compute);

    memoized([1, 2]);
    memoized([1, 2]);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('recomputes when a primitive argument changes', () => {
    const compute = vi.fn((n: number) => n * 2);
    const memoized = memoizeByInputs(compute);

    memoized(1);
    memoized(1);
    memoized(2);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('compares every argument, not just the first', () => {
    const compute = vi.fn((a: number, b: number) => a + b);
    const memoized = memoizeByInputs(compute);

    memoized(1, 2);
    memoized(1, 2);
    memoized(1, 3);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('recomputes when the argument count changes', () => {
    const compute = vi.fn((...values: number[]) => values.length);
    const memoized = memoizeByInputs(compute);

    memoized(1);
    memoized(1, 2);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  // Object.is, not ===, so the memo does not miss on a NaN input forever.
  it('treats NaN as equal to itself', () => {
    const compute = vi.fn((n: number) => n);
    const memoized = memoizeByInputs(compute);

    memoized(NaN);
    memoized(NaN);

    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('distinguishes +0 from -0', () => {
    const compute = vi.fn((n: number) => n);
    const memoized = memoizeByInputs(compute);

    memoized(0);
    memoized(-0);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('caches an undefined result rather than recomputing it', () => {
    const compute = vi.fn(() => undefined);
    const memoized = memoizeByInputs(compute);

    memoized();
    memoized();

    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes after clear()', () => {
    const compute = vi.fn((values: number[]) => values.slice());
    const memoized = memoizeByInputs(compute);
    const input = [1];

    const first = memoized(input);
    memoized.clear();
    const second = memoized(input);

    expect(compute).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
    expect(second).toEqual(first);
  });

  // Only the last call is cached: state moves forward, so a larger cache would
  // retain memory to serve inputs that are not coming back.
  it('caches only the most recent inputs', () => {
    const compute = vi.fn((values: number[]) => values.length);
    const memoized = memoizeByInputs(compute);
    const a = [1];
    const b = [2];

    memoized(a);
    memoized(b);
    memoized(a);

    expect(compute).toHaveBeenCalledTimes(3);
  });

  it('keeps separate caches for separate memoized functions', () => {
    const first = memoizeByInputs((n: number) => n + 1);
    const second = memoizeByInputs((n: number) => n + 2);

    expect(first(1)).toBe(2);
    expect(second(1)).toBe(3);
  });
});

describe('selectUnreadNotifications', () => {
  beforeEach(() => {
    selectUnreadNotifications.clear();
  });

  it('returns only unread notifications', () => {
    const notifications = [notification('a'), notification('b', true), notification('c')];

    expect(selectUnreadNotifications(notifications).map((n) => n.id)).toEqual(['a', 'c']);
  });

  // An unrelated slice changing hands the selector the same notifications
  // array; returning a fresh filtered array there is what re-rendered every
  // subscriber.
  it('returns a stable reference while the notifications array is unchanged', () => {
    const notifications = [notification('a'), notification('b', true)];

    expect(selectUnreadNotifications(notifications)).toBe(
      selectUnreadNotifications(notifications),
    );
  });

  it('returns a new reference once the notifications array changes', () => {
    const first = selectUnreadNotifications([notification('a')]);
    const second = selectUnreadNotifications([notification('a'), notification('b')]);

    expect(second).not.toBe(first);
    expect(second).toHaveLength(2);
  });

  it('handles an empty list', () => {
    expect(selectUnreadNotifications([])).toEqual([]);
  });

  it('returns an empty list when everything is read', () => {
    expect(selectUnreadNotifications([notification('a', true)])).toEqual([]);
  });

  // The badge derives its count from the same cached array, so a component
  // showing both the badge and the list filters once, not twice.
  it('serves the count from the same cached array', () => {
    const notifications = [notification('a'), notification('b', true), notification('c')];
    const list = selectUnreadNotifications(notifications);

    expect(selectUnreadNotifications(notifications).length).toBe(2);
    expect(selectUnreadNotifications(notifications)).toBe(list);
  });
});
