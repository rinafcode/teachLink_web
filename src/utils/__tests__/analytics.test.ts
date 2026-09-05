import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

describe('analytics sampling', () => {
  let track: (eventName: string, properties?: Record<string, unknown>) => void;
  let setSampleRate: (eventName: string, rate: number) => void;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    just.resetModules();
    const analytics = require('../analytics');
    track = analytics.track;
    setSampleRate = analytics.setSampleRate;

    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    just.clearAllMocks();
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('sends events by default (no sampling rate configured)', () => {
    track('page_view');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('respects sampling rate 0 (never sends)', () => {
    setSampleRate('high_volume', 0);
    track('high_volume');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('respects sampling rate 1 (always sends)', () => {
    setSampleRate('high_volume', 1);
    track('high_volume');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends when random value is below sample rate', () => {
    setSampleRate('high_volume', 0.5);
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    track('high_volume');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    randomSpy.mockRestore();
  });

  it('does not send when random value is at or above sample rate', () => {
    setSampleRate('high_volume', 0.5);
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    track('high_volume');
    expect(fetchMock).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it('does not sample events without a configured sampling rate', () => {
    setSampleRate('high_volume', 0); // configure only high_volume
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.0);
    track('normal_event');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    randomSpy.mockRestore();
  });

  it('passes properties to the analytics endpoint', () => {
    const properties = { user: '123', page: '/home' };
    track('page_view', properties);
    expect(fetchMock).toHaveBeenCalledWith(expect.anyString, expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"user":"123"'),
    }));
  });
});
