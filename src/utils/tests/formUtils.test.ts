import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '../formUtils';

describe('formUtils - debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces calls within the specified delay', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('first');
    debounced('second');
    debounced('third');

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it('allows cancelling pending debounced execution', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('call-1');
    vi.advanceTimersByTime(150);

    debounced.cancel();

    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });

  it('can be invoked again after cancellation', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('call-1');
    debounced.cancel();

    debounced('call-2');
    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call-2');
  });
});

describe('formUtils - throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throttles calls within the specified limit', () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 200);

    throttled('first');
    throttled('second');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    vi.advanceTimersByTime(200);

    throttled('third');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('third');
  });
});
