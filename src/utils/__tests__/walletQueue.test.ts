import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletConnectionQueue } from '@/utils/web3/walletQueue';

describe('WalletConnectionQueue', () => {
  let queue: WalletConnectionQueue<string>;

  beforeEach(() => {
    queue = new WalletConnectionQueue<string>();
  });

  it('should initialise with empty state', () => {
    const stats = queue.getStats();
    expect(stats.queueLength).toBe(0);
    expect(stats.isProcessing).toBe(false);
    expect(stats.totalProcessed).toBe(0);
    expect(stats.totalFailed).toBe(0);
  });

  it('should resolve a single operation', async () => {
    const result = await queue.enqueue(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(queue.getStats().totalProcessed).toBe(1);
    expect(queue.getStats().totalFailed).toBe(0);
  });

  it('should reject a failing operation and propagate the error', async () => {
    await expect(
      queue.enqueue(() => Promise.reject(new Error('wallet error'))),
    ).rejects.toThrow('wallet error');
    expect(queue.getStats().totalFailed).toBe(1);
    expect(queue.getStats().totalProcessed).toBe(0);
  });

  it('should serialise concurrent operations (FIFO)', async () => {
    const order: number[] = [];

    const op = (id: number, ms: number) =>
      queue.enqueue(
        () =>
          new Promise<string>((resolve) => {
            setTimeout(() => {
              order.push(id);
              resolve(`op-${id}`);
            }, ms);
          }),
      );

    const [r1, r2, r3] = await Promise.all([op(1, 30), op(2, 10), op(3, 5)]);

    expect(r1).toBe('op-1');
    expect(r2).toBe('op-2');
    expect(r3).toBe('op-3');
    expect(order).toEqual([1, 2, 3]);
    expect(queue.getStats().totalProcessed).toBe(3);
  });

  it('should continue draining after a failure', async () => {
    const results: string[] = [];
    const errors: string[] = [];

    await Promise.allSettled([
      queue.enqueue(() => Promise.reject(new Error('fail'))).catch((e: Error) => errors.push(e.message)),
      queue.enqueue(() => Promise.resolve('second')).then((v) => results.push(v)),
    ]);

    expect(errors).toEqual(['fail']);
    expect(results).toEqual(['second']);
    expect(queue.getStats().totalFailed).toBe(1);
    expect(queue.getStats().totalProcessed).toBe(1);
  });

  it('should reject pending operations when clear() is called', async () => {
    let resolver!: (v: string) => void;
    const blocker = new Promise<string>((res) => {
      resolver = res;
    });

    const first = queue.enqueue(() => blocker);
    const second = queue.enqueue(() => Promise.resolve('should not run'));

    const secondResult = second.catch((e: Error) => e.message);

    queue.clear('Queue cleared');

    resolver('done');
    await first;

    const msg = await secondResult;
    expect(msg).toBe('Queue cleared');
  });

  it('should report correct queue length while processing', async () => {
    let releaseFirst!: (v: string) => void;
    const firstPending = new Promise<string>((res) => {
      releaseFirst = res;
    });

    queue.enqueue(() => firstPending);
    queue.enqueue(() => Promise.resolve('b'));
    queue.enqueue(() => Promise.resolve('c'));

    await Promise.resolve();

    expect(queue.length).toBe(2);
    expect(queue.processing).toBe(true);

    releaseFirst('a');
  });

  it('length getter returns zero after all operations settle', async () => {
    await queue.enqueue(() => Promise.resolve('x'));
    await queue.enqueue(() => Promise.resolve('y'));
    expect(queue.length).toBe(0);
    expect(queue.processing).toBe(false);
  });
});
