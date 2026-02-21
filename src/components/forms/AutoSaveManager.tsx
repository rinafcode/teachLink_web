/**
 * Auto-Save Manager Component
 * Provides UI for auto-save functionality with status indicators
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AutoSaveManagerImpl } from '@/form-management/auto-save/auto-save-manager';
import { FormState, SaveStatus } from '@/form-management/types/core';

interface AutoSaveManagerProps {
  formId: string;
  formState: FormState;
  enabled?: boolean;
  interval?: number;
  saveOnBlur?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  className?: string;
}

export const AutoSaveManager: React.FC<AutoSaveManagerProps> = ({
  formId,
  formState,
  enabled = true,
  interval = 5000,
  saveOnBlur = true,
  onSaveSuccess,
  onSaveError,
  className = ''
}) => {
  const [autoSaveManager] = useState(() => new AutoSaveManagerImpl());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'idle',
    queuedSaves: 0
  });
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  useEffect(() => {
    if (!enabled) return;

    // Enable auto-save
    autoSaveManager.enableAutoSave(formId, interval);

    // Subscribe to status changes
    const subscription = autoSaveManager.onSaveStatusChange((status) => {
      setSaveStatus(status);

      if (status.status === 'saved') {
        setLastSavedTime(new Date().toLocaleTimeString());
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } else if (status.status === 'error' && status.error) {
        if (onSaveError) {
          onSaveError(status.error);
        }
      }
    });

    // Load draft on mount
    autoSaveManager.loadDraft(formId).then((draft) => {
      if (draft) {
        console.log('Draft loaded:', draft);
      }
    });

    return () => {
      subscription.unsubscribe();
      autoSaveManager.destroy();
    };
  }, [formId, enabled, interval, autoSaveManager, onSaveSuccess, onSaveError]);

  // Save on form state changes
  useEffect(() => {
    if (!enabled) return;

    const saveData = async () => {
      try {
        await autoSaveManager.saveNow(formId, formState);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const timer = setTimeout(saveData, 500); // Debounce saves
    return () => clearTimeout(timer);
  }, [formState, formId, enabled, autoSaveManager]);

  const handleManualSave = async () => {
    try {
      await autoSaveManager.saveNow(formId, formState);
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  const handleClearDraft = async () => {
    try {
      await autoSaveManager.clearDraft(formId);
      setLastSavedTime('');
    } catch (error) {
      console.error('Clear draft failed:', error);
    }
  };

  const getStatusIcon = () => {
    switch (saveStatus.status) {
      case 'saving':
        return '💾';
      case 'saved':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  const getStatusText = () => {
    switch (saveStatus.status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSavedTime ? `Saved at ${lastSavedTime}` : 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return 'Ready';
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className={`auto-save-manager ${className}`}>
      <div className={`save-status save-status-${saveStatus.status}`}>
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
        
        {saveStatus.queuedSaves > 0 && (
          <span className="queued-saves">
            ({saveStatus.queuedSaves} queued)
          </span>
        )}
      </div>

      <div className="save-actions">
        <button
          onClick={handleManualSave}
          disabled={saveStatus.status === 'saving'}
          className="btn-save"
          title="Save now"
        >
          Save Now
        </button>

        <button
          onClick={handleClearDraft}
          className="btn-clear"
          title="Clear saved draft"
        >
          Clear Draft
        </button>
      </div>

      {saveStatus.error && (
        <div className="save-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{saveStatus.error.message}</span>
        </div>
      )}
    </div>
  );
};

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  compact?: boolean;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  compact = false,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'saving':
        return '#fbbf24'; // yellow
      case 'saved':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  if (compact) {
    return (
      <div
        className={`auto-save-indicator-compact ${className}`}
        style={{ backgroundColor: getStatusColor() }}
        title={status.status}
      />
    );
  }

  return (
    <div className={`auto-save-indicator ${className}`}>
      <div
        className="indicator-dot"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="indicator-text">
        {status.status === 'saving' && 'Saving...'}
        {status.status === 'saved' && 'All changes saved'}
        {status.status === 'error' && 'Failed to save'}
        {status.status === 'idle' && 'Auto-save enabled'}
      </span>
    </div>
  );
};
