import { useStore } from './stateManager';
import { createLogger } from '@/lib/logging';

const logger = createLogger('synchronization-engine');

const CHANNEL_NAME = 'teachlink_state_sync';

const SYNC_KEYS = ['user', 'preferences', 'offlineMode', 'lastSynced'] as const;

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

      const hasChanged = SYNC_KEYS.some(key => 
        JSON.stringify((state as any)[key]) !== JSON.stringify((prevState as any)[key])
      );

      if (hasChanged) {
        this.broadcastState(state);
      }
    });
  }

  private broadcastState(state: any) {
    if (!this.channel) return;

    logger.debug('[SyncEngine] Broadcasting state update to other tabs');
    // Only send the synced slice
    const syncedState = SYNC_KEYS.reduce((acc, key) => {
      acc[key] = state[key as keyof typeof state];
      return acc;
    }, {} as any);

    console.log('[SyncEngine] Broadcasting synced state slice');
    this.channel.postMessage({
      type: 'STATE_UPDATE',
      payload: syncedState,
    });
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
