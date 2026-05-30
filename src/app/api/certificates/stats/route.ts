import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { getCertificateStats } from '@/services/certificate-service';

const logger = createLogger('certificates-stats');

/**
 * GET /api/certificates/stats
 *
 * Returns aggregated statistics for certificate completion analytics.
 */
export async function GET(request: NextRequest) {
  // Check auth
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Unauthorized attempt to read certificate stats');
    return authError;
  }

  try {
    const stats = await getCertificateStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    logger.error('Failed to retrieve certificate stats', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
