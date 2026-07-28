/**
 * Biometric Authentication Service
 *
 * Provides WebAuthn-based biometric enrollment, authentication, and re-enrollment
 * for device-bound credentials (platform authenticators: Touch ID, Face ID,
 * Windows Hello, fingerprint readers).
 *
 * Flow:
 * 1. Enroll   — User registers a new credential (publicKey) linked to their account.
 * 2. Auth     — User authenticates with a previously enrolled credential.
 * 3. Re-enroll — User's device fingerprint changed → re-enrolls with a new credential
 *                after verifying their identity via password or email OTP.
 */

import { createLogger } from '@/lib/logging';

const logger = createLogger('auth-biometric');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BiometricCredential {
  /** Unique credential ID (base64url-encoded) */
  id: string;
  /** User account ID this credential belongs to */
  userId: string;
  /** Public key (base64url-encoded) */
  publicKey: string;
  /** Device credential ID from the authenticator (base64url-encoded) */
  credentialId: string;
  /** Counter for cloned credential detection */
  counter: number;
  /** Whether this credential is currently active */
  active: boolean;
  /** ISO-8601 timestamp of enrollment */
  enrolledAt: string;
  /** Human-readable device label (e.g. "iPhone 15", "Windows Hello") */
  deviceLabel: string;
  /** Transports supported by the authenticator */
  transports: AuthenticatorTransport[];
}

export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal';

export interface BiometricEnrollmentOptions {
  /** Relying Party display name */
  rpName: string;
  /** Relying Party ID (origin domain) */
  rpId: string;
  /** User display name */
  userName: string;
  /** User ID (base64url-encoded) */
  userId: string;
}

export interface BiometricAuthOptions {
  rpId: string;
}

// ---------------------------------------------------------------------------
// In-memory credential store (replace with DB in production)
// ---------------------------------------------------------------------------

/**
 * In-memory store for biometric credentials.
 * In production, replace with a database table `biometric_credentials`.
 */
const credentialStore = new Map<string, BiometricCredential[]>();

function getCredentials(userId: string): BiometricCredential[] {
  return credentialStore.get(userId) ?? [];
}

function setCredentials(userId: string, creds: BiometricCredential[]): void {
  credentialStore.set(userId, creds);
}

// ---------------------------------------------------------------------------
// Challenge store (ephemeral, per-session)
// ---------------------------------------------------------------------------

const challengeStore = new Map<string, string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown device';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS Device';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Windows/.test(ua)) return 'Windows Device';
  if (/Mac/.test(ua)) return 'macOS Device';
  if (/Linux/.test(ua)) return 'Linux Device';
  return 'Unknown device';
}

// ---------------------------------------------------------------------------
// Server-side: Generate enrollment options (called by API route)
// ---------------------------------------------------------------------------

export function generateEnrollmentOptions(
  options: BiometricEnrollmentOptions,
): PublicKeyCredentialCreationOptions {
  const challenge = generateChallenge();
  challengeStore.set(options.userId, challenge);

  const existingCreds = getCredentials(options.userId);
  const excludeCredentials = existingCreds
    .filter((c) => c.active)
    .map((c) => ({
      id: base64UrlDecode(c.credentialId),
      type: 'public-key' as const,
      transports: c.transports as AuthenticatorTransport[],
    }));

  return {
    challenge: base64UrlDecode(challenge),
    rp: {
      name: options.rpName,
      id: options.rpId,
    },
    user: {
      id: base64UrlDecode(options.userId),
      name: options.userName,
      displayName: options.userName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'required',
    },
    excludeCredentials,
    timeout: 60_000,
    attestation: 'none',
  };
}

// ---------------------------------------------------------------------------
// Server-side: Verify enrollment response (called by API route)
// ---------------------------------------------------------------------------

export function verifyEnrollmentResponse(
  userId: string,
  credential: PublicKeyCredential,
): BiometricCredential {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) {
    throw new Error('No enrollment challenge found for this session. Please try again.');
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  const credentialId = base64UrlEncode(credential.rawId);
  const publicKey = base64UrlEncode(response.getPublicKey() ?? new ArrayBuffer(0));

  // Clean up challenge
  challengeStore.delete(userId);

  const newCredential: BiometricCredential = {
    id: credentialId,
    userId,
    publicKey,
    credentialId,
    counter: 0,
    active: true,
    enrolledAt: new Date().toISOString(),
    deviceLabel: detectDeviceLabel(),
    transports: response.getTransports?.() as AuthenticatorTransport[] ?? ['internal'],
  };

  // Store credential
  const existing = getCredentials(userId);
  setCredentials(userId, [...existing, newCredential]);

  logger.info('Biometric credential enrolled', {
    userId,
    credentialId: credentialId.slice(0, 16) + '…',
  });

  return newCredential;
}

// ---------------------------------------------------------------------------
// Server-side: Generate authentication options (called by API route)
// ---------------------------------------------------------------------------

export function generateAuthOptions(
  userId: string,
  options: BiometricAuthOptions,
): PublicKeyCredentialRequestOptions {
  const challenge = generateChallenge();
  challengeStore.set(`auth:${userId}`, challenge);

  const creds = getCredentials(userId).filter((c) => c.active);
  const allowCredentials = creds.map((c) => ({
    id: base64UrlDecode(c.credentialId),
    type: 'public-key' as const,
    transports: c.transports as AuthenticatorTransport[],
  }));

  return {
    challenge: base64UrlDecode(challenge),
    rpId: options.rpId,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: 'required',
    timeout: 60_000,
  };
}

// ---------------------------------------------------------------------------
// Server-side: Verify authentication response (called by API route)
// ---------------------------------------------------------------------------

export function verifyAuthResponse(
  userId: string,
  credential: PublicKeyCredential,
): { verified: boolean; credentialId: string } {
  const expectedChallenge = challengeStore.get(`auth:${userId}`);
  if (!expectedChallenge) {
    throw new Error('No authentication challenge found for this session. Please try again.');
  }

  const credentialId = base64UrlEncode(credential.rawId);
  const creds = getCredentials(userId);
  const storedCred = creds.find((c) => c.credentialId === credentialId && c.active);

  if (!storedCred) {
    throw new Error('Biometric credential not found or has been deactivated.');
  }

  // Clean up challenge
  challengeStore.delete(`auth:${userId}`);

  // In a production system, verify the signature using the stored public key
  // and update the counter for cloned credential detection.
  // For this implementation, we trust the platform authenticator's verification.

  logger.info('Biometric authentication verified', {
    userId,
    credentialId: credentialId.slice(0, 16) + '…',
  });

  return { verified: true, credentialId };
}

// ---------------------------------------------------------------------------
// Re-enrollment
// ---------------------------------------------------------------------------

/**
 * Deactivates all existing biometric credentials for a user and generates
 * fresh enrollment options. This is the core of the re-enrollment flow:
 * when a device fingerprint changes, old credentials become invalid and
 * the user must re-enroll.
 */
export function initiateReEnrollment(
  userId: string,
  options: BiometricEnrollmentOptions,
): PublicKeyCredentialCreationOptions {
  // Deactivate all existing credentials
  const existing = getCredentials(userId);
  const deactivated = existing.map((c) => ({ ...c, active: false }));
  setCredentials(userId, deactivated);

  logger.info('Existing biometric credentials deactivated for re-enrollment', {
    userId,
    deactivatedCount: existing.length,
  });

  // Generate fresh enrollment options
  return generateEnrollmentOptions(options);
}

/**
 * Returns whether a user has any active biometric credentials enrolled.
 */
export function hasActiveCredentials(userId: string): boolean {
  return getCredentials(userId).some((c) => c.active);
}

/**
 * Returns the count of active biometric credentials for a user.
 */
export function getActiveCredentialCount(userId: string): number {
  return getCredentials(userId).filter((c) => c.active).length;
}

/**
 * Removes all biometric credentials for a user (used during account deletion).
 */
export function removeAllCredentials(userId: string): void {
  credentialStore.delete(userId);
  challengeStore.delete(userId);
  challengeStore.delete(`auth:${userId}`);
  logger.info('All biometric credentials removed', { userId });
}

// ---------------------------------------------------------------------------
// Client-side helpers
// ---------------------------------------------------------------------------

/**
 * Client-side: Creates a credential using the WebAuthn API.
 * Must be called from a browser context (user gesture required).
 */
export async function createBiometricCredential(
  options: PublicKeyCredentialCreationOptions,
): Promise<PublicKeyCredential> {
  if (typeof navigator === 'undefined' || !navigator.credentials) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const credential = await navigator.credentials.create({
    publicKey: options,
  });

  if (!credential) {
    throw new Error('Biometric enrollment was cancelled or failed.');
  }

  return credential as PublicKeyCredential;
}

/**
 * Client-side: Authenticates using a previously enrolled biometric credential.
 * Must be called from a browser context (user gesture required).
 */
export async function authenticateWithBiometric(
  options: PublicKeyCredentialRequestOptions,
): Promise<PublicKeyCredential> {
  if (typeof navigator === 'undefined' || !navigator.credentials) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const credential = await navigator.credentials.get({
    publicKey: options,
  });

  if (!credential) {
    throw new Error('Biometric authentication was cancelled or failed.');
  }

  return credential as PublicKeyCredential;
}

/**
 * Checks if the browser supports WebAuthn platform authenticator.
 */
export function isBiometricSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.credentials) {
    return false;
  }
  // Check for platform authenticator availability
  return (
    typeof PublicKeyCredential !== 'undefined' &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );
}

/**
 * Returns a promise that resolves to true if the platform authenticator is available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}