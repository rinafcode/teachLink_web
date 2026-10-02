/**
 * Colocated tests for the network policies route handler
 * (src/app/api/admin/network-policies/route.ts).
 *
 * The handler validates scope, value and action before it stores anything, and
 * identifies policies by a generated id, so these tests pin the accepted
 * combinations, each rejection, and the delete lifecycle.
 */
import { describe, expect, it } from 'vitest';
import { DELETE, GET, POST } from '../route';

const POLICIES_URL = 'http://localhost/api/admin/network-policies';

/** The handlers are declared for `NextRequest`; these tests drive them with `Request`. */
type Handler = (request: Request) => Promise<Response>;

function invoke(handler: unknown, request: Request): Promise<Response> {
  return (handler as Handler)(request);
}

/**
 * `DELETE` reads the policy id from `request.nextUrl`, which a plain `Request`
 * does not carry, so the parsed URL is attached before the handler runs.
 */
function createRequest(url: string, init?: RequestInit): Request {
  const request = new Request(url, init);
  Object.defineProperty(request, 'nextUrl', { value: new URL(url) });
  return request;
}

function postRequest(body: unknown): Request {
  return createRequest(POLICIES_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteRequest(id?: string): Request {
  const url = id === undefined ? POLICIES_URL : `${POLICIES_URL}?id=${id}`;
  return createRequest(url, { method: 'DELETE' });
}

async function createPolicy(overrides: Record<string, unknown> = {}) {
  const response = await invoke(
    POST,
    postRequest({ scope: 'IP', value: '192.168.1.1', action: 'ALLOW', ...overrides }),
  );
  const body = await response.json();
  return body.data as { id: string; scope: string; value: string; action: string };
}

describe('GET /api/admin/network-policies', () => {
  it('returns the policy list in a success envelope', async () => {
    const response = await invoke(GET, new Request(POLICIES_URL));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe('POST /api/admin/network-policies', () => {
  it('creates a policy for each accepted scope (IP, CIDR, COUNTRY)', async () => {
    const response = await invoke(
      POST,
      postRequest({ scope: 'CIDR', value: '10.0.0.0/8', action: 'DENY', description: 'private' }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toMatch(/^np_/);
    expect(body.data.scope).toBe('CIDR');
    expect(body.data.value).toBe('10.0.0.0/8');
    expect(body.data.action).toBe('DENY');
    expect(body.data.description).toBe('private');
    expect(body.data.createdAt).toEqual(expect.any(String));

    const countryRes = await invoke(
      POST,
      postRequest({ scope: 'COUNTRY', value: 'US', action: 'ALLOW' }),
    );
    const countryBody = await countryRes.json();

    expect(countryRes.status).toBe(201);
    expect(countryBody.success).toBe(true);
    expect(countryBody.data.scope).toBe('COUNTRY');
    expect(countryBody.data.value).toBe('US');
    expect(countryBody.data.action).toBe('ALLOW');
    expect(countryBody.data.description).toBeUndefined();
  });

  it('trims the stored value and caps the description at 200 characters', async () => {
    const response = await invoke(
      POST,
      postRequest({
        scope: 'IP',
        value: '  192.168.1.1  ',
        action: 'ALLOW',
        description: 'a'.repeat(250),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.value).toBe('192.168.1.1');
    expect(body.data.description).toHaveLength(200);
  });

  it('gives every policy a distinct id', async () => {
    const first = await createPolicy({ value: '10.0.0.1' });
    const second = await createPolicy({ value: '10.0.0.2' });

    expect(first.id).not.toBe(second.id);
  });

  it('returns 400 for an unrecognised scope', async () => {
    const response = await invoke(
      POST,
      postRequest({ scope: 'ASN', value: 'AS12345', action: 'ALLOW' }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid scope');
  });

  it('returns 400 when the value is missing or blank', async () => {
    const missing = await invoke(POST, postRequest({ scope: 'IP', action: 'ALLOW' }));
    expect(missing.status).toBe(400);
    expect((await missing.json()).message).toBe('Value is required');

    const blank = await invoke(POST, postRequest({ scope: 'IP', value: '   ', action: 'ALLOW' }));
    expect(blank.status).toBe(400);
    expect((await blank.json()).message).toBe('Value is required');
  });

  it('returns 400 for an unrecognised action', async () => {
    const response = await invoke(
      POST,
      postRequest({ scope: 'IP', value: '192.168.1.1', action: 'LOG' }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid action');
  });

  it('returns 400 when the body cannot be parsed as JSON', async () => {
    const request = createRequest(POLICIES_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });

    const response = await invoke(POST, request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid request body');
  });
});

describe('DELETE /api/admin/network-policies', () => {
  it('returns 400 when no id is supplied', async () => {
    const response = await invoke(DELETE, deleteRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('id is required');
  });

  it('returns 404 for an id that does not exist', async () => {
    const response = await invoke(DELETE, deleteRequest('np_missing'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Policy not found');
  });

  it('removes a stored policy and leaves it out of the list', async () => {
    const policy = await createPolicy({ value: '203.0.113.7' });

    const before = await (await invoke(GET, new Request(POLICIES_URL))).json();
    expect(before.data.map((entry: { id: string }) => entry.id)).toContain(policy.id);

    const response = await invoke(DELETE, deleteRequest(policy.id));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const after = await (await invoke(GET, new Request(POLICIES_URL))).json();
    expect(after.data.map((entry: { id: string }) => entry.id)).not.toContain(policy.id);
  });

  it('returns 404 when the same policy is deleted twice', async () => {
    const policy = await createPolicy({ value: '198.51.100.4' });

    const first = await invoke(DELETE, deleteRequest(policy.id));
    expect(first.status).toBe(200);

    const second = await invoke(DELETE, deleteRequest(policy.id));
    const body = await second.json();

    expect(second.status).toBe(404);
    expect(body.message).toBe('Policy not found');
  });
});
