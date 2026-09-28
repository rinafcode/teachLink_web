/**
 * Colocated tests for the verification restore route handler
 * (src/app/api/auth/email-verification/restore/route.ts).
 *
 * Restoring trades a backup code for a fresh verification token, so the handler
 * has four success-shaped outcomes plus a validation failure path; each is
 * pinned here together with the email that is sent on a successful restore.
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
  restoreVerificationEmail: vi.fn(),
  buildVerificationMailContext: vi.fn(() => ({
    email: 'student@teachlink.com',
    name: 'Student',
    verificationUrl: 'https://teachlink.test/verify-email?token=restored-token',
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
  restoreVerificationEmail,
} from '@/lib/auth/email-verification';
import { notificationService } from '@/services/notifications';

const RESTORE_URL = 'http://localhost/api/auth/email-verification/restore';

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
  return new Request(RESTORE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const pendingResult = {
  record: { email: 'student@teachlink.com', name: 'Student' },
  verificationToken: 'restored-token',
  backupCode: 'BACKUP123',
};

describe('POST /api/auth/email-verification/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores access with a backup code and emails the new token', async () => {
    stub(restoreVerificationEmail).mockResolvedValue(pendingResult);

    const response = await invoke(
      POST,
      postRequest({ email: 'student@teachlink.com', backupCode: 'BACKUP123' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification).toEqual({ status: 'pending' });
    expect(body.message).toBe(
      `Verification restored. It expires in ${getVerificationTokenTtlMinutes()} minutes.`,
    );
    expect(restoreVerificationEmail).toHaveBeenCalledWith({
      email: 'student@teachlink.com',
      backupCode: 'BACKUP123',
    });
  });

  it('builds the mail context from the restored token and backup code', async () => {
    stub(restoreVerificationEmail).mockResolvedValue(pendingResult);

    await invoke(POST, postRequest({ email: 'student@teachlink.com', backupCode: 'BACKUP123' }));

    expect(buildVerificationMailContext).toHaveBeenCalledWith(
      pendingResult.record,
      'restored-token',
      'BACKUP123',
    );
    expect(notificationService.sendEmailVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'student@teachlink.com' }),
    );
  });

  it('reports an already verified email without sending another email', async () => {
    stub(restoreVerificationEmail).mockResolvedValue({ status: 'already_verified' });

    const response = await invoke(
      POST,
      postRequest({ email: 'student@teachlink.com', backupCode: 'BACKUP123' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Email already verified');
    expect(body.verification).toEqual({ status: 'already_verified' });
    expect(notificationService.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 404 when no verification record matches the email', async () => {
    stub(restoreVerificationEmail).mockResolvedValue({ status: 'not_found' });

    const response = await invoke(
      POST,
      postRequest({ email: 'unknown@teachlink.com', backupCode: 'BACKUP123' }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe('Verification record not found');
    expect(body.verification).toEqual({ status: 'not_found' });
  });

  it('returns 410 when the backup code itself has expired', async () => {
    stub(restoreVerificationEmail).mockResolvedValue({ status: 'expired' });

    const response = await invoke(
      POST,
      postRequest({ email: 'student@teachlink.com', backupCode: 'BACKUP123' }),
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.message).toBe('Backup code expired');
    expect(body.verification).toEqual({ status: 'expired' });
  });

  it('returns 400 when the backup code is missing', async () => {
    const response = await invoke(POST, postRequest({ email: 'student@teachlink.com' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual([{ field: 'backupCode', message: 'Backup code is required' }]);
    expect(restoreVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when the email is not a valid address', async () => {
    const response = await invoke(
      POST,
      postRequest({ email: 'not-an-email', backupCode: 'BACKUP123' }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual([{ field: 'email', message: 'Invalid email address' }]);
    expect(restoreVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 500 when the restore lookup throws', async () => {
    stub(restoreVerificationEmail).mockRejectedValue(new Error('database unavailable'));

    const response = await invoke(
      POST,
      postRequest({ email: 'student@teachlink.com', backupCode: 'BACKUP123' }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });
});
