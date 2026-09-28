/**
 * Colocated tests for the email verification route handler
 * (src/app/api/auth/email-verification/verify/route.ts).
 *
 * The handler is the only place that decides how a verification token is read
 * and how each outcome is reported, so these tests pin both the success
 * contract (verified / already verified / expired) and the validation-failure
 * contract (missing or malformed token, malformed body, unexpected error).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../route';

vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

vi.mock('@/lib/auth/email-verification', () => ({
  verifyEmailToken: vi.fn(),
}));

import { verifyEmailToken } from '@/lib/auth/email-verification';

const VERIFY_URL = 'http://localhost/api/auth/email-verification/verify';

/** The handlers are declared for `NextRequest`; these tests drive them with `Request`. */
type Handler = (request: Request) => Promise<Response>;

function invoke(handler: unknown, request: Request): Promise<Response> {
  return (handler as Handler)(request);
}

/**
 * The mocked result unions carry more members than these cases assert on, so the
 * mocks are driven through a narrow structural type instead of a cast per value.
 */
type Stub = {
  mockResolvedValue(value: unknown): void;
  mockRejectedValue(reason: unknown): void;
};

function stub(module: unknown): Stub {
  return module as Stub;
}

function postRequest(body: unknown): Request {
  return new Request(VERIFY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/auth/email-verification/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies the token supplied as a query parameter', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'verified' });

    const response = await invoke(GET, new Request(`${VERIFY_URL}?token=query-token`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Email verified');
    expect(body.verification).toEqual({ status: 'verified' });
    expect(verifyEmailToken).toHaveBeenCalledWith('query-token');
  });

  it('falls back to the x-verification-token header when the query has no token', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'verified' });

    const request = new Request(VERIFY_URL, {
      headers: { 'x-verification-token': 'header-token' },
    });
    const response = await invoke(GET, request);

    expect(response.status).toBe(200);
    expect(verifyEmailToken).toHaveBeenCalledWith('header-token');
  });

  it('prefers the query parameter over the header', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'verified' });

    const request = new Request(`${VERIFY_URL}?token=query-token`, {
      headers: { 'x-verification-token': 'header-token' },
    });
    await invoke(GET, request);

    expect(verifyEmailToken).toHaveBeenCalledWith('query-token');
  });

  it('reports an already verified email without changing state', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'already_verified' });

    const response = await invoke(GET, new Request(`${VERIFY_URL}?token=used-token`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Email already verified');
    expect(body.verification).toEqual({ status: 'already_verified' });
  });

  it('returns 410 for an expired or unknown token', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'expired' });

    const response = await invoke(GET, new Request(`${VERIFY_URL}?token=stale-token`));
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.message).toBe('Verification token expired');
    expect(body.verification).toEqual({ status: 'expired' });
  });

  it('returns 400 when no token is supplied at all', async () => {
    const response = await invoke(GET, new Request(VERIFY_URL));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Verification token is required');
    expect(verifyEmailToken).not.toHaveBeenCalled();
  });

  it('returns 500 when verification throws', async () => {
    stub(verifyEmailToken).mockRejectedValue(new Error('hash comparison failed'));

    const response = await invoke(GET, new Request(`${VERIFY_URL}?token=query-token`));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });
});

describe('POST /api/auth/email-verification/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies the token supplied in the request body', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'verified' });

    const response = await invoke(POST, postRequest({ token: 'body-token' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification).toEqual({ status: 'verified' });
    expect(verifyEmailToken).toHaveBeenCalledWith('body-token');
  });

  it('accepts the token alongside the email it belongs to', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'already_verified' });

    const response = await invoke(
      POST,
      postRequest({ token: 'body-token', email: 'student@teachlink.com' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification).toEqual({ status: 'already_verified' });
  });

  it('falls back to the query parameter when the body omits the token', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'verified' });

    const request = new Request(`${VERIFY_URL}?token=query-token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'student@teachlink.com' }),
    });
    await invoke(POST, request);

    expect(verifyEmailToken).toHaveBeenCalledWith('query-token');
  });

  it('returns 400 for a body that fails validation', async () => {
    const response = await invoke(POST, postRequest({ email: 'not-an-email' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual([{ field: 'email', message: 'Invalid email address' }]);
    expect(verifyEmailToken).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty token string', async () => {
    const response = await invoke(POST, postRequest({ token: '' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(verifyEmailToken).not.toHaveBeenCalled();
  });

  it('returns 400 when neither the body nor the request carries a token', async () => {
    const response = await invoke(POST, postRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Verification token is required');
    expect(verifyEmailToken).not.toHaveBeenCalled();
  });

  it('returns 410 for an expired or unknown token', async () => {
    stub(verifyEmailToken).mockResolvedValue({ status: 'expired' });

    const response = await invoke(POST, postRequest({ token: 'stale-token' }));
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.verification).toEqual({ status: 'expired' });
  });

  it('returns 500 when verification throws', async () => {
    stub(verifyEmailToken).mockRejectedValue(new Error('hash comparison failed'));

    const response = await invoke(POST, postRequest({ token: 'body-token' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });
});
