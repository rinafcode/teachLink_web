import { describe, it, expect } from 'vitest';
import { metadata as rootMetadata } from '@/app/layout';
import { metadata as authMetadata } from '@/app/(auth)/layout';
import { metadata as dashboardMetadata } from '@/app/dashboard/layout';
import { metadata as profileMetadata } from '@/app/profile/layout';

describe('Twitter Cards metadata', () => {
  describe('Root layout', () => {
    it('exports a twitter card field', () => {
      expect(rootMetadata.twitter).toBeDefined();
    });

    it('uses summary_large_image card type', () => {
      expect(rootMetadata.twitter?.card).toBe('summary_large_image');
    });

    it('includes a twitter title', () => {
      expect(rootMetadata.twitter?.title).toBeTruthy();
    });

    it('includes a twitter description', () => {
      expect(rootMetadata.twitter?.description).toBeTruthy();
    });

    it('includes twitter site handle', () => {
      expect(rootMetadata.twitter?.site).toBe('@teachlink');
    });

    it('exports openGraph metadata', () => {
      expect(rootMetadata.openGraph).toBeDefined();
      expect(rootMetadata.openGraph?.siteName).toBe('TeachLink');
    });
  });

  describe('Auth layout', () => {
    it('exports a twitter card field', () => {
      expect(authMetadata.twitter).toBeDefined();
    });

    it('uses summary card type', () => {
      expect(authMetadata.twitter?.card).toBe('summary');
    });

    it('includes a twitter title', () => {
      expect(authMetadata.twitter?.title).toBeTruthy();
    });

    it('includes a twitter description', () => {
      expect(authMetadata.twitter?.description).toBeTruthy();
    });

    it('includes twitter site handle', () => {
      expect(authMetadata.twitter?.site).toBe('@teachlink');
    });
  });

  describe('Dashboard layout', () => {
    it('exports a twitter card field', () => {
      expect(dashboardMetadata.twitter).toBeDefined();
    });

    it('uses summary card type', () => {
      expect(dashboardMetadata.twitter?.card).toBe('summary');
    });
  });

  describe('Profile layout', () => {
    it('exports a twitter card field', () => {
      expect(profileMetadata.twitter).toBeDefined();
    });

    it('uses summary card type', () => {
      expect(profileMetadata.twitter?.card).toBe('summary');
    });
  });
});
