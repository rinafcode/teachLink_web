import { afterEach, describe, expect, it } from 'vitest';
import { GET } from '../route';

const report = JSON.stringify({
  id: 'vpat-1.2.3',
  productName: 'TeachLink',
  version: '1.2.3',
  generatedAt: '2026-08-25T00:00:00.000Z',
  findings: [
    { criterionId: '1.1.1', level: 'supports', remark: 'Alternative text is provided.' },
  ],
});

afterEach(() => {
  delete process.env.VPAT_REPORT_JSON;
});

describe('GET /api/accessibility/vpat/[version]', () => {
  it('serves the matching deployment artifact with immutable CDN headers', async () => {
    process.env.VPAT_REPORT_JSON = report;

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ version: '1.2.3.json' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, s-maxage=31536000, immutable',
    );
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    await expect(response.json()).resolves.toMatchObject({ version: '1.2.3' });
  });

  it('returns 404 when the artifact is missing or has another version', async () => {
    process.env.VPAT_REPORT_JSON = report;

    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ version: '1.2.4.json' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'VPAT report not found' });
  });

  it('returns 404 for malformed encoded versions', async () => {
    const response = await GET(new Request('https://example.com'), {
      params: Promise.resolve({ version: '%E0%A4%A.json' }),
    });

    expect(response.status).toBe(404);
  });
});