import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { SignupRequestSchema } from '@/types/api/auth.dto';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';
import { notificationService } from '@/services/notifications';
import {
  buildVerificationMailContext,
  createOrRestoreVerification,
} from '@/lib/auth/email-verification';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  const route = '/api/auth/signup';
  edgeLog('info', route, 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const result = validateBody(SignupRequestSchema, await request.json());
    if (!result.ok) {
      edgeLog('warn', route, 'Validation failed', { reason: 'schema' });
      return addHeaders(result.error) as NextResponse;
    }

    const { name, email, password, confirmPassword, referralCode } = result.data;

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      edgeLog('warn', route, 'Validation failed', { reason: 'missing_fields' });
      return addHeaders(NextResponse.json({ message: 'All fields are required' }, { status: 400 }));
    }

    if (password !== confirmPassword) {
      edgeLog('warn', route, 'Validation failed', { reason: 'password_mismatch' });
      return addHeaders(NextResponse.json({ message: "Passwords don't match" }, { status: 400 }));
    }

    if (password.length < 6) {
      edgeLog('warn', route, 'Validation failed', { reason: 'password_too_short' });
      return addHeaders(
        NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 }),
      );
    }

    // Validate referral code if provided
    if (referralCode) {
      const validation = validateReferralCode(referralCode);
      if (!validation.isValid) {
        edgeLog('warn', route, 'Validation failed', {
          reason: 'invalid_referral_code',
          error: validation.error,
        });
        return addHeaders(
          NextResponse.json(
            { message: validation.error || 'Invalid referral code' },
            { status: 400 },
          ),
        );
      }

      // Check if referral code exists (mock implementation)
      if (!referralCodeExists(referralCode)) {
        edgeLog('warn', route, 'Validation failed', { reason: 'referral_code_not_found' });
        return addHeaders(
          NextResponse.json({ message: 'Referral code not found' }, { status: 404 }),
        );
      }

      // Prevent self-referral (check if the referral code belongs to the same email)
      const referrerEmail = getReferralCodeOwner(referralCode);
      if (referrerEmail === email) {
        edgeLog('warn', route, 'Validation failed', { reason: 'self_referral' });
        return addHeaders(
          NextResponse.json({ message: 'Cannot use your own referral code' }, { status: 400 }),
        );
      }
    }

    // Mock: block already-registered email
    if (email === 'existing@teachlink.com') {
      edgeLog('warn', route, 'Registration conflict', { reason: 'email_exists' });
      return addHeaders(
        NextResponse.json({ message: 'Email already registered' }, { status: 409 }),
      );
    }

    const verificationResult = await createOrRestoreVerification({ email, name });

    if ('status' in verificationResult && verificationResult.status === 'already_verified') {
      edgeLog('warn', route, 'Registration conflict', { reason: 'email_verified' });
      return addHeaders(NextResponse.json({ message: 'Email already verified' }, { status: 409 }));
    }

    const mailContext = buildVerificationMailContext(
      verificationResult.record,
      verificationResult.verificationToken,
      verificationResult.backupCode,
    );
    const emailResult = await notificationService.sendEmailVerificationEmail(mailContext);
    if (!emailResult.success) {
      edgeLog('warn', route, 'Verification email delivery failed', {
        provider: emailResult.provider,
        error: emailResult.error,
      });
    }

    const userId = randomUUID();
    edgeLog('info', route, 'Account created', {
      userId,
      verificationId: verificationResult.record.verificationId,
    });

    return addHeaders(
      NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: userId,
            name,
            email,
            referralCode: userReferralCode,
            referredBy: referralCode || null,
            referralCount: 0,
            role: 'STUDENT',
          },
          token: `mock-jwt-token-${Date.now()}`,
          verification: {
            required: true,
            status: verificationResult.record.status,
            sessionId: verificationResult.record.verificationId,
            expiresAt: verificationResult.record.expiresAt,
            resendAvailableAt: verificationResult.record.resendAvailableAt,
          },
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    edgeLog('error', route, 'Unhandled signup error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
