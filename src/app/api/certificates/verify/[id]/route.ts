import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logging';
import { verifyCertificate } from '@/services/certificate-service';
import { CertificateVerificationSchema } from '@/schemas/certificate.schema';

const logger = createLogger('certificates-verify');

/**
 * GET /api/certificates/verify/:id
 *
 * Public endpoint to verify certificate authenticity.
 * No authentication required.
 *
 * SECURITY: Uses cryptographic hash verification to ensure certificate integrity.
 * Third parties can verify certificates without accessing any user credentials.
 *
 * SECURITY CHECKS:
 * ✓ T3: Hash verification prevents forgery
 * ✓ T8: Access is logged for audit purposes (optional)
 * ✓ Rate limiting not applied (public endpoint, non-resource-intensive)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const certificateId = params.id;

  try {
    // Verify certificate authenticity
    const verification = await verifyCertificate(certificateId);

    if (!verification) {
      logger.warn('Certificate verification failed', {
        context: { certificateId },
      });

      return NextResponse.json(
        {
          valid: false,
          error: 'Certificate not found, revoked, or invalid',
        },
        { status: 404 },
      );
    }

    // Validate response against schema
    const validated = CertificateVerificationSchema.safeParse(verification);
    if (!validated.success) {
      logger.error('Certificate verification response validation failed', {
        context: { certificateId },
      });

      return NextResponse.json(
        { error: 'Verification response validation failed' },
        { status: 500 },
      );
    }

    logger.info('Certificate verified successfully', {
      context: { certificateId, userId: verification.userId },
    });

    // Return verification result
    return NextResponse.json(validated.data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    logger.error('Certificate verification error', {
      context: { certificateId },
      error,
    });

    return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 });
  }
}
