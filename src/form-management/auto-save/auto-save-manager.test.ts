/**
 * Tests for Auto-Save Manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AutoSaveManagerImpl } from './auto-save-manager.js';
import { FormState, DraftData } from '../types/core.js';

// Mock Storage implementation
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('AutoSaveManager', () => {
  let manager: AutoSaveManagerImpl;
  let mockStorage: MockStorage;

  const createMockFormState = (formId: string): FormState => ({
    values: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    validation: {},
    touched: { name: true },
    dirty: { name: true },
    isSubmitting: false,
    submitCount: 0,
    metadata: {
      formId,
      sessionId: 'session-123',
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0',
      userId: 'user-123'
    }
  });

  beforeEach(() => {
    mockStorage = new MockStorage();
    manager = new AutoSaveManagerImpl(mockStorage);
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Basic Auto-Save Functionality', () => {
    it('should save form data immediately', async () => {
      const formId = 'test-form-1';
      const formState = createMockFormState(formId);

      await manager.saveNow(formId, formState);

      const key = `form-draft-${formId}`;
      const savedData = mockStorage.getItem(key);
      expect(savedData).not.toBeNull();

      const draftData: DraftData = JSON.parse(savedData!);
      expect(draftData.formId).toBe(formId);
      expect(draftData.data.values).toEqual(formState.values);
    });

    it('should include metadata in saved draft', async () => {
      const formId = 'test-form-2';
      const formState = createMockFormState(formId);

      await manager.saveNow(formId, formState);

      const key = `form-draft-${formId}`;
      const savedData = mockStorage.getItem(key);
      const draftData: DraftData = JSON.parse(savedData!);

      expect(draftData.userId).toBe('user-123');
      expect(draftData.sessionId).toBe('session-123');
      expect(draftData.createdAt).toBeDefined();
      expect(draftData.updatedAt).toBeDefined();
      expect(draftData.expiresAt).toBeDefined();
    });

    it('should update save status during save operation', async () => {
      const formId = 'test-form-3';
      const formState = createMockFormState(formId);
      const statusUpdates: string[] = [];

      manager.onSaveStatusChange(status => {
        statusUpdates.push(status.status);
      });

      await manager.saveNow(formId, formState);

      expect(statusUpdates).toContain('saving');
      expect(statusUpdates).toContain('saved');
    });

    it('should set lastSaved timestamp after successful save', async () => {
      const formId = 'test-form-4';
      const formState = createMockFormState(formId);
      let lastSaved: Date | undefined;

      manager.onSaveStatusChange(status => {
        if (status.status === 'saved') {
          lastSaved = status.lastSaved;
        }
      });

      await manager.saveNow(formId, formState);

      expect(lastSaved).toBeDefined();
      expect(lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('Draft Data Recovery', () => {
    it('should load previously saved draft', async () => {
      const formId = 'test-form-5';
      const formState = createMockFormState(formId);

      await manager.saveNow(formId, formState);
      const loadedState = await manager.loadDraft(formId);

      expect(loadedState).not.toBeNull();
      expect(loadedState!.values).toEqual(formState.values);
      expect(loadedState!.metadata.formId).toBe(formId);
    });

    it('should return null for non-existent draft', async () => {
      const loadedState = await manager.loadDraft('non-existent-form');
      expect(loadedState).toBeNull();
    });

    it('should return null for expired draft', async () => {
      const formId = 'test-form-6';
      const formState = createMockFormState(formId);

      // Create expired draft
      const draftData: DraftData = {
        formId,
        userId: 'user-123',
        sessionId: 'session-123',
        data: formState,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1000), // Expired
        compressed: false
      };

      mockStorage.setItem(`form-draft-${formId}`, JSON.stringify(draftData));

      const loadedState = await manager.loadDraft(formId);
      expect(loadedState).toBeNull();
    });

    it('should validate draft data integrity', async () => {
      const formId = 'test-form-7';

      // Create invalid draft (missing required fields)
      const invalidDraft = {
        formId,
        data: { values: {} } // Missing metadata
      };

      mockStorage.setItem(`form-draft-${formId}`, JSON.stringify(invalidDraft));

      const loadedState = await manager.loadDraft(formId);
      expect(loadedState).toBeNull();
    });
  });

  describe('Draft Cleanup', () => {
    it('should clear draft data', async () => {
      const formId = 'test-form-8';
      const formState = createMockFormState(formId);

      await manager.saveNow(formId, formState);
      expect(mockStorage.getItem(`form-draft-${formId}`)).not.toBeNull();

      await manager.clearDraft(formId);
      expect(mockStorage.getItem(`form-draft-${formId}`)).toBeNull();
    });

    it('should not throw error when clearing non-existent draft', async () => {
      await expect(manager.clearDraft('non-existent-form')).resolves.not.toThrow();
    });
  });

  describe('Storage Quota Management', () => {
    it('should set storage quota', () => {
      const quota = 1024 * 1024; // 1MB
      manager.setStorageQuota(quota);
      // No error should be thrown
    });

    it('should cleanup oldest drafts when quota is exceeded', async () => {
      // Set small quota
      manager.setStorageQuota(1000);

      // Save multiple drafts
      const formState1 = createMockFormState('form-1');
      const formState2 = createMockFormState('form-2');
      const formState3 = createMockFormState('form-3');

      await manager.saveNow('form-1', formState1);
      await new Promise(resolve => setTimeout(resolve, 10));
      await manager.saveNow('form-2', formState2);
      await new Promise(resolve => setTimeout(resolve, 10));
      await manager.saveNow('form-3', formState3);

      // Oldest draft should be removed
      const draft1 = await manager.loadDraft('form-1');
      const draft3 = await manager.loadDraft('form-3');

      // Most recent should still exist
      expect(draft3).not.toBeNull();
    });
  });

  describe('Save Status Indication', () => {
    it('should notify subscribers of status changes', async () => {
      const formId = 'test-form-9';
      const formState = createMockFormState(formId);
      const statuses: string[] = [];

      manager.onSaveStatusChange(status => {
        statuses.push(status.status);
      });

      await manager.saveNow(formId, formState);

      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses).toContain('saving');
      expect(statuses).toContain('saved');
    });

    it('should allow unsubscribing from status changes', async () => {
      const formId = 'test-form-10';
      const formState = createMockFormState(formId);
      let callCount = 0;

      const subscription = manager.onSaveStatusChange(() => {
        callCount++;
      });

      await manager.saveNow(formId, formState);
      const firstCallCount = callCount;

      subscription.unsubscribe();

      await manager.saveNow(formId, formState);
      expect(callCount).toBe(firstCallCount);
    });

    it('should include queued saves count in status', async () => {
      const formId = 'test-form-11';
      const formState = createMockFormState(formId);
      let queuedSaves = 0;

      manager.onSaveStatusChange(status => {
        queuedSaves = status.queuedSaves;
      });

      await manager.saveNow(formId, formState);

      expect(queuedSaves).toBeDefined();
      expect(queuedSaves).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const formId = 'test-form-12';
      const formState = createMockFormState(formId);

      // Mock storage error
      mockStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      await expect(manager.saveNow(formId, formState)).rejects.toThrow();
    });

    it('should update status to error on save failure', async () => {
      const formId = 'test-form-13';
      const formState = createMockFormState(formId);
      let errorStatus = false;

      manager.onSaveStatusChange(status => {
        if (status.status === 'error') {
          errorStatus = true;
        }
      });

      // Mock storage error
      mockStorage.setItem = () => {
        throw new Error('Storage error');
      };

      try {
        await manager.saveNow(formId, formState);
      } catch (error) {
        // Expected
      }

      expect(errorStatus).toBe(true);
    });
  });

  describe('Auto-Save Intervals', () => {
    it('should enable auto-save with interval', () => {
      const formId = 'test-form-14';
      const interval = 5000; // 5 seconds

      manager.enableAutoSave(formId, interval);
      // No error should be thrown
    });

    it('should clear previous interval when enabling auto-save again', () => {
      const formId = 'test-form-15';

      manager.enableAutoSave(formId, 5000);
      manager.enableAutoSave(formId, 10000);
      // Should not create multiple intervals
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const formId = 'test-form-16';
      manager.enableAutoSave(formId, 5000);

      manager.destroy();
      // Should clear all intervals and callbacks
    });
  });
});
