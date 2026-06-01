import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  __resetVerificationStoreForTests,
  __setVerificationStorePathForTests,
  buildVerificationMailContext,
  createOrRestoreVerification,
  getVerificationBySessionId,
  getVerificationStatus,
  resendVerificationEmail,
  restoreVerificationEmail,
  verifyEmailToken,
} from '../email-verification';

let tempDir: string;
let storePath: string;

async function loadStore(): Promise<any> {
  const raw = await readFile(storePath, 'utf8');
  return JSON.parse(raw);
}

async function saveStore(store: any): Promise<void> {
  await writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
}

describe('email verification store', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'teachlink-email-verification-'));
    storePath = path.join(tempDir, 'verification.json');
    __setVerificationStorePathForTests(storePath);
    await __resetVerificationStoreForTests();
  });

  afterEach(async () => {
    await __resetVerificationStoreForTests();
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('creates a pending verification record and persists it without raw secrets', async () => {
    const result = await createOrRestoreVerification({
      email: 'Student@TeachLink.com',
      name: 'Student',
    });

    expect('verificationToken' in result).toBe(true);
    if (!('verificationToken' in result)) throw new Error('Expected verification token');

    const store = await loadStore();
    expect(store.records).toHaveLength(1);
    expect(store.records[0].emailNormalized).toBe('student@teachlink.com');
    expect(store.records[0].verificationTokenHash).toBeTruthy();
    expect(store.records[0].backupCodeHash).toBeTruthy();
    expect(JSON.stringify(store)).not.toContain(result.verificationToken);
    expect(JSON.stringify(store)).not.toContain(result.backupCode);

    const status = await getVerificationStatus('student@teachlink.com');
    expect(status?.required).toBe(true);
    expect(status?.status).toBe('pending');
    expect(status?.sessionId).toBe(store.records[0].verificationId);
  });

  it('verifies a token once and rejects replay attempts', async () => {
    const created = await createOrRestoreVerification({
      email: 'replay@teachlink.com',
      name: 'Replay Tester',
    });

    if (!('verificationToken' in created)) throw new Error('Expected verification token');

    const firstVerification = await verifyEmailToken(created.verificationToken);
    expect(firstVerification.status).toBe('verified');

    const replayVerification = await verifyEmailToken(created.verificationToken);
    expect(replayVerification.status).toBe('already_verified');
  });

  it('restores an expired verification using the backup code', async () => {
    const created = await createOrRestoreVerification({
      email: 'restore@teachlink.com',
      name: 'Restore Tester',
    });

    if (!('verificationToken' in created)) throw new Error('Expected verification token');

    const store = await loadStore();
    store.records[0].expiresAt = new Date(Date.now() - 60_000).toISOString();
    store.records[0].status = 'pending';
    store.records[0].backupCodeExpiresAt = new Date(Date.now() + 60_000).toISOString();
    await saveStore(store);
    await __resetVerificationStoreForTests();

    const expired = await verifyEmailToken(created.verificationToken);
    expect(expired.status).toBe('expired');

    const restored = await restoreVerificationEmail({
      email: 'restore@teachlink.com',
      backupCode: created.backupCode,
    });

    expect('verificationToken' in restored).toBe(true);
    if (!('verificationToken' in restored)) throw new Error('Expected restored verification token');

    const restoredStatus = await getVerificationStatus('restore@teachlink.com');
    expect(restoredStatus?.status).toBe('pending');
    expect(restoredStatus?.required).toBe(true);
  });

  it('enforces resend cooldown and issues a fresh token once available', async () => {
    const created = await createOrRestoreVerification({
      email: 'resend@teachlink.com',
      name: 'Resend Tester',
    });

    if (!('verificationToken' in created)) throw new Error('Expected verification token');

    const cooldownAttempt = await resendVerificationEmail('resend@teachlink.com');
    expect(cooldownAttempt.status).toBe('cooldown');

    const store = await loadStore();
    store.records[0].resendAvailableAt = new Date(Date.now() - 1_000).toISOString();
    await saveStore(store);
    await __resetVerificationStoreForTests();

    const resend = await resendVerificationEmail('resend@teachlink.com');
    expect('verificationToken' in resend).toBe(true);
    if (!('verificationToken' in resend)) throw new Error('Expected resend token');
    expect(resend.verificationToken).not.toBe(created.verificationToken);
    expect(resend.backupCode).not.toBe(created.backupCode);
  });

  it('returns verification records by session id', async () => {
    const created = await createOrRestoreVerification({
      email: 'session@teachlink.com',
      name: 'Session Tester',
    });

    if (!('verificationToken' in created)) throw new Error('Expected verification token');

    const bySession = await getVerificationBySessionId(created.record.verificationId);
    expect(bySession?.email).toBe('session@teachlink.com');
    expect(bySession?.verificationId).toBe(created.record.verificationId);
  });

  it('builds verification links using the public site URL', async () => {
    const created = await createOrRestoreVerification({
      email: 'links@teachlink.com',
      name: 'Links Tester',
    });

    if (!('verificationToken' in created)) throw new Error('Expected verification token');

    const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://teachlink.example';
    const mailContext = buildVerificationMailContext(created.record, created.verificationToken, created.backupCode);
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }

    expect(mailContext.verificationUrl).toContain('https://teachlink.example/verify-email');
    expect(mailContext.restoreUrl).toContain('restore=1');
    expect(mailContext.backupCode).toBe(created.backupCode);
  });
});
