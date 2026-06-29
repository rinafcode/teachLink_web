import { describe, expect, it, beforeEach, vi } from 'vitest';
import { GET as verifyGET, POST as verifyPOST } from '../email-verification/verify/route';
import { POST as resendPOST } from '../email-verification/resend/route';
import { POST as restorePOST } from '../email-verification/restore/route';
import { POST as signupPOST } from '../../signup/route';
import { POST as loginPOST } from '../../login/route';

vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

vi.mock('@/services/notifications', () => ({
  notificationService: {
    sendEmailVerificationEmail: vi.fn().mockResolvedValue({ success: true, provider: 'mock' }),
  },
}));

vi.mock('@/lib/auth/email-verification', () => ({
  createOrRestoreVerification: vi.fn(),
  getVerificationStatus: vi.fn(),
  verifyEmailToken: vi.fn(),
  resendVerificationEmail: vi.fn(),
  restoreVerificationEmail: vi.fn(),
  buildVerificationMailContext: vi.fn((record, verificationToken, backupCode) => ({
    email: record.email,
    name: record.name,
    verificationUrl: `https://teachlink.test/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      record.email,
    )}`,
    restoreUrl: `https://teachlink.test/verify-email?restore=1&email=${encodeURIComponent(
      record.email,
    )}`,
    backupCode,
    expiresInMinutes: 15,
  })),
  getVerificationTokenTtlMinutes: vi.fn(() => 15),
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/lib/db/pool', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/pool')>();
  return {
    ...actual,
    findUserByEmail: vi.fn(),
  };
});

describe('email verification routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns verification details from signup', async () => {
    const { createOrRestoreVerification } = await import('@/lib/auth/email-verification');
    vi.mocked(createOrRestoreVerification).mockResolvedValue({
      record: {
        verificationId: 'verify-1',
        email: 'student@teachlink.com',
        emailNormalized: 'student@teachlink.com',
        name: 'Student',
        status: 'pending',
        verificationTokenHash: 'hash',
        backupCodeHash: 'backup-hash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        backupCodeExpiresAt: new Date(Date.now() + 86400000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
        resendCount: 0,
      },
      verificationToken: 'raw-token',
      backupCode: 'BACKUP123',
    } as any);

    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Student',
        email: 'student@teachlink.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      }),
    }) as any;

    const response = await signupPOST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.verification.required).toBe(true);
    expect(body.verification.sessionId).toBe('verify-1');
    expect(body.user.email).toBe('student@teachlink.com');
    expect(body.token).toContain('mock-jwt-token');
    expect(body).not.toHaveProperty('verificationToken');
  });

  it('blocks login until verification is complete', async () => {
    const { getVerificationStatus } = await import('@/lib/auth/email-verification');
    const { findUserByEmail } = await import('@/lib/db/pool');
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'user-1',
      password_hash: 'hashed-password',
      role: 'STUDENT',
    });
    vi.mocked(getVerificationStatus).mockResolvedValue({
      required: true,
      status: 'pending',
      sessionId: 'verify-1',
      expiresAt: new Date(Date.now() + 900000).toISOString(),
      resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
    });

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'student@teachlink.com',
        password: 'secret123',
      }),
    }) as any;

    const response = await loginPOST(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.message).toBe('Email verification required');
    expect(body.verification.status).toBe('pending');
  });

  it('verifies email tokens', async () => {
    const { verifyEmailToken } = await import('@/lib/auth/email-verification');
    vi.mocked(verifyEmailToken).mockResolvedValue({ status: 'verified' });

    const request = new Request(
      'http://localhost/api/auth/email-verification/verify?token=test-token',
      {
        method: 'GET',
      },
    ) as any;

    const response = await verifyGET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.status).toBe('verified');
  });

  it('supports verify via POST body', async () => {
    const { verifyEmailToken } = await import('@/lib/auth/email-verification');
    vi.mocked(verifyEmailToken).mockResolvedValue({ status: 'already_verified' });

    const request = new Request('http://localhost/api/auth/email-verification/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'test-token', email: 'student@teachlink.com' }),
    }) as any;

    const response = await verifyPOST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.status).toBe('already_verified');
  });

  it('resends verification emails', async () => {
    const { resendVerificationEmail } = await import('@/lib/auth/email-verification');
    vi.mocked(resendVerificationEmail).mockResolvedValue({
      record: {
        verificationId: 'verify-2',
        email: 'student@teachlink.com',
        emailNormalized: 'student@teachlink.com',
        name: 'Student',
        status: 'pending',
        verificationTokenHash: 'hash-2',
        backupCodeHash: 'backup-hash-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        backupCodeExpiresAt: new Date(Date.now() + 86400000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
        resendCount: 1,
      },
      verificationToken: 'fresh-token',
      backupCode: 'BACKUP456',
    } as any);

    const request = new Request('http://localhost/api/auth/email-verification/resend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'student@teachlink.com' }),
    }) as any;

    const response = await resendPOST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.status).toBe('pending');
  });

  it('restores verification access with a backup code', async () => {
    const { restoreVerificationEmail } = await import('@/lib/auth/email-verification');
    vi.mocked(restoreVerificationEmail).mockResolvedValue({
      record: {
        verificationId: 'verify-3',
        email: 'student@teachlink.com',
        emailNormalized: 'student@teachlink.com',
        name: 'Student',
        status: 'pending',
        verificationTokenHash: 'hash-3',
        backupCodeHash: 'backup-hash-3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        backupCodeExpiresAt: new Date(Date.now() + 86400000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
        resendCount: 2,
      },
      verificationToken: 'restored-token',
      backupCode: 'BACKUP789',
    } as any);

    const request = new Request('http://localhost/api/auth/email-verification/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'student@teachlink.com',
        backupCode: 'BACKUP789',
      }),
    }) as any;

    const response = await restorePOST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.status).toBe('pending');
  });
});
