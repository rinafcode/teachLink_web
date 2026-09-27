import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionPredictor } from '../SessionPredictor';

describe('SessionPredictor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const predictor = new SessionPredictor();
    expect(predictor).toBeDefined();
    // Initially probability should be 0 since time hasn't passed
    expect(predictor.predictIdleProbability()).toBe(0);
  });

  it('should increase idle probability over time if no activity', () => {
    const predictor = new SessionPredictor({ idleThreshold: 10000 });

    // Advance time by 5 seconds (50% of threshold)
    vi.advanceTimersByTime(5000);
    expect(predictor.predictIdleProbability(Date.now())).toBe(0.5);

    // Advance to 10 seconds (100% of threshold)
    vi.advanceTimersByTime(5000);
    expect(predictor.predictIdleProbability(Date.now())).toBe(1.0);
  });

  it('should predict session refresh correctly', () => {
    const predictor = new SessionPredictor();

    // Session is 80% complete, highly engaged (idle probability 0.1)
    expect(predictor.predictSessionRefresh(0.8, 0.1)).toBe(true);

    // Session is 50% complete, highly engaged
    expect(predictor.predictSessionRefresh(0.5, 0.1)).toBe(false);

    // Session is 80% complete, completely idle (idle probability 0.9)
    expect(predictor.predictSessionRefresh(0.8, 0.9)).toBe(false);
  });

  it('should trigger predictive callbacks when thresholds are met during evaluation', () => {
    const onAbandonment = vi.fn();
    const onRefresh = vi.fn();

    const predictor = new SessionPredictor({
      maxSessionLength: 60000, // 1 minute
      idleThreshold: 10000, // 10 seconds
      onPredictiveAbandonment: onAbandonment,
      onPredictiveRefresh: onRefresh,
    });

    predictor.startTracking();

    // Advance time by 9 seconds, probability should be 0.9
    // Since probability > 0.8, onPredictiveAbandonment should trigger
    vi.advanceTimersByTime(9000);
    predictor.evaluatePredictions();
    expect(onAbandonment).toHaveBeenCalled();

    // Advance to 50 seconds (83% session completion)
    // Add activity to reduce idle probability
    vi.advanceTimersByTime(41000);

    // Simulate activity to reset idle probability
    window.dispatchEvent(new Event('mousemove'));

    // After activity, probability is low, but session is > 75% complete
    predictor.evaluatePredictions();
    expect(onRefresh).toHaveBeenCalled();

    predictor.stopTracking();
  });

  it('should reset session tracking manually', () => {
    const predictor = new SessionPredictor({ idleThreshold: 10000 });

    vi.advanceTimersByTime(10000);
    expect(predictor.predictIdleProbability(Date.now())).toBe(1.0);

    predictor.resetSession();
    expect(predictor.predictIdleProbability(Date.now())).toBe(0);
  });

  it('should record predicted sessions and bound their count', () => {
    const predictor = new SessionPredictor({ predictedSessionTtlMs: 60000 });

    for (let i = 0; i < 5; i++) {
      predictor.recordPrediction(`session-${i}`);
    }

    expect(predictor.getPredictedSessionCount()).toBe(5);
  });

  it('should evict predicted sessions that exceed the TTL', () => {
    const predictor = new SessionPredictor({ predictedSessionTtlMs: 60000 });

    // Record "stale" early, then "fresh" 30s later (still within TTL).
    vi.setSystemTime(1_000_000);
    predictor.recordPrediction('stale');
    vi.setSystemTime(1_000_000 + 30_000);
    predictor.recordPrediction('fresh');

    expect(predictor.getPredictedSessionCount()).toBe(2);

    // 61s after "stale" was recorded it expires; "fresh" remains.
    const evicted = predictor.evictStalePredictions(1_000_000 + 61_000);
    expect(evicted).toBe(1);
    expect(predictor.getPredictedSessionCount()).toBe(1);
  });

  it('should evict stale entries before recording a new prediction', () => {
    const predictor = new SessionPredictor({ predictedSessionTtlMs: 60000 });

    vi.setSystemTime(1_000_000);
    predictor.recordPrediction('stale');

    // Simulate the TTL passing before the next prediction is recorded.
    vi.setSystemTime(1_000_000 + 61_000);
    predictor.recordPrediction('new');

    expect(predictor.getPredictedSessionCount()).toBe(1);
  });

  it('should respect a custom TTL for eviction', () => {
    const predictor = new SessionPredictor({ predictedSessionTtlMs: 1000 });

    vi.setSystemTime(1_000_000);
    predictor.recordPrediction('a');
    predictor.recordPrediction('b');

    expect(predictor.evictStalePredictions(1_000_000 + 2_000)).toBe(2);
    expect(predictor.getPredictedSessionCount()).toBe(0);
  });
});
