import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AutoSaveManager, AutoSaveIndicator } from '../AutoSaveManager';
import type { SaveStatus, FormState } from '@/form-management/types/core';

const mockSaveNow = vi.fn();
const mockEnableAutoSave = vi.fn();
const mockOnSaveStatusChange = vi.fn();
const mockDestroy = vi.fn();
const mockLoadDraft = vi.fn();
const mockClearDraft = vi.fn();

vi.mock('@/form-management/auto-save/auto-save-manager', () => ({
  AutoSaveManagerImpl: vi.fn().mockImplementation(() => ({
    enableAutoSave: mockEnableAutoSave,
    onSaveStatusChange: mockOnSaveStatusChange,
    loadDraft: mockLoadDraft,
    saveNow: mockSaveNow,
    clearDraft: mockClearDraft,
    destroy: mockDestroy,
  })),
}));

const mockNotifyError = vi.fn();
const mockNotifySuccess = vi.fn();

vi.mock('@/hooks/use-notification', () => ({
  useNotification: vi.fn(() => ({
    success: mockNotifySuccess,
    error: mockNotifyError,
  })),
}));

const minimalFormState: FormState = {
  values: {},
  validation: {},
  touched: {},
  dirty: {},
  isSubmitting: false,
  submitCount: 0,
  metadata: {
    formId: 'test',
    sessionId: 'test-session',
    createdAt: new Date('2025-01-01'),
    lastModified: new Date('2025-01-01'),
    version: '1.0',
  },
};

let statusCallback: ((status: SaveStatus) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  statusCallback = null;
  mockOnSaveStatusChange.mockImplementation((cb: (status: SaveStatus) => void) => {
    statusCallback = cb;
    return { unsubscribe: vi.fn() };
  });
  mockSaveNow.mockResolvedValue(undefined);
  mockLoadDraft.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AutoSaveManager', () => {
  describe('debounced save', () => {
    it('does not call saveNow immediately after mount', () => {
      vi.useFakeTimers();
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      expect(mockSaveNow).not.toHaveBeenCalled();
    });

    it('calls saveNow after the 500ms debounce delay', () => {
      vi.useFakeTimers();
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      act(() => { vi.advanceTimersByTime(500); });

      expect(mockSaveNow).toHaveBeenCalledTimes(1);
      expect(mockSaveNow).toHaveBeenCalledWith('test', minimalFormState);
    });

    it('resets the debounce timer when formState changes rapidly', () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <AutoSaveManager formId="test" formState={minimalFormState} />,
      );

      act(() => { vi.advanceTimersByTime(300); });
      expect(mockSaveNow).not.toHaveBeenCalled();

      const updatedState: FormState = {
        ...minimalFormState,
        values: { field: 'updated' },
      };
      rerender(<AutoSaveManager formId="test" formState={updatedState} />);

      act(() => { vi.advanceTimersByTime(300); });
      expect(mockSaveNow).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(200); });
      expect(mockSaveNow).toHaveBeenCalledTimes(1);
      expect(mockSaveNow).toHaveBeenCalledWith('test', updatedState);
    });

    it('does not schedule a debounced save when enabled is false', () => {
      vi.useFakeTimers();
      render(
        <AutoSaveManager formId="test" formState={minimalFormState} enabled={false} />,
      );

      act(() => { vi.advanceTimersByTime(500); });

      expect(mockSaveNow).not.toHaveBeenCalled();
    });

    it('renders nothing when enabled is false', () => {
      const { container } = render(
        <AutoSaveManager formId="test" formState={minimalFormState} enabled={false} />,
      );

      expect(container.innerHTML).toBe('');
    });
  });

  describe('concurrency guard', () => {
    it('skips a save when another save is already in progress', async () => {
      vi.useFakeTimers();

      let resolveSave: (value: void) => void = () => {};
      const saveDeferred = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      mockSaveNow.mockReturnValue(saveDeferred);

      const { rerender } = render(
        <AutoSaveManager formId="test" formState={minimalFormState} />,
      );

      act(() => { vi.advanceTimersByTime(500); });
      expect(mockSaveNow).toHaveBeenCalledTimes(1);

      const state2: FormState = {
        ...minimalFormState,
        values: { field: 'concurrent' },
      };
      rerender(<AutoSaveManager formId="test" formState={state2} />);

      act(() => { vi.advanceTimersByTime(500); });
      expect(mockSaveNow).toHaveBeenCalledTimes(1);

      await act(async () => { resolveSave(); });

      const state3: FormState = {
        ...minimalFormState,
        values: { field: 'after-concurrent' },
      };
      rerender(<AutoSaveManager formId="test" formState={state3} />);

      act(() => { vi.advanceTimersByTime(500); });
      expect(mockSaveNow).toHaveBeenCalledTimes(2);
    });
  });

  describe('status transitions', () => {
    it('renders idle status initially with Ready text', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('⏸️')).toBeInTheDocument();
    });

    it('renders saving status with Saving... text', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      act(() => {
        statusCallback!({ status: 'saving', queuedSaves: 0 });
      });

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('💾')).toBeInTheDocument();
    });

    it('renders saved status with Saved at text', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      act(() => {
        statusCallback!({ status: 'saved', queuedSaves: 0 });
      });

      expect(screen.getByText(/^Saved at/)).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('renders error status with error message', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      const testError = new Error('Network failure');
      act(() => {
        statusCallback!({ status: 'error', error: testError, queuedSaves: 1 });
      });

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Network failure')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('shows queued saves count when greater than 0', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      act(() => {
        statusCallback!({ status: 'saving', queuedSaves: 3 });
      });

      expect(screen.getByText('(3 queued)')).toBeInTheDocument();
    });

    it('calls onSaveSuccess when status transitions to saved', () => {
      const onSaveSuccess = vi.fn();
      render(
        <AutoSaveManager
          formId="test"
          formState={minimalFormState}
          onSaveSuccess={onSaveSuccess}
        />,
      );

      act(() => {
        statusCallback!({ status: 'saved', queuedSaves: 0 });
      });

      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    });

    it('calls onSaveError and notifyError when status transitions to error', () => {
      const onSaveError = vi.fn();
      const testError = new Error('Server error');
      render(
        <AutoSaveManager
          formId="test"
          formState={minimalFormState}
          onSaveError={onSaveError}
        />,
      );

      act(() => {
        statusCallback!({ status: 'error', error: testError, queuedSaves: 0 });
      });

      expect(onSaveError).toHaveBeenCalledWith(testError);
      expect(mockNotifyError).toHaveBeenCalledWith(
        'Auto-save Error: Server error',
      );
    });

    it('uses updated onSaveSuccess callback via ref', () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();
      const { rerender } = render(
        <AutoSaveManager
          formId="test"
          formState={minimalFormState}
          onSaveSuccess={firstCallback}
        />,
      );

      rerender(
        <AutoSaveManager
          formId="test"
          formState={minimalFormState}
          onSaveSuccess={secondCallback}
        />,
      );

      act(() => {
        statusCallback!({ status: 'saved', queuedSaves: 0 });
      });

      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalledTimes(1);
    });

    it('disables manual save button when status is saving', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      act(() => {
        statusCallback!({ status: 'saving', queuedSaves: 0 });
      });

      expect(screen.getByTitle('Save now')).toBeDisabled();
    });
  });

  describe('manual save and draft management', () => {
    it('calls loadDraft on mount', () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      expect(mockLoadDraft).toHaveBeenCalledWith('test');
    });

    it('calls saveNow when manual save button is clicked', async () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      await act(async () => {
        screen.getByTitle('Save now').click();
      });

      expect(mockSaveNow).toHaveBeenCalledWith('test', minimalFormState);
    });

    it('calls clearDraft when clear draft button is clicked', async () => {
      render(<AutoSaveManager formId="test" formState={minimalFormState} />);

      await act(async () => {
        screen.getByTitle('Clear saved draft').click();
      });

      expect(mockClearDraft).toHaveBeenCalledWith('test');
    });

    it('enables auto-save with the correct interval on mount', () => {
      render(
        <AutoSaveManager
          formId="test"
          formState={minimalFormState}
          interval={10000}
        />,
      );

      expect(mockEnableAutoSave).toHaveBeenCalledWith('test', 10000);
    });

    it('cleans up subscription and destroys manager on unmount', () => {
      const unsubscribe = vi.fn();
      mockOnSaveStatusChange.mockReturnValue({ unsubscribe });

      const { unmount } = render(
        <AutoSaveManager formId="test" formState={minimalFormState} />,
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe('className and custom props', () => {
    it('applies custom className to the wrapper', () => {
      render(
        <AutoSaveManager
          formId="test"
          formState={minimalFormState}
          className="custom-class"
        />,
      );

      const wrapper = screen.getByText('Ready').closest('.auto-save-manager');
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});

describe('AutoSaveIndicator', () => {
  it('renders idle status text', () => {
    render(<AutoSaveIndicator status={{ status: 'idle', queuedSaves: 0 }} />);

    expect(screen.getByText('Auto-save enabled')).toBeInTheDocument();
  });

  it('renders saving status text', () => {
    render(
      <AutoSaveIndicator status={{ status: 'saving', queuedSaves: 0 }} />,
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders saved status text', () => {
    render(<AutoSaveIndicator status={{ status: 'saved', queuedSaves: 0 }} />);

    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  it('renders error status text', () => {
    render(
      <AutoSaveIndicator
        status={{ status: 'error', queuedSaves: 0 }}
      />,
    );

    expect(screen.getByText('Failed to save')).toBeInTheDocument();
  });

  it('renders compact indicator with correct title', () => {
    render(
      <AutoSaveIndicator
        status={{ status: 'saving', queuedSaves: 0 }}
        compact
      />,
    );

    const dot = screen.getByTitle('saving');
    expect(dot).toHaveClass('auto-save-indicator-compact');
    expect(dot).toHaveStyle({ backgroundColor: '#fbbf24' });
  });

  it('applies custom className', () => {
    render(
      <AutoSaveIndicator
        status={{ status: 'idle', queuedSaves: 0 }}
        className="custom-class"
      />,
    );

    const indicator = screen.getByText('Auto-save enabled').closest('div');
    expect(indicator).toHaveClass('custom-class');
  });
});
