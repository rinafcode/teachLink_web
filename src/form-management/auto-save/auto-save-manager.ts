/**
 * Auto-Save Manager Implementation
 * Handles automatic form data persistence with draft management
 */

import {
  AutoSaveManager,
  FormState,
  SaveStatus,
  SaveStatusCallback,
  Subscription,
  DraftData
} from '../types';

interface SaveQueueItem {
  formId: string;
  data: FormState;
  timestamp: Date;
  retryCount: number;
}

export class AutoSaveManagerImpl implements AutoSaveManager {
  private saveIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private saveQueue: SaveQueueItem[] = [];
  private saveStatus: Map<string, SaveStatus> = new Map();
  private statusCallbacks: Set<SaveStatusCallback> = new Set();
  private storageQuota: number = 5 * 1024 * 1024; // 5MB default
  private isOnline: boolean = true;
  private maxRetries: number = 3;

  constructor(private storage: Storage = localStorage) {
    this.setupNetworkListeners();
  }

  /**
   * Enable auto-save for a form with specified interval
   */
  enableAutoSave(formId: string, interval: number): void {
    // Clear existing interval if any
    this.disableAutoSave(formId);

    // Set initial status
    this.updateSaveStatus(formId, {
      status: 'idle',
      queuedSaves: 0
    });

    // Create interval for automatic saves
    const intervalId = setInterval(() => {
      this.triggerAutoSave(formId);
    }, interval);

    this.saveIntervals.set(formId, intervalId);
  }

  /**
   * Disable auto-save for a form
   */
  private disableAutoSave(formId: string): void {
    const intervalId = this.saveIntervals.get(formId);
    if (intervalId) {
      clearInterval(intervalId);
      this.saveIntervals.delete(formId);
    }
  }

  /**
   * Trigger auto-save for a form (called by interval or blur events)
   */
  private async triggerAutoSave(formId: string): Promise<void> {
    // Get current form state from storage or external source
    // This is a placeholder - in real implementation, this would be provided
    // by the form state manager
    const formState = this.getCurrentFormState(formId);
    if (formState) {
      await this.saveNow(formId, formState);
    }
  }

  /**
   * Save form data immediately
   */
  async saveNow(formId: string, data: FormState): Promise<void> {
    this.updateSaveStatus(formId, {
      status: 'saving',
      queuedSaves: this.saveQueue.length
    });

    try {
      if (!this.isOnline) {
        // Queue save for later if offline
        this.queueSave(formId, data);
        return;
      }

      // Create draft data with metadata
      const draftData: DraftData = {
        formId,
        userId: data.metadata.userId,
        sessionId: data.metadata.sessionId,
        data,
        createdAt: new Date(data.metadata.createdAt),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        compressed: false
      };

      // Check storage quota before saving
      await this.ensureStorageQuota(formId, draftData);

      // Save to storage
      const key = this.getDraftKey(formId);
      this.storage.setItem(key, JSON.stringify(draftData));

      this.updateSaveStatus(formId, {
        status: 'saved',
        lastSaved: new Date(),
        queuedSaves: this.saveQueue.length
      });
    } catch (error) {
      this.updateSaveStatus(formId, {
        status: 'error',
        error: error as Error,
        queuedSaves: this.saveQueue.length
      });

      // Queue for retry if it's a network error
      if (this.isNetworkError(error)) {
        this.queueSave(formId, data);
      }

      throw error;
    }
  }

  /**
   * Load draft data for a form
   */
  async loadDraft(formId: string): Promise<FormState | null> {
    try {
      const key = this.getDraftKey(formId);
      const draftJson = this.storage.getItem(key);

      if (!draftJson) {
        return null;
      }

      const draftData: DraftData = JSON.parse(draftJson);

      // Check if draft has expired
      if (new Date(draftData.expiresAt) < new Date()) {
        await this.clearDraft(formId);
        return null;
      }

      // Validate data integrity
      if (!this.validateDraftIntegrity(draftData)) {
        console.warn(`Draft data integrity check failed for form ${formId}`);
        return null;
      }

      return draftData.data;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }

  /**
   * Clear draft data for a form
   */
  async clearDraft(formId: string): Promise<void> {
    try {
      const key = this.getDraftKey(formId);
      this.storage.removeItem(key);
      this.disableAutoSave(formId);
      this.saveStatus.delete(formId);
    } catch (error) {
      console.error('Error clearing draft:', error);
      throw error;
    }
  }

  /**
   * Set storage quota limit
   */
  setStorageQuota(maxSize: number): void {
    this.storageQuota = maxSize;
  }

  /**
   * Subscribe to save status changes
   */
  onSaveStatusChange(callback: SaveStatusCallback): Subscription {
    this.statusCallbacks.add(callback);

    return {
      unsubscribe: () => {
        this.statusCallbacks.delete(callback);
      }
    };
  }

  /**
   * Queue a save operation for retry
   */
  private queueSave(formId: string, data: FormState): void {
    const existingIndex = this.saveQueue.findIndex(item => item.formId === formId);

    if (existingIndex >= 0) {
      // Update existing queue item
      this.saveQueue[existingIndex] = {
        formId,
        data,
        timestamp: new Date(),
        retryCount: this.saveQueue[existingIndex].retryCount
      };
    } else {
      // Add new queue item
      this.saveQueue.push({
        formId,
        data,
        timestamp: new Date(),
        retryCount: 0
      });
    }

    this.updateSaveStatus(formId, {
      status: 'error',
      error: new Error('Save queued due to network connectivity'),
      queuedSaves: this.saveQueue.length
    });
  }

  /**
   * Process queued saves when connectivity is restored
   */
  private async processQueue(): Promise<void> {
    const queue = [...this.saveQueue];
    this.saveQueue = [];

    for (const item of queue) {
      if (item.retryCount >= this.maxRetries) {
        console.warn(`Max retries reached for form ${item.formId}`);
        continue;
      }

      try {
        await this.saveNow(item.formId, item.data);
      } catch (error) {
        // Re-queue if still failing
        item.retryCount++;
        this.saveQueue.push(item);
      }
    }
  }

  /**
   * Setup network connectivity listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Update save status and notify callbacks
   */
  private updateSaveStatus(formId: string, updates: Partial<SaveStatus>): void {
    const currentStatus = this.saveStatus.get(formId) || {
      status: 'idle',
      queuedSaves: 0
    };

    const newStatus: SaveStatus = {
      ...currentStatus,
      ...updates
    };

    this.saveStatus.set(formId, newStatus);

    // Notify all callbacks
    this.statusCallbacks.forEach(callback => {
      callback(newStatus);
    });
  }

  /**
   * Get draft storage key for a form
   */
  private getDraftKey(formId: string): string {
    return `form-draft-${formId}`;
  }

  /**
   * Validate draft data integrity
   */
  private validateDraftIntegrity(draftData: DraftData): boolean {
    // Check required fields
    if (!draftData.formId || !draftData.data || !draftData.sessionId) {
      return false;
    }

    // Check data structure
    if (!draftData.data.values || !draftData.data.metadata) {
      return false;
    }

    return true;
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message.includes('network');
  }

  /**
   * Ensure storage quota is not exceeded
   */
  private async ensureStorageQuota(formId: string, newDraft: DraftData): Promise<void> {
    const currentSize = this.getStorageSize();
    const newDraftSize = JSON.stringify(newDraft).length;

    if (currentSize + newDraftSize > this.storageQuota) {
      await this.cleanupOldestDrafts(newDraftSize);
    }
  }

  /**
   * Get current storage size
   */
  private getStorageSize(): number {
    let size = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith('form-draft-')) {
        const value = this.storage.getItem(key);
        if (value) {
          size += value.length;
        }
      }
    }
    return size;
  }

  /**
   * Cleanup oldest drafts to free up space
   */
  private async cleanupOldestDrafts(requiredSpace: number): Promise<void> {
    const drafts: Array<{ key: string; updatedAt: Date; size: number }> = [];

    // Collect all drafts with metadata
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith('form-draft-')) {
        const value = this.storage.getItem(key);
        if (value) {
          try {
            const draftData: DraftData = JSON.parse(value);
            drafts.push({
              key,
              updatedAt: new Date(draftData.updatedAt),
              size: value.length
            });
          } catch (error) {
            // Invalid draft, remove it
            this.storage.removeItem(key);
          }
        }
      }
    }

    // Sort by oldest first
    drafts.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

    // Remove oldest drafts until we have enough space
    let freedSpace = 0;
    for (const draft of drafts) {
      if (freedSpace >= requiredSpace) {
        break;
      }
      this.storage.removeItem(draft.key);
      freedSpace += draft.size;
    }
  }

  /**
   * Get current form state (placeholder for integration with state manager)
   */
  private getCurrentFormState(formId: string): FormState | null {
    // This would be provided by the form state manager in real implementation
    // For now, return null to indicate no state available
    return null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all intervals
    this.saveIntervals.forEach(intervalId => clearInterval(intervalId));
    this.saveIntervals.clear();

    // Clear callbacks
    this.statusCallbacks.clear();

    // Clear status
    this.saveStatus.clear();

    // Clear queue
    this.saveQueue = [];
  }
}
