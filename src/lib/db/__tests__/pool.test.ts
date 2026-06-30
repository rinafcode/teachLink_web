import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dbPool, query } from '../pool';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const mPool = {
    on: vi.fn(),
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
    end: vi.fn(),
    totalCount: 5,
    idleCount: 2,
    waitingCount: 1,
  };
  return { Pool: vi.fn(() => mPool) };
});

function getMockPool() {
  return vi.mocked(Pool).mock.results[0]!.value;
}

describe('DatabasePool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    (dbPool as any).instance = undefined;
    (dbPool as any).circuitState = 'CLOSED';
    (dbPool as any).consecutiveFailures = 0;
    (dbPool as any).lastFailureTime = 0;
    (dbPool as any).isReconnecting = false;
    (dbPool as any).queryQueue = [];
  });

  afterEach(async () => {
    await vi.advanceTimersByTimeAsync(0);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should create a singleton instance of Pool', () => {
    const pool1 = dbPool.getInstance();
    const pool2 = dbPool.getInstance();

    expect(Pool).toHaveBeenCalledTimes(1);
    expect(pool1).toBe(pool2);
  });

  it('should report metrics including circuit breaker state', () => {
    dbPool.getInstance();

    const metrics = dbPool.getMetrics();
    expect(metrics).toMatchObject({
      totalConnections: 5,
      idleConnections: 2,
      waitingCount: 1,
      circuitState: 'CLOSED',
      consecutiveFailures: 0,
      queuedQueries: 0,
    });
  });

  it('should call end() when requested', async () => {
    const pool = dbPool.getInstance();
    await dbPool.end();
    expect(pool.end).toHaveBeenCalled();
  });

  it('should retry query on transient failure and succeed', async () => {
    dbPool.getInstance();
    const mockPool = getMockPool();

    mockPool.query
      .mockRejectedValueOnce(new Error('Connection reset'))
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

    const promise = query('SELECT 1');
    await vi.advanceTimersByTimeAsync(600);
    const result = await promise;

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(mockPool.query).toHaveBeenCalledTimes(2);
  });

  it('should fail after exhausting all retry attempts', async () => {
    dbPool.getInstance();
    const mockPool = getMockPool();

    mockPool.query.mockRejectedValue(new Error('Connection error'));

    const promise = query('SELECT 1');
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).rejects.toThrow('Connection error');
    expect(mockPool.query).toHaveBeenCalledTimes(3);
  });

  it('should open circuit breaker after 5 consecutive failures', async () => {
    dbPool.getInstance();
    const mockPool = getMockPool();

    mockPool.query.mockRejectedValue(new Error('Connection error'));

    for (let i = 0; i < 5; i++) {
      const promise = query('SELECT 1');
      await vi.advanceTimersByTimeAsync(2000);
      await expect(promise).rejects.toThrow('Connection error');
    }

    await expect(query('SELECT 1')).rejects.toMatchObject({
      message: 'Database service unavailable',
      statusCode: 503,
    });
  });

  it('should resume normal operation after circuit breaker reset timeout', async () => {
    dbPool.getInstance();
    const mockPool = getMockPool();

    mockPool.query.mockRejectedValue(new Error('Connection error'));

    for (let i = 0; i < 5; i++) {
      const promise = query('SELECT 1');
      await vi.advanceTimersByTimeAsync(2000);
      await expect(promise).rejects.toThrow('Connection error');
    }

    (dbPool as any).lastFailureTime = Date.now() - 120_000;

    mockPool.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

    const result = await query('SELECT 1');
    expect(result.rows).toEqual([{ id: 1 }]);
  });

  it('should trigger reconnect attempt on pool error event', async () => {
    dbPool.getInstance();
    const mockPool = getMockPool();

    mockPool.connect.mockResolvedValue({ release: vi.fn() });

    const errorHandler = mockPool.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'error',
    )![1] as (err: Error) => void;

    errorHandler(new Error('ECONNREFUSED'));

    await vi.advanceTimersByTimeAsync(100);

    expect(mockPool.connect).toHaveBeenCalled();
  });

  it('should queue queries during reconnect and process them after success', async () => {
    dbPool.getInstance();
    const mockPool = getMockPool();

    mockPool.connect.mockResolvedValue({ release: vi.fn() });

    const errorHandler = mockPool.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'error',
    )![1] as (err: Error) => void;

    errorHandler(new Error('ECONNREFUSED'));
    (dbPool as any).isReconnecting = true;

    mockPool.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

    const queryPromise = query('SELECT 1');

    expect((dbPool as any).queryQueue.length).toBe(1);

    (dbPool as any).isReconnecting = false;
    (dbPool as any).processQueue();

    const result = await queryPromise;
    expect(result.rows).toEqual([{ id: 1 }]);
  });
});
