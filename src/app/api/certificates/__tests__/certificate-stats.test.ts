import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getStats } from '../stats/route';
import { DELETE as revokeCert } from '../[id]/route';
import { getCertificateStats, getCertificateById } from '@/services/certificate-service';
import { requireAuth } from '@/lib/authMiddleware';

vi.mock('@/lib/authMiddleware', () => ({
  requireAuth: vi.fn(() => null),
}));

describe('Certificate Analytics API & Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCertificateStats returns valid aggregation data', async () => {
    const stats = await getCertificateStats();
    expect(stats).toBeDefined();
    expect(stats.totalIssued).toBeGreaterThanOrEqual(9);
    expect(stats.totalActive).toBeGreaterThanOrEqual(8);
    expect(stats.totalRevoked).toBe(1);
    expect(stats.completionsByCourse).toBeInstanceOf(Array);
    expect(stats.completionsByMonth).toBeInstanceOf(Array);
  });

  it('GET /api/certificates/stats returns successfully when authenticated', async () => {
    const req = new NextRequest('http://localhost/api/certificates/stats');
    const res = await getStats(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalIssued).toBeDefined();
    expect(body.totalActive).toBeDefined();
    expect(body.totalRevoked).toBeDefined();
  });

  it('DELETE /api/certificates/:id successfully revokes certificate', async () => {
    // Let's use the first mock certificate ID
    const targetCertId = 'cert-0000-0000-0000-000000000001';

    const req = new NextRequest(`http://localhost/api/certificates/${targetCertId}`, {
      method: 'DELETE',
    });

    const res = await revokeCert(req, { params: { id: targetCertId } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const cert = await getCertificateById(targetCertId);
    expect(cert?.revokedAt).toBeDefined();
  });
});
