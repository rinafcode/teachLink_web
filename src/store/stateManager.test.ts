import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useStore, evictExpired, PREDICTED_SESSION_TTL_MS } from './stateManager';

describe('stateManager predicted sessions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState({
      predictedSessions: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records a predicted session entry', () => {
    useStore.getState().recordPredictedSession('session-1');
    const state = useStore.getState();
    expect(state.predictedSessions['session-1']).toBeTypeOf('number');
  });

  it('refreshes an existing entry without growing the map', () => {
    useStore.getState().recordPredictedSession('session-1');
    useStore.getState().recordPredictedSession('session-1');
    useStore.getState().recordPredictedSession('session-2');

    expect(Object.keys(useStore.getState().predictedSessions)).toHaveLength(2);
  });

  it('evicts stale predicted sessions and returns the count', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);

    // Seed one fresh and one expired entry directly.
    useStore.setState({
      predictedSessions: {
        stale: t0 - PREDICTED_SESSION_TTL_MS - 1,
        fresh: t0,
      },
    });

    const evicted = useStore.getState().evictStalePredictedSessions();

    expect(evicted).toBe(1);
    expect(useStore.getState().predictedSessions['stale']).toBeUndefined();
    expect(useStore.getState().predictedSessions['fresh']).toBe(t0);
  });
});

describe('evictExpired helper', () => {
  const now = 2_000_000;

  it('keeps entries within the TTL and drops expired ones', () => {
    const result = evictExpired(
      {
        fresh: now,
        stale: now - PREDICTED_SESSION_TTL_MS - 1,
        boundary: now - PREDICTED_SESSION_TTL_MS,
      },
      now,
    );

    expect(result.evicted).toEqual(['stale']);
    expect(result.byId.fresh).toBe(now);
    expect(result.byId.boundary).toBe(now - PREDICTED_SESSION_TTL_MS);
    expect(result.byId.stale).toBeUndefined();
  });

  it('returns an empty map for empty input', () => {
    const result = evictExpired({}, now);
    expect(result.byId).toEqual({});
    expect(result.evicted).toEqual([]);
  });

  it('honours a custom TTL', () => {
    const result = evictExpired({ old: now - 5000 }, now, 10_000);
    expect(result.evicted).toEqual([]);

    const expired = evictExpired({ old: now - 15_000 }, now, 10_000);
    expect(expired.evicted).toEqual(['old']);
  });
});
