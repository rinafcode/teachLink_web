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

  it('automatically redacts sensitive keys and strings (PII, credentials)', () => {
    const log = createLogger('tests.logging');

    log.info('User login event with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {
      context: {
        email: 'user@example.com',
        password: 'super-secret-password-123',
        authHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        nestedSecret: {
          token: 'some-api-token-value',
          normalField: 'all-clear'
        },
        nestedObject: {
          token: 'some-api-token-value',
          normalField: 'all-clear'
        }
      }
    });

    const results = queryLogs({ scope: 'tests.logging' });
    expect(results).toHaveLength(1);
    
    const record = results[0];
    // Check that sensitive fields and strings are fully redacted
    expect(record.message).toContain('Bearer [REDACTED]');
    expect(record.context?.email).toBe('[REDACTED]');
    expect(record.context?.password).toBe('[REDACTED]');
    expect(record.context?.authHeader).toBe('[REDACTED]');
    
    // Parent key contains "secret" -> entire object redacted to string "[REDACTED]"
    expect(record.context?.nestedSecret).toBe('[REDACTED]');

    // Parent key is safe -> nested property "token" is redacted, "normalField" is preserved
    expect((record.context?.nestedObject as any)?.token).toBe('[REDACTED]');
    expect((record.context?.nestedObject as any)?.normalField).toBe('all-clear');
  });

  it('propagates correlation and request IDs automatically using AsyncLocalStorage', async () => {
    const { runWithLogContext } = await import('./index');
    const log = createLogger('tests.logging');

    await runWithLogContext({ requestId: 'test-req-123', correlationId: 'test-corr-456' }, async () => {
      log.info('Log within async context');
      
      // Simulating a nested async call or helper execution
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          log.warn('Log inside timeout callback');
          resolve();
        }, 10);
      });
    });

    const results = queryLogs({ scope: 'tests.logging' });
    expect(results).toHaveLength(2);

    expect(results[0]?.requestId).toBe('test-req-123');
    expect(results[0]?.correlationId).toBe('test-corr-456');
    expect(results[1]?.requestId).toBe('test-req-123');
    expect(results[1]?.correlationId).toBe('test-corr-456');
  });

  it('generates a valid correlation ID automatically for all logs if context is absent', () => {
    const log = createLogger('tests.logging');
    log.info('Log without context');

    const results = queryLogs({ scope: 'tests.logging' });
    expect(results).toHaveLength(1);
    expect(results[0]?.correlationId).toBeDefined();
    expect(results[0]?.correlationId).toContain('corr-');
  });
});
