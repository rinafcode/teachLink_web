import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger, queryLogs } from './index';

describe('structured logging', () => {
  beforeEach(() => {
    globalThis.__TEACHLINK_LOG_RECORDS__ = [];
    globalThis.__TEACHLINK_METRICS__ = [];
  });

  it('stores structured records that can be filtered by level', () => {
    const log = createLogger('tests.logging', { feature: 'monitoring' });

    log.info('hello world', { context: { ticket: 244 } });
    log.error('something failed', { error: new Error('boom') });

    const infoLogs = queryLogs({ level: 'info' });
    const errorLogs = queryLogs({ level: 'error' });

    expect(infoLogs).toHaveLength(1);
    expect(infoLogs[0]?.context).toMatchObject({ feature: 'monitoring', ticket: 244 });
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0]?.error?.message).toContain('boom');
  });

  it('supports search filtering for aggregated logs', () => {
    const log = createLogger('tests.logging');
    log.warn('export stalled', { context: { templateId: 'template-1' } });
    log.info('background heartbeat');

    const results = queryLogs({ search: 'template-1' });
    expect(results).toHaveLength(1);
    expect(results[0]?.message).toBe('export stalled');
  });
});
