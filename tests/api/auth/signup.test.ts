import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/signup/route';
import { NextRequest } from 'next/server';
import * as referral from '@/lib/referral';
import * as emailVerification from '@/lib/auth/email-verification';
import { notificationService } from '@/services/notifications';

// Mock dependencies
vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: any) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

vi.mock('@/services/notifications', () => ({
  notificationService: {
    sendEmailVerificationEmail: vi.fn(() =>
      Promise.resolve({ success: true, provider: 'mock' }),
    ),
  },
}));

vi.mock('@/lib/auth/email-verification', () => ({
  createOrRestoreVerification: vi.fn(() =>
    Promise.resolve({
      record: {
        verificationId: 'mock-verification-id',
        status: 'pending',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 300000).toISOString(),
      },
      verificationToken: 'mock-token',
      backupCode: 'mock-backup',
    }),
  ),
  buildVerificationMailContext: vi.fn((record, token, backup) => ({
    to: 'test@example.com',
    record,
    token,
    backup,
  })),
}));

// Spy on referral functions
vi.spyOn(referral, 'validateReferralCode');
vi.spyOn(referral, 'referralCodeExists');
vi.spyOn(referral, 'getReferralCodeOwner');
vi.spyOn(referral, 'generateReferralCode');

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully signup with a valid referral code', async () => {
    const validReferralCode = 'ABCD1234';

    // Setup mock referral code
    referral.storeReferralCode('referrer@example.com', validReferralCode);

    const requestBody = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      referralCode: validReferralCode,
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Verify referral functions were called
    expect(referral.validateReferralCode).toHaveBeenCalledWith(validReferralCode);
    expect(referral.referralCodeExists).toHaveBeenCalledWith(validReferralCode);
    expect(referral.getReferralCodeOwner).toHaveBeenCalledWith(validReferralCode);
    expect(referral.generateReferralCode).toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(201);
    expect(data.message).toBe('Account created successfully');
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.user.name).toBe('Test User');
    expect(data.user.referredBy).toBe(validReferralCode);
    expect(data.user.referralCode).toBeDefined();
    expect(data.user.referralCode.length).toBe(8);
    expect(data.token).toBeDefined();
    expect(data.verification).toBeDefined();
  });

  it('should reject invalid referral code format', async () => {
    const invalidReferralCode = 'INVALID!';

    const requestBody = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      referralCode: invalidReferralCode,
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(referral.validateReferralCode).toHaveBeenCalledWith(invalidReferralCode);
    expect(response.status).toBe(400);
    expect(data.message).toContain('invalid characters');
  });

  it('should reject non-existent referral code', async () => {
    const nonExistentCode = 'ABCD9999';

    const requestBody = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      referralCode: nonExistentCode,
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(referral.validateReferralCode).toHaveBeenCalledWith(nonExistentCode);
    expect(referral.referralCodeExists).toHaveBeenCalledWith(nonExistentCode);
    expect(response.status).toBe(404);
    expect(data.message).toBe('Referral code not found');
  });

  it('should prevent self-referral', async () => {
    const ownReferralCode = 'SELF1234';
    const userEmail = 'user@example.com';

    // Setup mock referral code owned by the same user
    referral.storeReferralCode(userEmail, ownReferralCode);

    const requestBody = {
      name: 'Test User',
      email: userEmail,
      password: 'password123',
      confirmPassword: 'password123',
      referralCode: ownReferralCode,
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(referral.getReferralCodeOwner).toHaveBeenCalledWith(ownReferralCode);
    expect(response.status).toBe(400);
    expect(data.message).toBe('Cannot use your own referral code');
  });

  it('should successfully signup without a referral code', async () => {
    const requestBody = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Verify referral functions were NOT called when no code provided
    expect(referral.validateReferralCode).not.toHaveBeenCalled();
    expect(referral.referralCodeExists).not.toHaveBeenCalled();
    expect(referral.getReferralCodeOwner).not.toHaveBeenCalled();

    // But generateReferralCode should still be called for the new user
    expect(referral.generateReferralCode).toHaveBeenCalled();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Account created successfully');
    expect(data.user.referredBy).toBeNull();
    expect(data.user.referralCode).toBeDefined();
  });

  it('should reject mismatched passwords', async () => {
    const requestBody = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'different123',
      referralCode: 'ABCD1234',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Passwords don't match");
    // Referral validation should not be reached
    expect(referral.validateReferralCode).not.toHaveBeenCalled();
  });

  it('should reject short passwords', async () => {
    const requestBody = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: '12345',
      confirmPassword: '12345',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Password must be at least 6 characters');
  });
});
