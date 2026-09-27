import { describe, it, expect } from 'vitest';
import { sanitizeUrl, sanitizeHtml } from '../sanitize';

// ---------------------------------------------------------------------------
// sanitizeUrl – allowed domains
// ---------------------------------------------------------------------------
describe('sanitizeUrl – allowed domains', () => {
  it('allows https on teachlink.com', () => {
    expect(sanitizeUrl('https://teachlink.com/course/1')).toBe('https://teachlink.com/course/1');
  });

  it('allows subdomains of teachlink.com', () => {
    expect(sanitizeUrl('https://app.teachlink.com/dashboard')).toBe('https://app.teachlink.com/dashboard');
  });

  it('allows http on teachlink.com', () => {
    expect(sanitizeUrl('http://teachlink.com/')).toBe('http://teachlink.com/');
  });

  it('allows youtube.com', () => {
    expect(sanitizeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).not.toBeNull();
  });

  it('allows www.youtube.com (subdomain)', () => {
    expect(sanitizeUrl('https://www.youtube.com/watch?v=abc')).not.toBeNull();
  });

  it('allows youtube-nocookie.com', () => {
    expect(sanitizeUrl('https://www.youtube-nocookie.com/embed/abc')).not.toBeNull();
  });

  it('allows vimeo.com', () => {
    expect(sanitizeUrl('https://vimeo.com/123456789')).not.toBeNull();
  });

  it('allows github.com', () => {
    expect(sanitizeUrl('https://github.com/org/repo')).not.toBeNull();
  });

  it('allows URLs with query parameters and fragments', () => {
    expect(sanitizeUrl('https://teachlink.com/search?q=test#results')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeUrl – disallowed domains
// ---------------------------------------------------------------------------
describe('sanitizeUrl – disallowed domains', () => {
  it('blocks arbitrary https destinations', () => {
    expect(sanitizeUrl('https://evil.com/phishing')).toBeNull();
  });

  it('blocks domains that start with an allowed name but are not subdomains', () => {
    expect(sanitizeUrl('https://teachlink.com.evil.com')).toBeNull();
    expect(sanitizeUrl('https://noteachlink.com')).toBeNull();
  });

  it('blocks domains that end with an allowed name but have a different TLD', () => {
    expect(sanitizeUrl('https://fakeyoutube.com')).toBeNull();
  });

  it('blocks URLs with ports on disallowed domains', () => {
    expect(sanitizeUrl('https://evil.com:8080/attack')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeUrl – protocol blocking
// ---------------------------------------------------------------------------
describe('sanitizeUrl – protocol blocking', () => {
  it('blocks javascript: URIs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('blocks data: URIs', () => {
    expect(sanitizeUrl('data:text/html,<h1>XSS</h1>')).toBeNull();
  });

  it('blocks vbscript: URIs', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
  });

  it('blocks ftp: URIs', () => {
    expect(sanitizeUrl('ftp://teachlink.com/file')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeUrl – edge cases
// ---------------------------------------------------------------------------
describe('sanitizeUrl – edge cases', () => {
  it('returns null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(sanitizeUrl('   ')).toBeNull();
  });

  it('returns null for relative URLs', () => {
    expect(sanitizeUrl('/about')).toBeNull();
  });

  it('returns null for malformed URLs', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(sanitizeUrl('  https://teachlink.com/  ')).not.toBeNull();
  });

  it('returns null for URLs with authentication credentials on disallowed domains', () => {
    expect(sanitizeUrl('https://user:pass@evil.com/')).toBeNull();
  });

  it('allows URLs with URL-encoded characters on allowed domains', () => {
    expect(sanitizeUrl('https://teachlink.com/path%20with%20spaces')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeHtml – DOMPurify hook enforces domain allowlist on hrefs
// ---------------------------------------------------------------------------
describe('sanitizeHtml – href domain enforcement', () => {
  it('keeps href pointing to an allowed domain', () => {
    const result = sanitizeHtml('<a href="https://teachlink.com/course">Course</a>');
    expect(result).toContain('href="https://teachlink.com/course"');
    expect(result).toContain('Course');
  });

  it('keeps href for youtube.com', () => {
    const result = sanitizeHtml('<a href="https://www.youtube.com/watch?v=abc">Video</a>');
    expect(result).toContain('href=');
    expect(result).toContain('Video');
  });

  it('strips href pointing to a disallowed domain', () => {
    const result = sanitizeHtml('<a href="https://evil.com/phishing">Click me</a>');
    expect(result).not.toContain('href=');
    expect(result).toContain('Click me');
  });

  it('strips href pointing to an arbitrary https destination', () => {
    const result = sanitizeHtml('<a href="https://attacker.io/steal">Free gift</a>');
    expect(result).not.toContain('href=');
  });

  it('strips javascript: hrefs (belt-and-suspenders with DOMPurify defaults)', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">XSS</a>');
    expect(result).not.toContain('javascript:');
  });

  it('strips data: hrefs', () => {
    const result = sanitizeHtml('<a href="data:text/html,<h1>x</h1>">data</a>');
    expect(result).not.toContain('data:text');
  });

  it('allows relative hrefs (same-origin links)', () => {
    const result = sanitizeHtml('<a href="/about">About</a>');
    expect(result).toContain('href="/about"');
  });

  it('allows hash fragment hrefs', () => {
    const result = sanitizeHtml('<a href="#section">Jump</a>');
    expect(result).toContain('href="#section"');
  });

  it('preserves link text even when href is stripped', () => {
    const result = sanitizeHtml('<a href="https://bad.example.com">Important text</a>');
    expect(result).toContain('Important text');
    expect(result).not.toContain('href=');
  });

  it('handles multiple links in one HTML string', () => {
    const html =
      '<a href="https://teachlink.com/">Good</a> <a href="https://evil.com/">Bad</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('href="https://teachlink.com/"');
    expect(result).toContain('Good');
    expect(result).toContain('Bad');
    // The bad link should have its href removed
    const badLinkMatch = result.match(/Bad/);
    expect(badLinkMatch).not.toBeNull();
    // Ensure evil.com doesn't appear anywhere
    expect(result).not.toContain('evil.com');
  });
});
