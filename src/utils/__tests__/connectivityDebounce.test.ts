import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CONNECTIVITY_DEBOUNCE_MS, createConnectivityDebouncer } from '../pwaUtils';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createConnectivityDebouncer', () => {
  it('starts settled on the initial state', () => {
    const debouncer = createConnectivityDebouncer(true, vi.fn());

    expect(debouncer.settled).toBe(true);
    expect(debouncer.pending).toBe(true);
  });

  it('reports a change once it has held for the window', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(debouncer.settled).toBe(false);
  });

  it('does not report before the window elapses', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    vi.advanceTimersByTime(999);

    expect(onChange).not.toHaveBeenCalled();
  });

  // The case the issue is about: a train tunnel or a wifi handover fires
  // online/offline several times a second, and each one used to start a sync
  // that the next event interrupted.
  it('reports nothing when connectivity flaps back to where it started', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    vi.advanceTimersByTime(200);
    debouncer.push(true);
    vi.advanceTimersByTime(200);
    debouncer.push(false);
    vi.advanceTimersByTime(200);
    debouncer.push(true);

    vi.advanceTimersByTime(5_000);

    expect(onChange).not.toHaveBeenCalled();
    expect(debouncer.settled).toBe(true);
  });

  it('collapses a burst into a single report of the final state', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    vi.advanceTimersByTime(100);
    debouncer.push(true);
    vi.advanceTimersByTime(100);
    debouncer.push(false);

    vi.advanceTimersByTime(1_000);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('restarts the window on each new differing event', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    vi.advanceTimersByTime(900);
    debouncer.push(true);
    debouncer.push(false);
    vi.advanceTimersByTime(900);

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('stays silent for repeated events matching the settled state', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(true);
    debouncer.push(true);
    vi.advanceTimersByTime(5_000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports each genuine transition in turn', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    vi.advanceTimersByTime(1_000);
    debouncer.push(true);
    vi.advanceTimersByTime(1_000);

    expect(onChange).toHaveBeenNthCalledWith(1, false);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it('tracks the pending value before it settles', () => {
    const debouncer = createConnectivityDebouncer(true, vi.fn(), { debounceMs: 1_000 });

    debouncer.push(false);

    expect(debouncer.pending).toBe(false);
    expect(debouncer.settled).toBe(true);
  });

  it('flushes the pending value immediately', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 10_000 });

    debouncer.push(false);
    debouncer.flush();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(debouncer.settled).toBe(false);
  });

  it('flushing an unchanged value reports nothing', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange);

    debouncer.flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  // A timer firing after unmount would sync against a torn-down service.
  it('cancels a pending report', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange, { debounceMs: 1_000 });

    debouncer.push(false);
    debouncer.cancel();
    vi.advanceTimersByTime(5_000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses injected timers when supplied', () => {
    const setTimeoutFn = vi.fn().mockReturnValue(1 as unknown as ReturnType<typeof setTimeout>);
    const clearTimeoutFn = vi.fn();
    const debouncer = createConnectivityDebouncer(true, vi.fn(), {
      setTimeoutFn: setTimeoutFn as unknown as typeof setTimeout,
      clearTimeoutFn: clearTimeoutFn as unknown as typeof clearTimeout,
    });

    debouncer.push(false);
    debouncer.cancel();

    expect(setTimeoutFn).toHaveBeenCalledTimes(1);
    expect(clearTimeoutFn).toHaveBeenCalledWith(1);
  });

  it('defaults to the shared debounce window', () => {
    const onChange = vi.fn();
    const debouncer = createConnectivityDebouncer(true, onChange);

    debouncer.push(false);
    vi.advanceTimersByTime(CONNECTIVITY_DEBOUNCE_MS - 1);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
