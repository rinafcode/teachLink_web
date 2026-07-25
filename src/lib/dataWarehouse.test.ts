import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataWarehouse } from './dataWarehouse';

describe('DataWarehouseService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = dataWarehouse;
    const instance2 = dataWarehouse;
    expect(instance1).toBe(instance2);
  });

  it('should track an event successfully', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Temporarily change NODE_ENV to trigger console.log
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    await dataWarehouse.trackEvent('TEST_EVENT', { foo: 'bar' });

    expect(consoleSpy).toHaveBeenCalled();
    const logOutput = consoleSpy.mock.calls[0][1];
    const parsed = JSON.parse(logOutput);

    expect(parsed.eventName).toBe('TEST_EVENT');
    expect(parsed.properties).toEqual({ foo: 'bar' });
    expect(parsed.timestamp).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});
