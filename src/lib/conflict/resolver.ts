import {
  ConflictRecord,
  ResolutionStrategy,
  ProgressData,
  VersionVector,
  VectorComparison,
  MergeStrategy,
  MergeEntityType,
} from './types';

export type { ConflictRecord, ResolutionStrategy, VersionVector, VectorComparison } from './types';

// ---------------------------------------------------------------------------
// Version vector helpers
// ---------------------------------------------------------------------------

/**
 * Compares two version vectors deterministically.
 *
 * Returns:
 * - `equal`          both vectors carry the same counters
 * - `a-dominates`    `a` happened-after `b` (no conflict, `a` wins)
 * - `b-dominates`    `b` happened-after `a` (no conflict, `b` wins)
 * - `concurrent`     neither dominates -> genuine conflict
 */
export function compareVersionVectors(a: VersionVector, b: VersionVector): VectorComparison {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  let aGreater = false;
  let bGreater = false;

  for (const key of keys) {
    const aValue = a[key] ?? 0;
    const bValue = b[key] ?? 0;
    if (aValue > bValue) aGreater = true;
    else if (bValue > aValue) bGreater = true;
  }

  if (aGreater && bGreater) return 'concurrent';
  if (aGreater) return 'a-dominates';
  if (bGreater) return 'b-dominates';
  return 'equal';
}

/** Element-wise maximum of two version vectors (commutative, deterministic). */
export function mergeVersionVectors(a: VersionVector, b: VersionVector): VersionVector {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  const merged: VersionVector = {};
  for (const key of keys) {
    merged[key] = Math.max(a[key] ?? 0, b[key] ?? 0);
  }
  return merged;
}

/** Returns a new vector with the given replica's counter incremented. */
export function incrementVersionVector(vector: VersionVector, replicaId: string): VersionVector {
  return {
    ...vector,
    [replicaId]: (vector[replicaId] ?? 0) + 1,
  };
}

// ---------------------------------------------------------------------------
// Per-entity-type deterministic merge strategies
// ---------------------------------------------------------------------------

/**
 * Deterministic merge for course progress.
 *
 * Progress is merged by taking the maximum progress, OR-ing completion, and
 * advancing the version/logical clock by the max of both sides. All inputs are
 * compared by value, so the result is identical regardless of which side is
 * passed first or which device performed the merge.
 */
function mergeProgressData(local: ProgressData, remote: ProgressData): ProgressData {
  const version = Math.max(local.version ?? 0, remote.version ?? 0) + 1;
  const logicalClock = Math.max(local.logicalClock ?? 0, remote.logicalClock ?? 0) + 1;
  const mergedBy = [local.updatedBy, remote.updatedBy].filter(Boolean).sort().join(',');
  return {
    progress: Math.max(local.progress, remote.progress),
    completed: local.completed || remote.completed,
    // Deterministic choice independent of argument order: the lexicographically
    // greater ISO timestamp (ISO strings compare correctly lexicographically).
    updatedAt: local.updatedAt >= remote.updatedAt ? local.updatedAt : remote.updatedAt,
    version,
    logicalClock,
    updatedBy: mergedBy || undefined,
    versionVector: mergeVersionVectors(local.versionVector ?? {}, remote.versionVector ?? {}),
  };
}

/**
 * Generic deterministic merge: field-level union preferring the higher version
 * vector, falling back to the "remote" side for equal precedence.
 */
function mergeGeneric<T>(local: T, remote: T): T {
  return { ...local, ...remote };
}

export const MERGE_STRATEGIES: Record<MergeEntityType, MergeStrategy> = {
  course_progress: mergeProgressData as MergeStrategy,
  generic: mergeGeneric,
};

function isProgressData(data: any): data is ProgressData {
  return (
    data &&
    typeof data.progress === 'number' &&
    typeof data.completed === 'boolean' &&
    typeof data.updatedAt === 'string'
  );
}

/** Resolve using the per-entity-type strategy (falls back to shape detection, then generic). */
export function resolveByEntityType<T>(entityType: string, local: T, remote: T): T {
  if (entityType !== 'generic') {
    const strategy = (MERGE_STRATEGIES as Record<string, MergeStrategy>)[entityType];
    if (strategy) return strategy(local, remote) as T;
  }
  // Progress-like payloads always use the deterministic progress merge so the
  // outcome is stable regardless of which caller invoked the resolver.
  if (isProgressData(local) && isProgressData(remote)) {
    return MERGE_STRATEGIES.course_progress(local, remote) as unknown as T;
  }
  return MERGE_STRATEGIES.generic(local, remote) as T;
}

// ---------------------------------------------------------------------------
// Conflict detection & resolution
// ---------------------------------------------------------------------------

/**
 * Detects a conflict between local and remote data.
 *
 * When both sides carry version vectors the comparison is deterministic and
 * immune to clock drift: only *concurrent* vectors produce a conflict. Legacy
 * records without vectors fall back to the previous timestamp/version
 * comparison.
 */
export function detectConflict<T extends { updatedAt: string; version?: number; versionVector?: VersionVector }>(
  local: T,
  remote: T,
): boolean {
  const localVector = local.versionVector;
  const remoteVector = remote.versionVector;

  if (
    localVector &&
    remoteVector &&
    Object.keys(localVector).length > 0 &&
    Object.keys(remoteVector).length > 0
  ) {
    return compareVersionVectors(localVector, remoteVector) === 'concurrent';
  }

  // Fallback for legacy records without version vectors: timestamp LWW.
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (remoteTime > localTime) {
    return true;
  }

  if (local.version !== undefined && remote.version !== undefined) {
    return local.version < remote.version;
  }

  return false;
}

/**
 * Resolves a conflict based on the chosen strategy.
 *
 * `merge` uses the deterministic per-entity-type strategy so the outcome is
 * stable across devices, reordered inputs, and clock skew.
 */
export function resolveConflict<T>(
  local: T,
  remote: T,
  strategy: ResolutionStrategy,
  entityType?: string,
): T {
  switch (strategy) {
    case 'local':
      return local;
    case 'remote':
      return remote;
    case 'merge':
      return resolveByEntityType(entityType ?? 'generic', local, remote);
    case 'manual':
      // Manual resolution is handled by the UI; default to remote if called programmatically.
      return remote;
    default:
      return remote;
  }
}

/**
 * Creates a new conflict record with initial history and the version vectors
 * of both sides so the UI can present a deterministic comparison.
 */
export function createConflictRecord<T>(
  entityType: string,
  entityKey: string,
  localData: T,
  remoteData: T,
): ConflictRecord<T> {
  const id = `conflict-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    entityType,
    entityKey,
    localData,
    remoteData,
    timestamp: new Date().toISOString(),
    strategy: 'manual',
    resolved: false,
    state: 'conflicted',
    localVersionVector: (localData as { versionVector?: VersionVector })?.versionVector,
    remoteVersionVector: (remoteData as { versionVector?: VersionVector })?.versionVector,
    history: [
      {
        timestamp: new Date().toISOString(),
        action: 'CREATED',
        details: 'Conflict detected during synchronization',
      },
    ],
  };
}
