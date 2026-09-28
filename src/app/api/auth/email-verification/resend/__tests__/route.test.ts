/**
 * Colocated tests for the verification resend route handler
 * (src/app/api/auth/email-verification/resend/route.ts).
 *
 * The handler turns one library result into four different HTTP contracts
 * (pending resend, already verified, cooldown, unknown request) and validates
 * the body before it does, so both the success and the validation-failure
 * responses are pinned here.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

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
  resendVerificationEmail: vi.fn(),
  buildVerificationMailContext: vi.fn(() => ({
    email: 'student@teachlink.com',
    name: 'Student',
    verificationUrl: 'https://teachlink.test/verify-email?token=fresh-token',
    backupCode: 'BACKUP123',
    expiresInMinutes: 15,
  })),
  getVerificationTokenTtlMinutes: vi.fn(() => 15),
}));

vi.mock('@/services/notifications', () => ({
  notificationService: {
    sendEmailVerificationEmail: vi.fn().mockResolvedValue({ success: true, provider: 'mock' }),
  },
}));

import {
  buildVerificationMailContext,
  getVerificationTokenTtlMinutes,
  resendVerificationEmail,
} from '@/lib/auth/email-verification';
import { notificationService } from '@/services/notifications';

const RESEND_URL = 'http://localhost/api/auth/email-verification/resend';

/** The handler is declared for `NextRequest`; this test drives it with `Request`. */
type Handler = (request: Request) => Promise<Response>;

function invoke(handler: unknown, request: Request): Promise<Response> {
  return (handler as Handler)(request);
}

/**
 * The mocked result union carries more members than these cases assert on, so the
 * mock is driven through a narrow structural type instead of a cast per value.
 */
type Stub = {
  mockResolvedValue(value: unknown): void;
  mockRejectedValue(reason: unknown): void;
};

function stub(module: unknown): Stub {
  return module as Stub;
}

function postRequest(body: unknown): Request {
  return new Request(RESEND_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const pendingResult = {
  record: { email: 'student@teachlink.com', name: 'Student' },
  verificationToken: 'fresh-token',
  backupCode: 'BACKUP123',
};

describe('POST /api/auth/email-verification/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a new verification email and reports the token lifetime', async () => {
    stub(resendVerificationEmail).mockResolvedValue(pendingResult);

    const response = await invoke(POST, postRequest({ email: 'student@teachlink.com' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification).toEqual({ status: 'pending' });
    expect(body.message).toBe(
      `Verification email resent. It expires in ${getVerificationTokenTtlMinutes()} minutes.`,
    );
    expect(resendVerificationEmail).toHaveBeenCalledWith('student@teachlink.com');
  });

  it('builds the mail context from the fresh token and backup code', async () => {
    stub(resendVerificationEmail).mockResolvedValue(pendingResult);

    await invoke(POST, postRequest({ email: 'student@teachlink.com' }));

    expect(buildVerificationMailContext).toHaveBeenCalledWith(
      pendingResult.record,
      'fresh-token',
      'BACKUP123',
    );
    expect(notificationService.sendEmailVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'student@teachlink.com' }),
    );
  });

  it('reports an already verified email without sending another email', async () => {
    stub(resendVerificationEmail).mockResolvedValue({ status: 'already_verified' });

    const response = await invoke(POST, postRequest({ email: 'student@teachlink.com' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Email already verified');
    expect(body.verification).toEqual({ status: 'already_verified' });
    expect(notificationService.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 429 while the resend cooldown is still active', async () => {
    stub(resendVerificationEmail).mockResolvedValue({ status: 'cooldown' });

    const response = await invoke(POST, postRequest({ email: 'student@teachlink.com' }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.verification).toEqual({ status: 'cooldown' });
    expect(body.message).toBe('Please wait before requesting another verification email');
  });

  it('returns 410 when there is no verification request to resend', async () => {
    stub(resendVerificationEmail).mockResolvedValue({ status: 'not_found' });

    const response = await invoke(POST, postRequest({ email: 'student@teachlink.com' }));
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.message).toBe('Verification request not found');
    expect(body.verification).toEqual({ status: 'expired' });
  });

  it('returns 400 when the email is missing', async () => {
    const response = await invoke(POST, postRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual([{ field: 'email', message: 'Email is required' }]);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when the email is not a valid address', async () => {
    const response = await invoke(POST, postRequest({ email: 'not-an-email' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual([{ field: 'email', message: 'Invalid email address' }]);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 500 when the body cannot be parsed as JSON', async () => {
    const request = new Request(RESEND_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });

    const response = await invoke(POST, request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 500 when the resend lookup throws', async () => {
    stub(resendVerificationEmail).mockRejectedValue(new Error('database unavailable'));

    const response = await invoke(POST, postRequest({ email: 'student@teachlink.com' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });
});
