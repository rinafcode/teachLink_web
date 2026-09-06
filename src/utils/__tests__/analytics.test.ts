import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import analytics from '../analytics';
import type { AnalyticsAdapter } from '../analytics';

describe('analytics high-volume sampling', () => {
  const adapter: AnalyticsAdapter = vi.fn();

  beforeEach(() => {
    analytics.clearAdapters();
    analytics.addAdapter(adapter);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    analytics.clearAdapters();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('sends events that are not marked as high-volume', () => {
    analytics.track('course_view');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('always sends high-volume events when sample rate is 1', () => {
    analytics.setSampleRate('page_view', 1);
    analytics.track('page_view');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('never sends high-volume events when sample rate is 0', () => {
    analytics.setSampleRate('page_view', 0);
    analytics.track('page_view');
    expect(adapter).not.toHaveBeenCalled();
  });

  it('sends when the random draw is below the configured sample rate', () => {
    analytics.setSampleRate('page_view', 0.5);
    vi.mocked(Math.random).mockReturnValue(0.25);
    analytics.track('page_view');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('skips when the random draw is at or above the configured sample rate', () => {
    analytics.setSampleRate('page_view', 0.5);
    analytics.track('page_view'); // Math.random mocked to 0.5
    expect(adapter).not.toHaveBeenCalled();
  });
});
