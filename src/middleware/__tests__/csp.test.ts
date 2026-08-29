import { describe, expect, it } from 'vitest';
import type { NextRequest, NextResponse } from 'next/server';
import {
  CSP_HEADER,
  CSP_NONCE_REQUEST_HEADER,
  CSP_NONCE_RESPONSE_HEADER,
  applyCspHeaders,
  attachCspRequestHeaders,
  buildCspHeader,
  containsUnsafeSources,
  generateNonce,
  getRequestNonce,
} from '../csp';

function createRequest(nonce?: string): NextRequest {
  const headers = new Headers();
  if (nonce) headers.set(CSP_NONCE_REQUEST_HEADER, nonce);

  return { headers, nextUrl: { protocol: 'https:' } } as unknown as NextRequest;
}

function createResponse(): NextResponse {
  return { headers: new Headers() } as unknown as NextResponse;
}

describe('generateNonce', () => {
  it('returns a non-empty base64 string on every call', () => {
    const n = generateNonce();
    expect(n).toBeTruthy();
    expect(typeof n).toBe('string');
    expect(n).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it('is different on each call', () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });

  it('carries at least 128 bits of entropy', () => {
    expect(atob(generateNonce())).toHaveLength(16);
  });

  it('does not repeat across many calls', () => {
    const nonces = new Set(Array.from({ length: 500 }, () => generateNonce()));

    expect(nonces.size).toBe(500);
  });
});

describe('buildCspHeader', () => {
  it('includes the nonce in script-src and style-src', () => {
    const nonce = 'abc123xyz==';
    const header = buildCspHeader({ nonce });

    expect(header).toContain(`script-src 'self' 'nonce-${nonce}'`);
    expect(header).toContain(`style-src 'self' 'nonce-${nonce}'`);
  });

  it('blocks unsafe-inline scripts in strict mode', () => {
    const header = buildCspHeader({ nonce: generateNonce(), strict: true });
    expect(header).not.toContain("'unsafe-inline'");
    expect(header).not.toContain("'unsafe-eval'");
  });

  it('is strict by default', () => {
    expect(containsUnsafeSources(buildCspHeader({ nonce: generateNonce() }))).toBe(false);
  });

  it('never allows inline script even when strict mode is relaxed for the dev bundler', () => {
    const header = buildCspHeader({ nonce: generateNonce(), strict: false });

    expect(header).not.toContain("'unsafe-inline'");
    expect(header).toContain("'unsafe-eval'");
  });

  it('includes frame-ancestors none to prevent clickjacking', () => {
    const header = buildCspHeader({ nonce: generateNonce() });
    expect(header).toContain("frame-ancestors 'none'");
  });

  it('includes report-uri for violation reporting', () => {
    const header = buildCspHeader({ nonce: generateNonce() });
    expect(header).toContain('report-uri');
  });

  it('accepts a custom reporting endpoint', () => {
    const header = buildCspHeader({ nonce: generateNonce(), reportUri: '/api/csp' });

    expect(header).toContain('report-uri /api/csp');
  });

  it('blocks object-src to prevent plugin attacks', () => {
    const header = buildCspHeader({ nonce: generateNonce() });
    expect(header).toContain("object-src 'none'");
  });
});

describe('containsUnsafeSources', () => {
  it('detects inline and eval sources', () => {
    expect(containsUnsafeSources("script-src 'self' 'unsafe-inline'")).toBe(true);
    expect(containsUnsafeSources("script-src 'self' 'unsafe-eval'")).toBe(true);
    expect(containsUnsafeSources("script-src 'self' 'nonce-abc'")).toBe(false);
  });
});

describe('getRequestNonce', () => {
  it('reads the nonce the middleware attached to the request', () => {
    expect(getRequestNonce(createRequest('nonce-from-middleware'))).toBe('nonce-from-middleware');
  });

  it('returns undefined when no nonce was attached', () => {
    expect(getRequestNonce(createRequest())).toBeUndefined();
  });
});

describe('attachCspRequestHeaders', () => {
  it('exposes the nonce to the app and to Next.js script injection', () => {
    const request = createRequest();
    const headers = attachCspRequestHeaders(request, 'forwarded-nonce');

    expect(headers.get(CSP_NONCE_REQUEST_HEADER)).toBe('forwarded-nonce');
    expect(headers.get(CSP_HEADER)).toContain("'nonce-forwarded-nonce'");
    expect(getRequestNonce(request)).toBe('forwarded-nonce');
  });

  it('forwards the same policy the response will carry', () => {
    const request = createRequest();
    const requestHeaders = attachCspRequestHeaders(request, 'shared');
    const response = applyCspHeaders(createResponse(), request);

    expect(response.headers.get(CSP_HEADER)).toBe(requestHeaders.get(CSP_HEADER));
  });
});

describe('applyCspHeaders', () => {
  it('sets a nonce-based policy and exposes the nonce on the response', () => {
    const response = applyCspHeaders(createResponse(), createRequest(), 'explicit-nonce');

    expect(response.headers.get(CSP_HEADER)).toContain("'nonce-explicit-nonce'");
    expect(response.headers.get(CSP_NONCE_RESPONSE_HEADER)).toBe('explicit-nonce');
  });

  it('falls back to the nonce carried on the request', () => {
    const response = applyCspHeaders(createResponse(), createRequest('request-nonce'));

    expect(response.headers.get(CSP_HEADER)).toContain("'nonce-request-nonce'");
    expect(response.headers.get(CSP_NONCE_RESPONSE_HEADER)).toBe('request-nonce');
  });

  it('generates a nonce when the request carries none', () => {
    const response = applyCspHeaders(createResponse(), createRequest());
    const nonce = response.headers.get(CSP_NONCE_RESPONSE_HEADER);

    expect(nonce).toBeTruthy();
    expect(response.headers.get(CSP_HEADER)).toContain(`'nonce-${nonce}'`);
  });

  it('never emits a policy that allows inline script', () => {
    const response = applyCspHeaders(createResponse(), createRequest());

    expect(containsUnsafeSources(response.headers.get(CSP_HEADER) ?? '')).toBe(false);
  });
});
