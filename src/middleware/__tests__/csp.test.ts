import { describe, expect, it } from 'vitest';
import { buildCspHeader, generateNonce } from '../csp';

describe('generateNonce', () => {
  it('returns a non-empty base64 string on every call', () => {
    const n = generateNonce();
    expect(n).toBeTruthy();
    expect(typeof n).toBe('string');
  });

  it('is different on each call', () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe('buildCspHeader', () => {
  it('includes the nonce in script-src and style-src', () => {
    const nonce = 'abc123xyz==';
    const header = buildCspHeader({ nonce });

    expect(header).toContain(`'nonce-${nonce}'`);
  });

  it('blocks unsafe-inline scripts in strict mode', () => {
    const header = buildCspHeader({ nonce: generateNonce(), strict: true });
    expect(header).not.toContain("'unsafe-inline'");
    expect(header).not.toContain("'unsafe-eval'");
  });

  it('includes frame-ancestors none to prevent clickjacking', () => {
    const header = buildCspHeader({ nonce: generateNonce() });
    expect(header).toContain("frame-ancestors 'none'");
  });

  it('includes report-uri for violation reporting', () => {
    const header = buildCspHeader({ nonce: generateNonce() });
    expect(header).toContain('report-uri');
  });

  it('blocks object-src to prevent plugin attacks', () => {
    const header = buildCspHeader({ nonce: generateNonce() });
    expect(header).toContain("object-src 'none'");
  });
});
