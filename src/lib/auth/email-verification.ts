import { createHash, randomBytes, randomUUID } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import type { EmailVerificationInput } from '@/services/notifications';

export type EmailVerificationStatus = 'pending' | 'verified' | 'expired' | 'already_verified';
type LookupStatus = EmailVerificationStatus | 'not_found' | 'cooldown';

export interface EmailVerificationRecord {
  verificationId: string;
  email: string;
  emailNormalized: string;
  name: string;
  status: Exclude<EmailVerificationStatus, 'already_verified'>;
  verificationTokenHash: string;
  backupCodeHash: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  backupCodeExpiresAt: string;
  resendAvailableAt: string;
  resendCount: number;
  verifiedAt?: string;
}

export interface VerificationSummary {
  required: boolean;
  status: EmailVerificationStatus;
  sessionId?: string;
  expiresAt?: string;
  resendAvailableAt?: string;
}

export interface VerificationIssueResult {
  record: EmailVerificationRecord;
  verificationToken: string;
  backupCode: string;
}

export interface VerificationLookupResult {
  status: LookupStatus;
  record?: EmailVerificationRecord;
}

interface VerificationStore {
  updatedAt: string;
  records: EmailVerificationRecord[];
}

const VERIFICATION_TOKEN_TTL_MS = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_MS ?? 15 * 60 * 1000,
);
const VERIFICATION_BACKUP_CODE_TTL_MS = Number(
  process.env.EMAIL_VERIFICATION_BACKUP_CODE_TTL_MS ?? 24 * 60 * 60 * 1000,
);
const VERIFICATION_RESEND_COOLDOWN_MS = Number(
  process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_MS ?? 60 * 1000,
);

const DEFAULT_STORE_PATH =
  process.env.EMAIL_VERIFICATION_STORE_PATH ??
  path.join(process.cwd(), '.data', 'email-verification.json');

let verificationStorePath = DEFAULT_STORE_PATH;
let cachedStore: Promise<VerificationStore> | null = null;
let writeQueue = Promise.resolve();

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function createVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

function createBackupCode(): string {
  return randomBytes(6).toString('hex').toUpperCase();
}

function createEmptyStore(): VerificationStore {
  return { updatedAt: nowIso(), records: [] };
}

async function readStoreFromDisk(): Promise<VerificationStore> {
  try {
    const raw = await readFile(verificationStorePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<VerificationStore> | EmailVerificationRecord[];

    if (Array.isArray(parsed)) {
      return { updatedAt: nowIso(), records: parsed };
    }

    return {
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
      records: Array.isArray(parsed.records) ? (parsed.records as EmailVerificationRecord[]) : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createEmptyStore();
    }

    throw error;
  }
}

async function loadStore(): Promise<VerificationStore> {
  if (!cachedStore) {
    cachedStore = readStoreFromDisk();
  }

  return cachedStore;
}

async function persistStore(store: VerificationStore): Promise<void> {
  await mkdir(path.dirname(verificationStorePath), { recursive: true });
  const tempPath = `${verificationStorePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), 'utf8');
  await rename(tempPath, verificationStorePath);
}

async function withStore<T>(updater: (store: VerificationStore) => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(async () => {
    const store = await loadStore();
    const result = await updater(store);
    store.updatedAt = nowIso();
    await persistStore(store);
    return result;
  });

  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}

function findRecordByEmail(
  store: VerificationStore,
  emailNormalized: string,
): EmailVerificationRecord | undefined {
  return store.records.find((record) => record.emailNormalized === emailNormalized);
}

function sweepExpiredRecords(store: VerificationStore): void {
  const now = Date.now();
  store.records = store.records.filter((record) => {
    if (record.status !== 'verified' && now > Date.parse(record.backupCodeExpiresAt)) {
      return false;
    }

    if (record.status === 'pending' && now > Date.parse(record.expiresAt)) {
      record.status = 'expired';
      record.updatedAt = nowIso();
    }

    return true;
  });
}

function buildFreshRecord(params: {
  email: string;
  name: string;
  existing?: EmailVerificationRecord;
}): VerificationIssueResult {
  const verificationToken = createVerificationToken();
  const backupCode = createBackupCode();
  const now = nowIso();

  const record: EmailVerificationRecord = {
    verificationId: params.existing?.verificationId ?? randomUUID(),
    email: params.email,
    emailNormalized: normalizeEmail(params.email),
    name: params.name,
    status: 'pending',
    verificationTokenHash: hashSecret(verificationToken),
    backupCodeHash: hashSecret(backupCode),
    createdAt: params.existing?.createdAt ?? now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString(),
    backupCodeExpiresAt: new Date(Date.now() + VERIFICATION_BACKUP_CODE_TTL_MS).toISOString(),
    resendAvailableAt: new Date(Date.now() + VERIFICATION_RESEND_COOLDOWN_MS).toISOString(),
    resendCount: params.existing?.resendCount ?? 0,
    verifiedAt: params.existing?.verifiedAt,
  };

  return { record, verificationToken, backupCode };
}

function toSummary(record: EmailVerificationRecord): VerificationSummary {
  return {
    required: record.status !== 'verified',
    status: record.status,
    sessionId: record.verificationId,
    expiresAt: record.expiresAt,
    resendAvailableAt: record.resendAvailableAt,
  };
}

export function buildVerificationMailContext(
  record: EmailVerificationRecord,
  verificationToken: string,
  backupCode: string,
): EmailVerificationInput {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teachlink.app';
  const verificationUrl = new URL('/verify-email', siteUrl);
  verificationUrl.searchParams.set('token', verificationToken);
  verificationUrl.searchParams.set('email', record.email);

  const restoreUrl = new URL('/verify-email', siteUrl);
  restoreUrl.searchParams.set('restore', '1');
  restoreUrl.searchParams.set('email', record.email);

  return {
    email: record.email,
    name: record.name,
    verificationUrl: verificationUrl.toString(),
    restoreUrl: restoreUrl.toString(),
    backupCode,
    expiresInMinutes: Math.max(1, Math.ceil(VERIFICATION_TOKEN_TTL_MS / 60_000)),
  };
}

export async function createOrRestoreVerification(params: {
  email: string;
  name: string;
}): Promise<
  VerificationIssueResult | { status: 'already_verified'; record: EmailVerificationRecord }
> {
  return withStore(async (store) => {
    sweepExpiredRecords(store);

    const emailNormalized = normalizeEmail(params.email);
    const existing = findRecordByEmail(store, emailNormalized);

    if (existing?.status === 'verified') {
      return { status: 'already_verified', record: existing };
    }

    const { record, verificationToken, backupCode } = buildFreshRecord({
      email: params.email,
      name: params.name,
      existing,
    });

    store.records = store.records.filter(
      (recordItem) => recordItem.emailNormalized !== emailNormalized,
    );
    store.records.push(record);

    return { record, verificationToken, backupCode };
  });
}

export async function verifyEmailToken(token: string): Promise<VerificationLookupResult> {
  const tokenHash = hashSecret(token.trim());

  return withStore(async (store) => {
    sweepExpiredRecords(store);
    const record = store.records.find((item) => item.verificationTokenHash === tokenHash);

    if (!record) {
      return { status: 'not_found' };
    }

    if (record.status === 'verified') {
      return { status: 'already_verified', record };
    }

    if (Date.now() > Date.parse(record.expiresAt)) {
      record.status = 'expired';
      record.updatedAt = nowIso();
      return { status: 'expired', record };
    }

    record.status = 'verified';
    record.verifiedAt = nowIso();
    record.updatedAt = record.verifiedAt;
    return { status: 'verified', record };
  });
}

export async function resendVerificationEmail(
  email: string,
): Promise<VerificationIssueResult | VerificationLookupResult> {
  return withStore(async (store) => {
    sweepExpiredRecords(store);
    const emailNormalized = normalizeEmail(email);
    const existing = findRecordByEmail(store, emailNormalized);

    if (!existing) {
      return { status: 'not_found' };
    }

    if (existing.status === 'verified') {
      return { status: 'already_verified', record: existing };
    }

    if (Date.now() < Date.parse(existing.resendAvailableAt)) {
      return { status: 'cooldown', record: existing };
    }

    const { record, verificationToken, backupCode } = buildFreshRecord({
      email: existing.email,
      name: existing.name,
      existing,
    });
    record.resendCount = existing.resendCount + 1;

    store.records = store.records.filter(
      (recordItem) => recordItem.emailNormalized !== emailNormalized,
    );
    store.records.push(record);

    return { record, verificationToken, backupCode };
  });
}

export async function restoreVerificationEmail(params: {
  email: string;
  backupCode: string;
}): Promise<VerificationIssueResult | VerificationLookupResult> {
  return withStore(async (store) => {
    sweepExpiredRecords(store);
    const emailNormalized = normalizeEmail(params.email);
    const existing = findRecordByEmail(store, emailNormalized);

    if (!existing) {
      return { status: 'not_found' };
    }

    if (existing.status === 'verified') {
      return { status: 'already_verified', record: existing };
    }

    if (Date.now() > Date.parse(existing.backupCodeExpiresAt)) {
      return { status: 'expired', record: existing };
    }

    if (hashSecret(params.backupCode.trim()) !== existing.backupCodeHash) {
      return { status: 'not_found', record: existing };
    }

    const { record, verificationToken, backupCode } = buildFreshRecord({
      email: existing.email,
      name: existing.name,
      existing,
    });
    record.resendCount = existing.resendCount + 1;

    store.records = store.records.filter(
      (recordItem) => recordItem.emailNormalized !== emailNormalized,
    );
    store.records.push(record);

    return { record, verificationToken, backupCode };
  });
}

export async function getVerificationStatus(email: string): Promise<VerificationSummary | null> {
  return withStore(async (store) => {
    sweepExpiredRecords(store);
    const record = findRecordByEmail(store, normalizeEmail(email));
    return record ? toSummary(record) : null;
  });
}

export async function getVerificationBySessionId(
  sessionId: string,
): Promise<EmailVerificationRecord | null> {
  return withStore(async (store) => {
    sweepExpiredRecords(store);
    return store.records.find((record) => record.verificationId === sessionId) ?? null;
  });
}

export function __setVerificationStorePathForTests(nextStorePath: string): void {
  verificationStorePath = nextStorePath;
}

export async function __resetVerificationStoreForTests(): Promise<void> {
  cachedStore = null;
  writeQueue = Promise.resolve();
}

export function getVerificationTokenTtlMinutes(): number {
  return Math.max(1, Math.ceil(VERIFICATION_TOKEN_TTL_MS / 60_000));
}
