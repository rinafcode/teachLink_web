export type ResolutionStrategy = 'local' | 'remote' | 'merge' | 'manual';

/**
 * Version vector used for deterministic conflict detection.
 *
 * A vector maps a replica/device identifier to the number of operations that
 * replica has contributed. Two vectors are compared entry-wise:
 * - one dominates the other -> that side happened-after, no conflict
 * - neither dominates (both have entries the other lacks) -> concurrent -> conflict
 *
 * Unlike wall-clock timestamps, version vectors are immune to clock drift
 * between devices, which makes resolution deterministic across reordered and
 * clock-skewed inputs.
 */
export type VersionVector = Record<string, number>;

/** Result of comparing two version vectors. */
export type VectorComparison = 'equal' | 'a-dominates' | 'b-dominates' | 'concurrent';

/**
 * UI-facing state of an offline operation / conflict record.
 * - `pending`:   queued locally, not yet acknowledged by the server
 * - `conflicted`: waiting for user resolution
 * - `resolved`:  conflict has been resolved (or record synced successfully)
 */
export type SyncConflictState = 'pending' | 'conflicted' | 'resolved';

export interface ConflictRecord<T> {
  id: string;
  entityType: string;
  entityKey: string;
  localData: T;
  remoteData: T;
  timestamp: string;
  strategy: ResolutionStrategy;
  resolved: boolean;
  /** `pending` | `conflicted` | `resolved` — surfaced to the UI by offline hooks. */
  state: SyncConflictState;
  localVersionVector?: VersionVector;
  remoteVersionVector?: VersionVector;
  history: Array<{
    timestamp: string;
    action: string;
    details?: string;
  }>;
}

export interface SyncMetadata {
  updatedAt: string;
  version: number;
  /** Replica/device that produced the last change. */
  updatedBy?: string;
  /** Logical clock (Lamport) — advances monotonically, immune to clock drift. */
  logicalClock?: number;
  versionVector?: VersionVector;
}

export interface ProgressData extends SyncMetadata {
  progress: number;
  completed: boolean;
}

/** Entity types understood by the deterministic merge engine. */
export type MergeEntityType = 'course_progress' | 'generic';

/**
 * Per-entity-type deterministic merge strategy.
 *
 * A strategy is a pure function of (local, remote) that returns the merged
 * record. It MUST be deterministic (no dependence on wall-clock ordering or
 * argument order), so that the same inputs always produce the same output on
 * every device.
 */
export type MergeStrategy<T = unknown> = (local: T, remote: T) => T;

// ---------------------------------------------------------------------------
// Per-entity-type resolution policy
// ---------------------------------------------------------------------------

/** Resolution strategy overrides keyed by entity type. */
export type EntityStrategyMap = Readonly<Record<string, ResolutionStrategy>>;

/**
 * How conflicts are resolved, per entity type.
 *
 * A single global strategy is wrong for a store holding several entity types:
 * course progress merges cleanly (max progress, OR-ed completion), while an
 * entity whose fields cannot be combined — a submitted assessment, say — has
 * to pick a side or ask the user. `byEntityType` records those decisions and
 * `default` covers everything not listed.
 */
export interface ConflictResolutionPolicy {
  /** Applied when no entity-type override matches. */
  readonly default: ResolutionStrategy;
  /** Overrides keyed by entity type. */
  readonly byEntityType: EntityStrategyMap;
}
