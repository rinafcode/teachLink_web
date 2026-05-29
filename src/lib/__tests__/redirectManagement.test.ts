/**
 * Unit tests for redirect management system
 */

import { describe, it, expect } from 'vitest';
import {
  findRedirectRule,
  shouldRedirect,
  getRedirectsForLocale,
  getLegacyRedirects,
  PRIVACY_POLICY_REDIRECTS,
  GLOBAL_REDIRECTS,
  ALL_REDIRECTS,
  type RedirectRule,
} from '../redirectManagement';

describe('Redirect Management System', () => {
  describe('findRedirectRule', () => {
    it('should find exact match redirect rule', () => {
      const context = {
        pathname: '/privacy-policy',
        searchParams: new URLSearchParams(),
      };

      const result = findRedirectRule(context);

      expect(result).not.toBeNull();
      expect(result?.rule.from).toBe('/privacy-policy');
      expect(result?.rule.to).toBe('/privacy');
    });

    it('should preserve query parameters when configured', () => {
      const context = {
        pathname: '/privacy-policy',
        searchParams: new URLSearchParams('utm_source=test&utm_medium=email'),
      };

      const result = findRedirectRule(context);

      expect(result).not.toBeNull();
      expect(result?.destination).toContain('?');
      expect(result?.destination).toContain('utm_source=test');
      expect(result?.destination).toContain('utm_medium=email');
    });

    it('should not include query params when preserveQuery is false', () => {
      const customRule: RedirectRule[] = [
        {
          from: '/test-old',
          to: '/test-new',
          preserveQuery: false,
        },
      ];

      const context = {
        pathname: '/test-old',
        searchParams: new URLSearchParams('param=value'),
      };

      const result = findRedirectRule(context, customRule);

      expect(result).not.toBeNull();
      expect(result?.destination).toBe('/test-new');
    });

    it('should preserve hash when configured', () => {
      const customRule: RedirectRule[] = [
        {
          from: '/old-page',
          to: '/new-page',
          preserveHash: true,
        },
      ];

      const context = {
        pathname: '/old-page',
        searchParams: new URLSearchParams(),
        hash: '#section',
      };

      const result = findRedirectRule(context, customRule);

      expect(result).not.toBeNull();
      expect(result?.destination).toContain('#section');
    });

    it('should handle locale-specific redirects', () => {
      const customRule: RedirectRule[] = [
        {
          from: '/es-privacy',
          to: '/es/privacy',
          locales: ['es'],
        },
      ];

      // Spanish locale should match
      const esContext = {
        pathname: '/es-privacy',
        searchParams: new URLSearchParams(),
        locale: 'es',
      };
      expect(findRedirectRule(esContext, customRule)).not.toBeNull();

      // English locale should NOT match
      const enContext = {
        pathname: '/es-privacy',
        searchParams: new URLSearchParams(),
        locale: 'en',
      };
      expect(findRedirectRule(enContext, customRule)).toBeNull();
    });

    it('should return null for non-matching paths', () => {
      const context = {
        pathname: '/some-random-page',
        searchParams: new URLSearchParams(),
      };

      const result = findRedirectRule(context);

      expect(result).toBeNull();
    });

    it('should use correct HTTP status code', () => {
      const customRule: RedirectRule[] = [
        {
          from: '/permanent',
          to: '/new',
          status: 301,
        },
        {
          from: '/temporary',
          to: '/newer',
          status: 302,
        },
      ];

      const permanentContext = {
        pathname: '/permanent',
        searchParams: new URLSearchParams(),
      };
      const permanentResult = findRedirectRule(permanentContext, customRule);
      expect(permanentResult?.rule.status).toBe(301);

      const tempContext = {
        pathname: '/temporary',
        searchParams: new URLSearchParams(),
      };
      const tempResult = findRedirectRule(tempContext, customRule);
      expect(tempResult?.rule.status).toBe(302);
    });

    it('should handle combined query params and hash', () => {
      const customRule: RedirectRule[] = [
        {
          from: '/old',
          to: '/new',
          preserveQuery: true,
          preserveHash: true,
        },
      ];

      const context = {
        pathname: '/old',
        searchParams: new URLSearchParams('page=1&sort=desc'),
        hash: '#results',
      };

      const result = findRedirectRule(context, customRule);

      expect(result?.destination).toBe('/new?page=1&sort=desc#results');
    });
  });

  describe('shouldRedirect', () => {
    it('should return true for configured redirect paths', () => {
      expect(shouldRedirect('/privacy-policy')).toBe(true);
      expect(shouldRedirect('/terms-of-service')).toBe(true);
      expect(shouldRedirect('/tos')).toBe(true);
    });

    it('should return false for non-redirect paths', () => {
      expect(shouldRedirect('/dashboard')).toBe(false);
      expect(shouldRedirect('/courses')).toBe(false);
      expect(shouldRedirect('/some-page')).toBe(false);
    });

    it('should work with custom rule sets', () => {
      const customRules: RedirectRule[] = [
        {
          from: '/custom-old',
          to: '/custom-new',
        },
      ];

      expect(shouldRedirect('/custom-old', customRules)).toBe(true);
      expect(shouldRedirect('/custom-new', customRules)).toBe(false);
    });
  });

  describe('getRedirectsForLocale', () => {
    it('should return all rules when no locale restriction', () => {
      const allRules = getRedirectsForLocale('en');
      expect(allRules.length).toBeGreaterThan(0);
    });

    it('should filter rules by locale', () => {
      const customRules: RedirectRule[] = [
        {
          from: '/de-policy',
          to: '/de/policy',
          locales: ['de'],
        },
        {
          from: '/universal',
          to: '/universal-new',
        },
      ];

      const deRules = getRedirectsForLocale('de', customRules);
      expect(deRules.length).toBe(2); // Universal rule + DE rule

      const esRules = getRedirectsForLocale('es', customRules);
      expect(esRules.length).toBe(1); // Only universal rule
    });
  });

  describe('getLegacyRedirects', () => {
    it('should return only legacy redirect rules', () => {
      const legacyRules = getLegacyRedirects();
      expect(legacyRules.length).toBeGreaterThan(0);

      // All should be marked as legacy
      legacyRules.forEach(rule => {
        expect(rule.isLegacy).toBe(true);
      });
    });

    it('should include privacy policy legacy redirects', () => {
      const legacyRules = getLegacyRedirects();
      const hasPrivacyPolicy = legacyRules.some(r => r.from === '/privacy-policy');
      expect(hasPrivacyPolicy).toBe(true);
    });
  });

  describe('Privacy Policy Redirects', () => {
    it('should have multiple privacy policy redirect rules', () => {
      expect(PRIVACY_POLICY_REDIRECTS.length).toBeGreaterThan(0);
    });

    it('should redirect all privacy policy variants to /privacy', () => {
      const variants = [
        '/privacy-policy',
        '/privacy-notice',
        '/policies/privacy',
        '/legal/privacy',
        '/legal/privacy-policy',
      ];

      variants.forEach(variant => {
        const context = {
          pathname: variant,
          searchParams: new URLSearchParams(),
        };
        const result = findRedirectRule(context, PRIVACY_POLICY_REDIRECTS);
        expect(result).not.toBeNull();
        expect(result?.destination).toContain('/privacy');
      });
    });

    it('should mark privacy policy redirects as legacy', () => {
      PRIVACY_POLICY_REDIRECTS.forEach(rule => {
        expect(rule.isLegacy).toBe(true);
      });
    });
  });

  describe('Global Redirects', () => {
    it('should have terms of service redirects', () => {
      const context1 = {
        pathname: '/terms-of-service',
        searchParams: new URLSearchParams(),
      };
      const context2 = {
        pathname: '/tos',
        searchParams: new URLSearchParams(),
      };

      expect(findRedirectRule(context1, GLOBAL_REDIRECTS)).not.toBeNull();
      expect(findRedirectRule(context2, GLOBAL_REDIRECTS)).not.toBeNull();
    });
  });

  describe('Query Parameter Preservation', () => {
    it('should handle multiple values for same parameter', () => {
      const context = {
        pathname: '/privacy-policy',
        searchParams: new URLSearchParams([
          ['tag', 'gdpr'],
          ['tag', 'ccpa'],
          ['source', 'email'],
        ]),
      };

      const result = findRedirectRule(context);

      expect(result?.destination).toContain('tag=gdpr');
      expect(result?.destination).toContain('tag=ccpa');
      expect(result?.destination).toContain('source=email');
    });

    it('should handle special characters in query params', () => {
      const context = {
        pathname: '/privacy-policy',
        searchParams: new URLSearchParams('ref=user%40example.com&search=hello%20world'),
      };

      const result = findRedirectRule(context);

      expect(result?.destination).toContain('?');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search params', () => {
      const context = {
        pathname: '/privacy-policy',
        searchParams: new URLSearchParams(),
      };

      const result = findRedirectRule(context);

      expect(result?.destination).toBe('/privacy');
    });

    it('should handle undefined hash', () => {
      const context = {
        pathname: '/privacy-policy',
        searchParams: new URLSearchParams(),
        hash: undefined,
      };

      const result = findRedirectRule(context);

      expect(result?.destination).toBe('/privacy');
    });

    it('should find first matching rule in list', () => {
      const rules: RedirectRule[] = [
        {
          from: '/old-page',
          to: '/new-page-1',
        },
        {
          from: '/old-page',
          to: '/new-page-2',
        },
      ];

      const context = {
        pathname: '/old-page',
        searchParams: new URLSearchParams(),
      };

      const result = findRedirectRule(context, rules);

      expect(result?.destination).toBe('/new-page-1');
    });
  });
});
