import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbPool } from '../pool';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const mPool = {
    on: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
    totalCount: 5,
    idleCount: 2,
    waitingCount: 1,
  };
  return { Pool: vi.fn(() => mPool) };
});

describe('DatabasePool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a singleton instance of Pool', () => {
    const pool1 = dbPool.getInstance();
    const pool2 = dbPool.getInstance();

    expect(Pool).toHaveBeenCalledTimes(1);
    expect(pool1).toBe(pool2);
  });

  it('should report metrics correctly', () => {
    // Initialize pool
    dbPool.getInstance();

    const metrics = dbPool.getMetrics();
    expect(metrics).toEqual({
      totalConnections: 5,
      idleConnections: 2,
      waitingCount: 1,
    });
  });

  it('should call end() when requested', async () => {
    const pool = dbPool.getInstance();
    await dbPool.end();
    expect(pool.end).toHaveBeenCalled();
  });
});
