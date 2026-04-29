export type ResolutionStrategy = 'local' | 'remote' | 'merge' | 'manual';

export interface ConflictRecord<T> {
  id: string;
  entityType: string;
  entityKey: string;
  localData: T;
  remoteData: T;
  timestamp: string;
  strategy: ResolutionStrategy;
  resolved: boolean;
  history: Array<{
    timestamp: string;
    action: string;
    details?: string;
  }>;
}

export interface SyncMetadata {
  updatedAt: string;
  version: number;
}

export interface ProgressData extends SyncMetadata {
  progress: number;
  completed: boolean;
}
