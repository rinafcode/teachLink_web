import { describe, it, expect } from 'vitest';
import { validateQuerySafety, sanitizeObject, withSecurityHeaders } from '@/lib/security';
import { NextResponse } from 'next/server';

describe('Course Listing API Security', () => {
  // ─── Query Safety Validation ──────────────────────────────────────────────

  describe('validateQuerySafety', () => {
    it('should allow clean query parameters', () => {
      const params = new URLSearchParams({ limit: '10', category: 'Design' });
      const result = validateQuerySafety(params);
      expect(result.safe).toBe(true);
    });

    it('should detect and block HTML/Script injection', () => {
      const maliciousQueries = [
        new URLSearchParams({ category: '<script>alert(1)</script>' }),
        new URLSearchParams({ q: 'javascript:void(0)' }),
        new URLSearchParams({ 'onmouseover': 'hack()' }),
      ];

      for (const params of maliciousQueries) {
        const result = validateQuerySafety(params);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('Suspicious input detected');
      }
    });

    it('should detect and block SQL injection patterns', () => {
      const maliciousQueries = [
        new URLSearchParams({ category: "Design' UNION SELECT null, null--" }),
        new URLSearchParams({ q: "1; DROP TABLE courses;" }),
        new URLSearchParams({ id: "1 or 1=1" }),
      ];

      for (const params of maliciousQueries) {
        const result = validateQuerySafety(params);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('Suspicious input detected');
      }
    });

    it('should detect and block path traversal attempts', () => {
      const params = new URLSearchParams({ id: '../../etc/passwd' });
      const result = validateQuerySafety(params);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Suspicious input detected');
    });
  });

  // ─── Input/Output Sanitization ─────────────────────────────────────────────

  describe('sanitizeObject', () => {
    it('should escape dangerous characters to prevent XSS', () => {
      const input = {
        title: 'Course with <script>danger</script>',
        description: 'Safe text & "dangerous" quotes / slashes',
        lessons: [
          { title: '<img src=x onerror=alert(1)>' }
        ]
      };

      const sanitized = sanitizeObject(input);

      expect(sanitized.title).toBe('Course with &lt;script&gt;danger&lt;&#x2F;script&gt;');
      expect(sanitized.description).toBe('Safe text &amp; &quot;dangerous&quot; quotes &#x2F; slashes');
      expect(sanitized.lessons[0].title).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });
  });

  // ─── Security Headers Application ─────────────────────────────────────────

  describe('withSecurityHeaders', () => {
    it('should append critical security headers to responses', () => {
      const response = NextResponse.json({ success: true });
      const secureResponse = withSecurityHeaders(response);

      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secureResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });
});
