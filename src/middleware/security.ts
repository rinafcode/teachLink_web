import type { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeaderOptions {
  isHttps: boolean;
  reportingPath?: string;
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const reportingPath = options.reportingPath ?? '/api/security/reporting';
  const reportTo = {
    group: 'security',
    max_age: 10886400,
    endpoints: [{ url: reportingPath }],
    include_subdomains: true,
  };

  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'X-DNS-Prefetch-Control': 'off',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Report-To': JSON.stringify(reportTo),
    NEL: JSON.stringify({
      report_to: 'security',
      max_age: 10886400,
      include_subdomains: true,
      success_fraction: 0,
      failure_fraction: 1,
    }),
  };

  if (options.isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }

  return headers;
}

export function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const isHttps = request.nextUrl.protocol === 'https:';
  const headers = buildSecurityHeaders({ isHttps });

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
