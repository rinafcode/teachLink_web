/**
 * Auto-Save Manager Usage Example
 * 
 * This example demonstrates how to use the Auto-Save Manager to automatically
 * save form data, recover drafts, and handle offline scenarios.
 */

import { AutoSaveManagerImpl } from '../auto-save/auto-save-manager.js';
import { FormState } from '../types/core.js';

// Example: Basic Auto-Save Setup
export function basicAutoSaveExample() {
  // Create an auto-save manager instance
  const autoSaveManager = new AutoSaveManagerImpl();

  // Enable auto-save for a form with 5-second interval
  const formId = 'user-registration-form';
  const intervalMs = 5000; // 5 seconds
  autoSaveManager.enableAutoSave(formId, intervalMs);

  // Subscribe to save status changes
  const subscription = autoSaveManager.onSaveStatusChange((status) => {
    console.log('Save status:', status.status);
    if (status.lastSaved) {
      console.log('Last saved at:', status.lastSaved);
    }
    if (status.error) {
      console.error('Save error:', status.error.message);
    }
  });

  // Later, unsubscribe when no longer needed
  // subscription.unsubscribe();

  return { autoSaveManager, subscription };
}

// Example: Manual Save
export async function manualSaveExample() {
  const autoSaveManager = new AutoSaveManagerImpl();
  const formId = 'contact-form';

  // Create form state to save
  const formState: FormState = {
    values: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message.'
    },
    validation: {},
    touched: { name: true, email: true },
    dirty: { name: true, email: true },
    isSubmitting: false,
    submitCount: 0,
    metadata: {
      formId,
      sessionId: 'session-123',
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0'
    }
  };

  // Save immediately
  try {
    await autoSaveManager.saveNow(formId, formState);
    console.log('Form data saved successfully');
  } catch (error) {
    console.error('Failed to save form data:', error);
  }

  return autoSaveManager;
}

// Example: Draft Recovery
export async function draftRecoveryExample() {
  const autoSaveManager = new AutoSaveManagerImpl();
  const formId = 'survey-form';

  // Try to load a previously saved draft
  const draftState = await autoSaveManager.loadDraft(formId);

  if (draftState) {
    console.log('Draft found! Restoring form data...');
    console.log('Restored values:', draftState.values);
    console.log('Last modified:', draftState.metadata.lastModified);
    
    // Use the restored state to populate the form
    return draftState;
  } else {
    console.log('No draft found. Starting with empty form.');
    return null;
  }
}

// Example: Draft Cleanup After Submission
export async function draftCleanupExample() {
  const autoSaveManager = new AutoSaveManagerImpl();
  const formId = 'checkout-form';

  // Simulate form submission
  const submitForm = async (formData: any) => {
    // Submit to server...
    console.log('Submitting form:', formData);
    return { success: true };
  };

  // After successful submission, clear the draft
  const result = await submitForm({ /* form data */ });
  
  if (result.success) {
    await autoSaveManager.clearDraft(formId);
    console.log('Draft cleared after successful submission');
  }

  return autoSaveManager;
}

// Example: Storage Quota Management
export function storageQuotaExample() {
  const autoSaveManager = new AutoSaveManagerImpl();

  // Set storage quota to 2MB
  const quotaInBytes = 2 * 1024 * 1024;
  autoSaveManager.setStorageQuota(quotaInBytes);

  console.log('Storage quota set to 2MB');
  console.log('Oldest drafts will be automatically removed when quota is exceeded');

  return autoSaveManager;
}

// Example: Offline Save Handling
export async function offlineSaveExample() {
  const autoSaveManager = new AutoSaveManagerImpl();
  const formId = 'feedback-form';

  // Subscribe to status changes to monitor offline saves
  autoSaveManager.onSaveStatusChange((status) => {
    if (status.status === 'error' && status.queuedSaves > 0) {
      console.log(`Save queued. ${status.queuedSaves} saves waiting for connectivity.`);
    } else if (status.status === 'saved' && status.queuedSaves === 0) {
      console.log('All queued saves processed successfully!');
    }
  });

  // Try to save (will be queued if offline)
  const formState: FormState = {
    values: { feedback: 'Great service!' },
    validation: {},
    touched: {},
    dirty: {},
    isSubmitting: false,
    submitCount: 0,
    metadata: {
      formId,
      sessionId: 'session-456',
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0'
    }
  };

  try {
    await autoSaveManager.saveNow(formId, formState);
  } catch (error) {
    console.log('Save failed, but will retry when online');
  }

  return autoSaveManager;
}

// Example: Complete Form with Auto-Save Integration
export function completeFormExample() {
  const autoSaveManager = new AutoSaveManagerImpl();
  const formId = 'application-form';

  // 1. Enable auto-save
  autoSaveManager.enableAutoSave(formId, 10000); // 10 seconds

  // 2. Set storage quota
  autoSaveManager.setStorageQuota(5 * 1024 * 1024); // 5MB

  // 3. Try to recover draft on form load
  autoSaveManager.loadDraft(formId).then((draft) => {
    if (draft) {
      console.log('Recovered draft from previous session');
      // Populate form with draft data
    }
  });

  // 4. Subscribe to save status for UI updates
  const subscription = autoSaveManager.onSaveStatusChange((status) => {
    // Update UI based on status
    switch (status.status) {
      case 'saving':
        console.log('💾 Saving...');
        break;
      case 'saved':
        console.log('✅ Saved at', status.lastSaved?.toLocaleTimeString());
        break;
      case 'error':
        console.log('❌ Save failed:', status.error?.message);
        break;
    }
  });

  // 5. Manual save on field blur
  const handleFieldBlur = async (fieldId: string, value: any) => {
    const currentState: FormState = {
      values: { [fieldId]: value },
      validation: {},
      touched: { [fieldId]: true },
      dirty: { [fieldId]: true },
      isSubmitting: false,
      submitCount: 0,
      metadata: {
        formId,
        sessionId: 'session-789',
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0'
      }
    };

    await autoSaveManager.saveNow(formId, currentState);
  };

  // 6. Clear draft on successful submission
  const handleSubmit = async (formData: any) => {
    // Submit form...
    const success = true;
    
    if (success) {
      await autoSaveManager.clearDraft(formId);
      subscription.unsubscribe();
      autoSaveManager.destroy();
    }
  };

  return {
    autoSaveManager,
    subscription,
    handleFieldBlur,
    handleSubmit
  };
}

// Example: Visual Status Indicator Component (pseudo-code)
export function statusIndicatorExample() {
  const autoSaveManager = new AutoSaveManagerImpl();

  // Create a status indicator element
  const createStatusIndicator = () => {
    const indicator = {
      element: null as HTMLElement | null,
      update: (status: string, message: string) => {
        console.log(`[${status}] ${message}`);
        // In a real app, update DOM element
      }
    };

    autoSaveManager.onSaveStatusChange((status) => {
      switch (status.status) {
        case 'idle':
          indicator.update('idle', 'Ready');
          break;
        case 'saving':
          indicator.update('saving', 'Saving changes...');
          break;
        case 'saved':
          const time = status.lastSaved?.toLocaleTimeString() || '';
          indicator.update('saved', `Saved at ${time}`);
          break;
        case 'error':
          indicator.update('error', `Error: ${status.error?.message || 'Unknown error'}`);
          break;
      }
    });

    return indicator;
  };

  return createStatusIndicator();
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== Auto-Save Manager Examples ===\n');

  console.log('1. Basic Auto-Save Setup');
  basicAutoSaveExample();

  console.log('\n2. Manual Save');
  manualSaveExample();

  console.log('\n3. Draft Recovery');
  draftRecoveryExample();

  console.log('\n4. Storage Quota Management');
  storageQuotaExample();

  console.log('\n5. Complete Form Example');
  completeFormExample();
}
