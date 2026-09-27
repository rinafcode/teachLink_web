import type { NextRequest, NextResponse } from 'next/server';
import {
  CSP_HEADER,
  CSP_NONCE_RESPONSE_HEADER,
  DEFAULT_CSP_REPORT_GROUP,
  DEFAULT_CSP_REPORT_URI,
  buildCspHeader,
  generateNonce,
  getRequestNonce,
} from './csp';

export interface SecurityHeaderOptions {
  isHttps: boolean;
  reportingPath?: string;
  /**
   * Per-request CSP nonce. When present a nonce-based `Content-Security-Policy`
   * is emitted alongside the other security headers, so a response can never
   * carry the transport hardening without the script policy that goes with it.
   */
  nonce?: string;
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const reportingPath = options.reportingPath ?? DEFAULT_CSP_REPORT_URI;
  const reportTo = {
    group: DEFAULT_CSP_REPORT_GROUP,
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
      report_to: DEFAULT_CSP_REPORT_GROUP,
      max_age: 10886400,
      include_subdomains: true,
      success_fraction: 0,
      failure_fraction: 1,
    }),
  };

  if (options.nonce) {
    headers[CSP_HEADER] = buildCspHeader({
      nonce: options.nonce,
      strict: true,
      reportUri: reportingPath,
    });
    headers[CSP_NONCE_RESPONSE_HEADER] = options.nonce;
  }

  if (options.isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Apply the security headers, including the nonce-based CSP. The nonce comes
 * from the middleware's request header so every layer of the response pipeline
 * agrees on the same value.
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  nonce?: string,
): NextResponse {
  const isHttps = request.nextUrl.protocol === 'https:';
  const headers = buildSecurityHeaders({
    isHttps,
    nonce: nonce ?? getRequestNonce(request) ?? generateNonce(),
  });

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/** Entropy (in bytes) for a generated OAuth state nonce — 256 bits. */
const OAUTH_STATE_BYTES = 32;

/**
 * Generate a cryptographically random OAuth `state` nonce.
 *
 * The OAuth `state` parameter must be unpredictable. A guessable value lets an
 * attacker prefix the flow with a state they control, then submit the victim's
 * authorization code back to the callback as a login CSRF. `Math.random()` is
 * seeded by time and is not cryptographically strong, so the value is drawn
 * from the CSPRNG (`crypto.getRandomValues`) available on the edge runtime.
 */
export function generateOAuthState(byteLength: number = OAUTH_STATE_BYTES): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time comparison of an OAuth `state` nonce against the stored value.
 * The value supplied on the callback (`actual`) must match the value stored
 * when the flow started (`expected`); any mismatch aborts the exchange.
 */
export function validateOAuthState(actual?: string, expected?: string): boolean {
  if (!actual || !expected || actual.length !== expected.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return diff === 0;
}
