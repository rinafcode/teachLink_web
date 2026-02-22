import { useStore } from './stateManager';

const CHANNEL_NAME = 'teachlink_state_sync';

/**
 * Synchronization engine for keeping state in sync across multiple browser tabs.
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

  /**
   * Sets up the broadcast channel listeners.
   */
  private setupListeners() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      if (this.isProcessingSync) return;

      const { type, payload } = event.data;

      if (type === 'STATE_UPDATE') {
        console.log('[SyncEngine] Received state update from another tab');
        this.isProcessingSync = true;
        
        // Update the local store with the external state
        useStore.getState().rehydrate(payload);
        
        this.isProcessingSync = false;
      }
    };

    // Subscribing to store changes to broadcast them
    useStore.subscribe((state, prevState) => {
      if (this.isProcessingSync) return;

      // Simple check to avoid unnecessary broadcasts
      // In a real scenario, you might want a deeper comparison or specific action tracking
      if (JSON.stringify(state) !== JSON.stringify(prevState)) {
        this.broadcastState(state);
      }
    });
  }

  /**
   * Broadcasts the current state to other tabs.
   */
  private broadcastState(state: any) {
    if (!this.channel) return;

    console.log('[SyncEngine] Broadcasting state update to other tabs');
    this.channel.postMessage({
      type: 'STATE_UPDATE',
      payload: state,
    });
  }

  /**
   * Disconnects the sync engine.
   */
  public disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Global instance
export const syncEngine = new SynchronizationEngine();
