import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from '../security';

describe('buildSecurityHeaders', () => {
  it('returns critical security headers for all environments', () => {
    const headers = buildSecurityHeaders({ isHttps: false });

    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Report-To']).toContain('security');
    expect(headers['NEL']).toContain('report_to');
  });

  it('adds HSTS only over HTTPS', () => {
    const insecureHeaders = buildSecurityHeaders({ isHttps: false });
    const secureHeaders = buildSecurityHeaders({ isHttps: true });

    expect(insecureHeaders['Strict-Transport-Security']).toBeUndefined();
    expect(secureHeaders['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains; preload',
    );
  });
});
