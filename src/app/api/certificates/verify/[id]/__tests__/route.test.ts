/**
 * Colocated tests for the certificate verification route handler
 * (src/app/api/certificates/verify/[id]/route.ts).
 *
 * The handler is the only place that decides how a certificate id is
 * verified and how each outcome is reported, so these tests pin both the
 * success contract (validated verification payload, cache headers) and the
 * failure contract (unknown/revoked certificate, invalid service payload,
 * unexpected error).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

vi.mock('@/services/certificate-service', () => ({
  verifyCertificate: vi.fn(),
}));

import { verifyCertificate } from '@/services/certificate-service';

const VERIFY_URL = 'http://localhost/api/certificates/verify';

/**
 * The handler is declared for `NextRequest` with a `{ params }` context;
 * these tests drive it with a plain `Request` and a literal params object.
 */
type Handler = (
  request: Request,
  context: { params: { id: string } },
) => Promise<Response>;

function invoke(handler: unknown, request: Request, id: string): Promise<Response> {
  return (handler as Handler)(request, { params: { id } });
}

/**
 * The mocked result union carries more members than these cases assert on, so
 * the mock is driven through a narrow structural type instead of a cast per
 * value.
 */
type Stub = {
  mockResolvedValue(value: unknown): void;
  mockRejectedValue(reason: unknown): void;
};

function stub(module: unknown): Stub {
  return module as Stub;
}

const VALID_VERIFICATION = {
  valid: true,
  certificateId: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
  courseId: '33333333-3333-4333-8333-333333333333',
  issuedAt: '2026-09-01T00:00:00.000Z',
  completionDate: '2026-08-15T00:00:00.000Z',
};

describe('GET /api/certificates/verify/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the validated verification payload for a genuine certificate', async () => {
    stub(verifyCertificate).mockResolvedValue(VALID_VERIFICATION);

    const response = await invoke(
      GET,
      new Request(`${VERIFY_URL}/cert-123`),
      'cert-123',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(VALID_VERIFICATION);
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(verifyCertificate).toHaveBeenCalledWith('cert-123');
  });

  it('returns 404 when the certificate is not found, revoked, or invalid', async () => {
    stub(verifyCertificate).mockResolvedValue(null);

    const response = await invoke(
      GET,
      new Request(`${VERIFY_URL}/missing-cert`),
      'missing-cert',
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.valid).toBe(false);
    expect(body.error).toBe('Certificate not found, revoked, or invalid');
    expect(verifyCertificate).toHaveBeenCalledWith('missing-cert');
  });

  it('returns 500 when the service payload fails response validation', async () => {
    stub(verifyCertificate).mockResolvedValue({
      valid: true,
      certificateId: 'not-a-uuid',
    });

    const response = await invoke(
      GET,
      new Request(`${VERIFY_URL}/cert-123`),
      'cert-123',
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Verification response validation failed');
  });

  it('returns 500 when verification throws', async () => {
    stub(verifyCertificate).mockRejectedValue(new Error('database unavailable'));

    const response = await invoke(
      GET,
      new Request(`${VERIFY_URL}/cert-123`),
      'cert-123',
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to verify certificate');
  });
});
