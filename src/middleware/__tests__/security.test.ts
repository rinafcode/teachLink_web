import { describe, expect, it } from 'vitest';
import type { NextRequest, NextResponse } from 'next/server';
import {
  applySecurityHeaders,
  buildSecurityHeaders,
  generateOAuthState,
  validateOAuthState,
} from '../security';
import { CSP_NONCE_REQUEST_HEADER, CSP_NONCE_RESPONSE_HEADER, containsUnsafeSources } from '../csp';

function createRequest(options: { nonce?: string; protocol?: string } = {}): NextRequest {
  const headers = new Headers();
  if (options.nonce) headers.set(CSP_NONCE_REQUEST_HEADER, options.nonce);

  return {
    headers,
    nextUrl: { protocol: options.protocol ?? 'https:' },
  } as unknown as NextRequest;
}

function createResponse(): NextResponse {
  return { headers: new Headers() } as unknown as NextResponse;
}

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

  it('emits a nonce-based CSP when a nonce is supplied', () => {
    const headers = buildSecurityHeaders({ isHttps: true, nonce: 'test-nonce' });

    expect(headers['Content-Security-Policy']).toContain("'nonce-test-nonce'");
    expect(containsUnsafeSources(headers['Content-Security-Policy'])).toBe(false);
    expect(headers[CSP_NONCE_RESPONSE_HEADER]).toBe('test-nonce');
  });

  it('leaves the CSP to the caller when no nonce is supplied', () => {
    const headers = buildSecurityHeaders({ isHttps: true });

    expect(headers['Content-Security-Policy']).toBeUndefined();
    expect(headers[CSP_NONCE_RESPONSE_HEADER]).toBeUndefined();
  });

  it('points CSP violation reports at the configured reporting path', () => {
    const headers = buildSecurityHeaders({
      isHttps: true,
      nonce: 'test-nonce',
      reportingPath: '/api/csp',
    });

    expect(headers['Content-Security-Policy']).toContain('report-uri /api/csp');
    expect(headers['Report-To']).toContain('/api/csp');
  });
});

describe('applySecurityHeaders', () => {
  it('applies the headers to the response', () => {
    const response = applySecurityHeaders(createResponse(), createRequest());

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
  });

  it('omits HSTS over plain HTTP', () => {
    const response = applySecurityHeaders(createResponse(), createRequest({ protocol: 'http:' }));

    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('reuses the nonce the middleware put on the request', () => {
    const response = applySecurityHeaders(createResponse(), createRequest({ nonce: 'shared' }));

    expect(response.headers.get('Content-Security-Policy')).toContain("'nonce-shared'");
    expect(response.headers.get(CSP_NONCE_RESPONSE_HEADER)).toBe('shared');
  });

  it('prefers an explicitly passed nonce', () => {
    const response = applySecurityHeaders(
      createResponse(),
      createRequest({ nonce: 'from-request' }),
      'explicit',
    );

    expect(response.headers.get('Content-Security-Policy')).toContain("'nonce-explicit'");
  });

  it('always ships a policy that refuses inline script', () => {
    const response = applySecurityHeaders(createResponse(), createRequest());

    expect(containsUnsafeSources(response.headers.get('Content-Security-Policy') ?? '')).toBe(
      false,
    );
  });
});

describe('generateOAuthState', () => {
  it('returns distinct, high-entropy hex nonces', () => {
    const state1 = generateOAuthState();
    const state2 = generateOAuthState();

    expect(state1).toMatch(/^[0-9a-f]{64}$/);
    expect(state2).toMatch(/^[0-9a-f]{64}$/);
    expect(state1).not.toBe(state2);
  });

  it('derives entropy from the configured byte length', () => {
    expect(generateOAuthState(16)).toMatch(/^[0-9a-f]{32}$/);
    expect(generateOAuthState(1)).toMatch(/^[0-9a-f]{2}$/);
  });
});

describe('validateOAuthState', () => {
  it('accepts a matching value', () => {
    expect(validateOAuthState('deadbeef', 'deadbeef')).toBe(true);
  });

  it('rejects mismatched values', () => {
    expect(validateOAuthState('deadbeef', 'deadbeec')).toBe(false);
    expect(validateOAuthState('deadbeef', 'deadbeef1')).toBe(false);
  });

  it('rejects missing values', () => {
    expect(validateOAuthState(undefined, 'deadbeef')).toBe(false);
    expect(validateOAuthState('deadbeef', undefined)).toBe(false);
    expect(validateOAuthState(undefined, undefined)).toBe(false);
  });
});
