import { describe, expect, it } from 'vitest';
import {
  VPAT_CDN_CACHE_CONTROL,
  getVPATCDNUrl,
  parsePublishedVPATReport,
} from '../accessibilityReporting';

const report = JSON.stringify({
  id: 'vpat-mly8g4c0',
  productName: 'TeachLink',
  version: '1.2.3',
  generatedAt: '2026-08-25T00:00:00.000Z',
  findings: [
    {
      criterionId: '1.1.1',
      level: 'supports',
      remark: 'Images have alternative text.',
    },
  ],
});

describe('VPAT CDN integration', () => {
  it('builds a versioned relative CDN URL', () => {
    expect(getVPATCDNUrl('1.2.3')).toBe('/api/accessibility/vpat/1.2.3.json');
  });

  it('supports a configured CDN origin and preserves its path', () => {
    expect(getVPATCDNUrl('2026.08', 'https://cdn.example.com/compliance')).toBe(
      'https://cdn.example.com/compliance/api/accessibility/vpat/2026.08.json',
    );
  });

  it('rejects path traversal and unsafe CDN origins', () => {
    expect(() => getVPATCDNUrl('../latest')).toThrow();
    expect(() => getVPATCDNUrl('1.0', 'javascript:alert(1)')).toThrow();
  });

  it('parses only a report matching the requested immutable version', () => {
    expect(parsePublishedVPATReport(report, '1.2.3')?.productName).toBe('TeachLink');
    expect(parsePublishedVPATReport(report, '1.2.4')).toBeNull();
    expect(parsePublishedVPATReport('{"version":"1.2.3"}', '1.2.3')).toBeNull();
  });

  it('uses immutable cache directives for versioned reports', () => {
    expect(VPAT_CDN_CACHE_CONTROL).toContain('immutable');
    expect(VPAT_CDN_CACHE_CONTROL).toContain('s-maxage=31536000');
  });
});