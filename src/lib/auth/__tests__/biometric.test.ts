import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateEnrollmentOptions,
  generateAuthOptions,
  initiateReEnrollment,
  hasActiveCredentials,
  getActiveCredentialCount,
  removeAllCredentials,
  isBiometricSupported,
} from '../biometric';

// Mock crypto.getRandomValues
const mockRandomValues = new Uint8Array(32).fill(42);
vi.stubGlobal('crypto', {
  getRandomValues: vi.fn(() => mockRandomValues),
});

// Mock navigator
vi.stubGlobal('navigator', {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
});

describe('Biometric Authentication Service', () => {
  const testUserId = 'user-test-123';
  const testUserName = 'testuser@example.com';
  const testOptions = {
    rpName: 'TeachLink',
    rpId: 'localhost',
    userName: testUserName,
    userId: testUserId,
  };

  beforeEach(() => {
    // Clean up credentials between tests
    removeAllCredentials(testUserId);
  });

  describe('generateEnrollmentOptions', () => {
    it('should generate valid PublicKeyCredentialCreationOptions', () => {
      const options = generateEnrollmentOptions(testOptions);

      expect(options).toBeDefined();
      expect(options.rp).toBeDefined();
      expect(options.rp.name).toBe('TeachLink');
      expect(options.rp.id).toBe('localhost');
      expect(options.user).toBeDefined();
      expect(options.user.name).toBe(testUserName);
      expect(options.pubKeyCredParams).toBeDefined();
      expect(options.pubKeyCredParams.length).toBeGreaterThan(0);
      expect(options.authenticatorSelection).toBeDefined();
      expect(options.authenticatorSelection?.authenticatorAttachment).toBe('platform');
      expect(options.authenticatorSelection?.userVerification).toBe('required');
      expect(options.timeout).toBe(60_000);
      expect(options.attestation).toBe('none');
    });

    it('should include excludeCredentials when user has existing credentials', () => {
      // First enrollment
      generateEnrollmentOptions(testOptions);

      // Second enrollment should include excludeCredentials
      const options = generateEnrollmentOptions(testOptions);
      expect(options.excludeCredentials).toBeDefined();
    });

    it('should generate a challenge', () => {
      const options = generateEnrollmentOptions(testOptions);
      expect(options.challenge).toBeDefined();
      expect(options.challenge.byteLength).toBeGreaterThan(0);
    });
  });

  describe('generateAuthOptions', () => {
    it('should generate valid PublicKeyCredentialRequestOptions', () => {
      const options = generateAuthOptions(testUserId, { rpId: 'localhost' });

      expect(options).toBeDefined();
      expect(options.rpId).toBe('localhost');
      expect(options.userVerification).toBe('required');
      expect(options.timeout).toBe(60_000);
    });

    it('should generate a challenge', () => {
      const options = generateAuthOptions(testUserId, { rpId: 'localhost' });
      expect(options.challenge).toBeDefined();
      expect(options.challenge.byteLength).toBeGreaterThan(0);
    });
  });

  describe('initiateReEnrollment', () => {
    it('should generate enrollment options for re-enrollment', () => {
      const options = initiateReEnrollment(testUserId, testOptions);

      expect(options).toBeDefined();
      expect(options.rp.name).toBe('TeachLink');
      expect(options.user.name).toBe(testUserName);
    });

    it('should deactivate existing credentials', () => {
      // First, simulate having active credentials by enrolling
      generateEnrollmentOptions(testOptions);

      // Now initiate re-enrollment
      initiateReEnrollment(testUserId, testOptions);

      // After re-enrollment, hasActiveCredentials should return false
      // (the new credential hasn't been verified yet)
      expect(hasActiveCredentials(testUserId)).toBe(false);
    });
  });

  describe('hasActiveCredentials / getActiveCredentialCount', () => {
    it('should return false for a user with no credentials', () => {
      expect(hasActiveCredentials('nonexistent-user')).toBe(false);
    });

    it('should return 0 for a user with no credentials', () => {
      expect(getActiveCredentialCount('nonexistent-user')).toBe(0);
    });

    it('should return false after re-enrollment deactivates credentials', () => {
      generateEnrollmentOptions({ ...testOptions, userId: testUserId });
      initiateReEnrollment(testUserId, { ...testOptions, userId: testUserId });
      expect(hasActiveCredentials(testUserId)).toBe(false);
    });
  });

  describe('removeAllCredentials', () => {
    it('should remove all credentials for a user', () => {
      generateEnrollmentOptions({ ...testOptions, userId: testUserId });
      removeAllCredentials(testUserId);
      expect(hasActiveCredentials(testUserId)).toBe(false);
      expect(getActiveCredentialCount(testUserId)).toBe(0);
    });
  });

  describe('isBiometricSupported', () => {
    it('should return false when navigator.credentials is not available', () => {
      // Temporarily remove navigator.credentials
      const originalCredentials = (navigator as any).credentials;
      delete (navigator as any).credentials;

      expect(isBiometricSupported()).toBe(false);

      // Restore
      (navigator as any).credentials = originalCredentials;
    });

    it('should return false when PublicKeyCredential is not available', () => {
      const originalPkc = (globalThis as any).PublicKeyCredential;
      delete (globalThis as any).PublicKeyCredential;

      expect(isBiometricSupported()).toBe(false);

      (globalThis as any).PublicKeyCredential = originalPkc;
    });
  });
});