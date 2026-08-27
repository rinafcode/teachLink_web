/**
 * Tests for request logging middleware (deprecation warning emission).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { withRequestLogging } from '../logger';
import { queryLogs } from '@/lib/logging';

class MockNextUrl {
  pathname: string;
  search: string;
  href: string;

  constructor(pathname = '/', search = '') {
    this.pathname = pathname;
    this.search = search;
    this.href = `http://localhost${pathname}${search}`;
  }
}

function createMockRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
  return {
    nextUrl: new MockNextUrl(pathname),
    url: `http://localhost${pathname}`,
    method: 'GET',
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
    cookies: {
      get: () => undefined,
      getAll: () => [],
      has: () => false,
      delete: vi.fn(),
      set: vi.fn(),
    },
  } as unknown as NextRequest;
}

describe('withRequestLogging API versioning warnings', () => {
  beforeEach(() => {
    globalThis.__TEACHLINK_LOG_RECORDS__ = [];
    globalThis.__TEACHLINK_METRICS__ = [];
  });

  it('emits a deprecation warning for unversioned API requests', async () => {
    const request = createMockRequest('/api/notes');
    await withRequestLogging(request, 'logger.test', async () => 42);

    const warnings = queryLogs({ level: 'warn', scope: 'logger.test' });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain('deprecated');
    expect(warnings[0]?.context).toMatchObject({
      deprecatedPath: '/api/notes',
      versionedPath: '/api/v1/notes',
    });
  });

  it('does not warn for versioned API requests', async () => {
    const request = createMockRequest('/api/v1/notes');
    await withRequestLogging(request, 'logger.test', async () => 42);

    const warnings = queryLogs({ level: 'warn', scope: 'logger.test' });

    expect(warnings).toHaveLength(0);
  });

  it('does not warn for non-API requests', async () => {
    const request = createMockRequest('/dashboard');
    await withRequestLogging(request, 'logger.test', async () => 42);

    const warnings = queryLogs({ level: 'warn', scope: 'logger.test' });

    expect(warnings).toHaveLength(0);
  });

  it('warns before executing the handler and surfaces the versioned target', async () => {
    let handlerRan = false;
    const request = createMockRequest('/api/courses/123');

    await withRequestLogging(request, 'logger.test', async () => {
      handlerRan = true;
      const warnings = queryLogs({ level: 'warn', scope: 'logger.test' });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]?.context?.versionedPath).toBe('/api/v1/courses/123');
      return true;
    });

    expect(handlerRan).toBe(true);
  });
});
