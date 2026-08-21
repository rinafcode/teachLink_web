import { useStore } from './stateManager';
import { createLogger } from '@/lib/logging';
import { persistenceLayer } from './persistenceLayer';
import { SyncStatusState } from './stateManager';

const logger = createLogger('synchronization-engine');

const CHANNEL_NAME = 'teachlink_state_sync';

const SYNC_STATE_KEY = 'offline_sync_status';

/** Shallow equality: primitives compared by value, objects by reference-per-key. */
function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(k => a[k] === b[k]);
}

/** The slice of store state that is safe to broadcast across tabs. */
function syncedStateSlice(state: any) {
  return {
    user: state.user,
    app: {
      offlineMode: state.app?.offlineMode,
      lastSynced: state.app?.lastSynced,
      syncStatus: state.app?.syncStatus,
    },
  };
}

/** True when any of the persisted keys that matter for cross-tab sync changed. */
function hasSyncedKeyChanged(state: any, prevState: any): boolean {
  if (!shallowEqual(state.user, prevState.user)) return true;
  if (state.app?.offlineMode !== prevState.app?.offlineMode) return true;
  if (state.app?.lastSynced !== prevState.app?.lastSynced) return true;
  if (state.app?.syncStatus !== prevState.app?.syncStatus) return true;
  return false;
}

/** Result of a batch drain, reconciled into the persisted store. */
export interface DrainResult {
  success: boolean;
  syncedItems: number;
  conflicts: number;
  lastSyncTime: string;
}

/** Derives the UI-facing sync status from a drain result + pending counts. */
function deriveSyncStatus(result: DrainResult, pending: number): SyncStatusState {
  if (!result.success) return 'pending';
  if (result.conflicts > 0) return 'conflicted';
  if (pending > 0) return 'pending';
  return result.syncedItems > 0 ? 'resolved' : 'idle';
}

/**
 * Synchronization engine for keeping state in sync across multiple browser tabs.
 * Only broadcasts persisted keys to avoid unnecessary UI state sync.
 */
export class SynchronizationEngine {
  private channel: BroadcastChannel | null = null;
  private isProcessingSync = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.setupListeners();
    }
  }

  private setupListeners() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      if (this.isProcessingSync) return;
      const { type, payload } = event.data;
      if (type === 'STATE_UPDATE') {
        this.isProcessingSync = true;
        useStore.getState().rehydrate(payload);
        this.isProcessingSync = false;
      }
    };

    // Subscribe only to relevant keys
    useStore.subscribe((state: any, prevState: any) => {
      if (this.isProcessingSync) return;

      if (hasSyncedKeyChanged(state, prevState)) {
        this.broadcastState(state);
      }
    });
  }

  private broadcastState(state: any) {
    if (!this.channel) return;

    logger.debug('[SyncEngine] Broadcasting state update to other tabs');
    this.channel.postMessage({
      type: 'STATE_UPDATE',
      payload: syncedStateSlice(state),
    });
  }

  /**
   * Reconciles the persisted store after each drain: updates `lastSynced` and
   * the UI-facing `syncStatus`, persists a snapshot via the persistence layer,
   * and broadcasts the change to other tabs.
   */
  public async recordDrainResult(result: DrainResult, pending = 0): Promise<void> {
    const syncStatus = deriveSyncStatus(result, pending);

    useStore.setState((state: any) => ({
      app: {
        ...state.app,
        lastSynced: Date.now(),
        syncStatus,
      },
    }));

    try {
      await persistenceLayer.setJSON(SYNC_STATE_KEY, {
        lastSyncTime: result.lastSyncTime,
        success: result.success,
        syncedItems: result.syncedItems,
        conflicts: result.conflicts,
        syncStatus,
        pending,
      });
    } catch (error) {
      logger.error('[SyncEngine] Failed to persist sync state', { error });
    }

    this.broadcastState(useStore.getState());
  }

  /** Latest persisted sync snapshot (survives restarts). */
  public async getDrainSnapshot() {
    return persistenceLayer.getJSON<{
      lastSyncTime: string;
      success: boolean;
      syncedItems: number;
      conflicts: number;
      syncStatus: SyncStatusState;
      pending: number;
    }>(SYNC_STATE_KEY);
  }

  public disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Global instance
export const syncEngine = new SynchronizationEngine();
