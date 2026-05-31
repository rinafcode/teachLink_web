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
});
