/**
 * Colocated tests for the feature flags route handler
 * (src/app/api/admin/feature-flags/route.ts).
 *
 * The handler normalises whatever it is handed into a stored flag, so these
 * tests pin the defaults it applies (disabled, `all`, 0%), the bounds it clamps
 * percentage to, the actor it attributes the flag to, and the 400 it returns
 * when the flag cannot be named.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../route';

vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/middleware/audit', () => ({
  logAuditMutation: vi.fn(),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

vi.mock('@/lib/feature-flags/store', () => {
  let counter = 0;
  return {
    flagStore: new Map<string, unknown>(),
    createAuditEntry: vi.fn(),
    generateId: vi.fn((prefix: string) => `${prefix}_${++counter}`),
  };
});

import { createAuditEntry, flagStore } from '@/lib/feature-flags/store';
import { logAuditMutation } from '@/middleware/audit';

const FLAGS_URL = 'http://localhost/api/admin/feature-flags';

/** The handlers are declared for `NextRequest`; these tests drive them with `Request`. */
type Handler = (request: Request) => Promise<Response>;

function invoke(handler: unknown, request: Request): Promise<Response> {
  return (handler as Handler)(request);
}

function postRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(FLAGS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function flag(updatedAt: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `flag_${updatedAt}`,
    name: `flag-${updatedAt}`,
    description: '',
    enabled: false,
    strategy: 'all',
    percentage: 0,
    rules: [],
    tags: [],
    createdAt: updatedAt,
    updatedAt,
    createdBy: 'admin',
    ...overrides,
  };
}

describe('GET /api/admin/feature-flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagStore.clear();
  });

  it('returns an empty list when no flags exist', async () => {
    const response = await invoke(GET, new Request(FLAGS_URL));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ flags: [] });
  });

  it('returns flags sorted by most recently updated first', async () => {
    const older = flag('2026-01-01T00:00:00.000Z', { name: 'older' });
    const newer = flag('2026-02-01T00:00:00.000Z', { name: 'newer' });
    flagStore.set(older.id, older);
    flagStore.set(newer.id, newer);

    const response = await invoke(GET, new Request(FLAGS_URL));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.flags.map((entry: { name: string }) => entry.name)).toEqual(['newer', 'older']);
  });
});

describe('POST /api/admin/feature-flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagStore.clear();
  });

  it('creates a flag from a name alone, defaulting to disabled for everyone', async () => {
    const response = await invoke(POST, postRequest({ name: 'new-feature' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.flag.name).toBe('new-feature');
    expect(body.flag.enabled).toBe(false);
    expect(body.flag.strategy).toBe('all');
    expect(body.flag.percentage).toBe(0);
    expect(body.flag.rules).toEqual([]);
    expect(body.flag.tags).toEqual([]);
    expect(body.flag.description).toBe('');
    expect(body.flag.createdBy).toBe('anonymous');
    expect(flagStore.size).toBe(1);
  });

  it('trims the name and description it stores', async () => {
    const response = await invoke(
      POST,
      postRequest({ name: '  spaced  ', description: '  note  ' }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.flag.name).toBe('spaced');
    expect(body.flag.description).toBe('note');
  });

  it('keeps a recognised strategy, rules and tags', async () => {
    const rules = [{ attribute: 'role', operator: 'equals', value: 'admin' }];
    const response = await invoke(
      POST,
      postRequest({ name: 'targeted', strategy: 'targeting', rules, tags: ['experiment', 42] }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.flag.strategy).toBe('targeting');
    expect(body.flag.rules).toEqual(rules);
    expect(body.flag.tags).toEqual(['experiment', '42']);
  });

  it('clamps the percentage into the 0-100 range', async () => {
    const high = await invoke(POST, postRequest({ name: 'too-high', percentage: 150 }));
    const highBody = await high.json();
    expect(highBody.flag.percentage).toBe(100);

    const low = await invoke(POST, postRequest({ name: 'too-low', percentage: -20 }));
    const lowBody = await low.json();
    expect(lowBody.flag.percentage).toBe(0);
  });

  it('falls back to the all strategy for an unrecognised strategy', async () => {
    const response = await invoke(POST, postRequest({ name: 'odd', strategy: 'sometimes' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.flag.strategy).toBe('all');
  });

  it('attributes the flag to the acting admin', async () => {
    const response = await invoke(
      POST,
      postRequest({ name: 'attributed' }, { 'x-admin-user': 'root@teachlink.com' }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.flag.createdBy).toBe('root@teachlink.com');
  });

  it('records the creation in the audit trail', async () => {
    const request = postRequest({ name: 'audited' });
    const response = await invoke(POST, request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAuditEntry).toHaveBeenCalledWith('created', 'anonymous', null, body.flag);
    expect(logAuditMutation).toHaveBeenCalledWith(request, {
      action: 'create',
      targetType: 'feature-flag',
      targetId: body.flag.id,
      statusCode: 201,
      metadata: { name: 'audited' },
    });
  });

  it('returns 400 when the name is missing', async () => {
    const response = await invoke(POST, postRequest({ description: 'no name' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('name is required');
    expect(flagStore.size).toBe(0);
    expect(createAuditEntry).not.toHaveBeenCalled();
  });

  it('returns 400 when the name is only whitespace', async () => {
    const response = await invoke(POST, postRequest({ name: '   ' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('name is required');
    expect(flagStore.size).toBe(0);
  });

  it('returns 400 when the body cannot be parsed as JSON', async () => {
    const request = new Request(FLAGS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });

    const response = await invoke(POST, request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('name is required');
    expect(flagStore.size).toBe(0);
  });
});
