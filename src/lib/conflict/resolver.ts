import { ConflictRecord, ResolutionStrategy, ProgressData } from './types';

export type { ConflictRecord, ResolutionStrategy } from './types';

/**
 * Detects if a conflict exists between local and remote data based on timestamps and versions.
 */
export function detectConflict<T extends { updatedAt: string; version?: number }>(
  local: T,
  remote: T,
): boolean {
  // If remote is newer than local, we have a potential conflict
  // (Assuming local changes were made while remote was already newer)
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
 */
export function resolveConflict<T>(local: T, remote: T, strategy: ResolutionStrategy): T {
  switch (strategy) {
    case 'local':
      return local;
    case 'remote':
      return remote;
    case 'merge':
      return mergeData(local, remote);
    case 'manual':
      // Manual resolution handled by UI, default to remote if called programmatically
      return remote;
    default:
      return remote;
  }
}

/**
 * Merges two data objects. Specifically handles ProgressData.
 */
function mergeData<T>(local: T, remote: T): T {
  // If it's progress data, we merge by taking the maximum progress and completion status
  if (isProgressData(local) && isProgressData(remote)) {
    const merged: ProgressData = {
      ...remote,
      progress: Math.max(local.progress, remote.progress),
      completed: local.completed || remote.completed,
      updatedAt: new Date().toISOString(),
      version: Math.max(local.version || 0, remote.version || 0) + 1,
    };
    return merged as unknown as T;
  }

  // Generic merge (last write wins on field level if they were objects, but here we just return remote)
  return { ...local, ...remote };
}

function isProgressData(data: any): data is ProgressData {
  return (
    data &&
    typeof data.progress === 'number' &&
    typeof data.completed === 'boolean' &&
    typeof data.updatedAt === 'string'
  );
}

/**
 * Creates a new conflict record with initial history.
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
    history: [
      {
        timestamp: new Date().toISOString(),
        action: 'CREATED',
        details: 'Conflict detected during synchronization',
      },
    ],
  };
}
