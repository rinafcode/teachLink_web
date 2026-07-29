import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaManager } from './MediaManager';
import * as useCMSModule from '@/hooks/useCMS';

// Mock the useCMS hook
vi.mock('@/hooks/useCMS', () => ({
  useCMS: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MediaManager', () => {
  const mockAddToQueue = vi.fn();
  const mockUpdateUploadProgress = vi.fn();
  const mockSetUploadStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock useCMS hook
    vi.mocked(useCMSModule.useCMS).mockReturnValue({
      mediaQueue: [],
      addToQueue: mockAddToQueue,
      updateUploadProgress: mockUpdateUploadProgress,
      setUploadStatus: mockSetUploadStatus,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Declaration order fix (#1)', () => {
    it('should call uploadFiles with correct arguments when files are dropped', () => {
      render(<MediaManager />);

      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      expect(dropzone).toBeDefined();

      // Create mock files
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];

      // Simulate drop event
      fireEvent.drop(dropzone!, {
        dataTransfer: { files },
      });

      // Verify addToQueue was called (which happens inside uploadFiles)
      expect(mockAddToQueue).toHaveBeenCalled();
    });

    it('should handle file input change correctly', () => {
      render(<MediaManager />);

      const fileInput = screen.getByDisplayValue('');
      const files = [new File(['content'], 'test2.txt', { type: 'text/plain' })];

      // Simulate file input change
      fireEvent.change(fileInput, { target: { files } });

      expect(mockAddToQueue).toHaveBeenCalled();
    });

    it('should have uploadFiles defined before handleFileDrop references it', () => {
      // This test verifies the component renders without ReferenceError
      // If uploadFiles was not properly declared before handleFileDrop,
      // this would throw a ReferenceError during component initialization
      expect(() => {
        render(<MediaManager />);
      }).not.toThrow();
    });
  });

  describe('Interval cleanup fix (#2)', () => {
    it('should clear all intervals when component unmounts during ongoing uploads', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = render(<MediaManager />);

      // Simulate file upload
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      fireEvent.drop(dropzone!, {
        dataTransfer: { files },
      });

      // Fast-forward time to let intervals be created
      vi.runAllTimers();

      // Clear the spy call history from the interval completion
      clearIntervalSpy.mockClear();

      // Unmount component
      unmount();

      // Verify clearInterval was called for all pending intervals
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should create individual intervals for each file upload', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      render(<MediaManager />);

      // Simulate uploading 3 files
      const files = [
        new File(['content1'], 'test1.txt', { type: 'text/plain' }),
        new File(['content2'], 'test2.txt', { type: 'text/plain' }),
        new File(['content3'], 'test3.txt', { type: 'text/plain' }),
      ];

      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      fireEvent.drop(dropzone!, {
        dataTransfer: { files },
      });

      // Verify 3 intervals were created (one per file)
      const intervalCalls = setIntervalSpy.mock.calls.length;
      expect(intervalCalls).toBeGreaterThanOrEqual(3);

      vi.restoreAllMocks();
    });

    it('should clear interval when upload completes before unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      clearIntervalSpy.mockClear();

      render(<MediaManager />);

      // Mock updateUploadProgress to simulate progress reaching 100%
      mockUpdateUploadProgress.mockImplementation(() => {
        // This won't trigger the 100% condition, we need to manually advance time
      });

      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      fireEvent.drop(dropzone!, {
        dataTransfer: { files },
      });

      // Move time forward by multiple intervals to trigger completion
      // Each interval is 500ms, so multiple ticks should reach 100%
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(500);
      }

      // Verify clearInterval was called when upload completed
      expect(clearIntervalSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('should not perform state updates after unmount even with scheduled ticks', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      vi.mocked(useCMSModule.useCMS).mockReturnValue({
        mediaQueue: [],
        addToQueue: mockAddToQueue,
        updateUploadProgress: mockUpdateUploadProgress.mockImplementation(() => {
          throw new Error('State update on unmounted component');
        }),
        setUploadStatus: mockSetUploadStatus,
      } as any);

      const { unmount } = render(<MediaManager />);

      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      fireEvent.drop(dropzone!, {
        dataTransfer: { files },
      });

      // Unmount the component
      unmount();

      // Advance timers - should not throw because updates are guarded
      expect(() => {
        vi.advanceTimersByTime(500);
      }).not.toThrow();

      vi.restoreAllMocks();
    });

    it('should handle multiple concurrent file uploads with individual interval tracking', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      clearIntervalSpy.mockClear();

      const { unmount } = render(<MediaManager />);

      // Upload first batch of files
      const files1 = [
        new File(['content1'], 'test1.txt', { type: 'text/plain' }),
        new File(['content2'], 'test2.txt', { type: 'text/plain' }),
      ];
      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      fireEvent.drop(dropzone!, {
        dataTransfer: { files: files1 },
      });

      // Advance time slightly
      vi.advanceTimersByTime(100);

      // Upload another batch while first is in progress
      const files2 = [new File(['content3'], 'test3.txt', { type: 'text/plain' })];
      fireEvent.drop(dropzone!, {
        dataTransfer: { files: files2 },
      });

      clearIntervalSpy.mockClear();

      // Unmount - should clear all intervals
      unmount();

      // Verify clearInterval was called multiple times for all concurrent uploads
      expect(clearIntervalSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('Integration tests', () => {
    it('should render media manager with dropzone', () => {
      render(<MediaManager />);

      expect(screen.getByText('Media Manager')).toBeDefined();
      expect(screen.getByText('Click or drag to upload media')).toBeDefined();
      expect(screen.getByText('Recent Uploads')).toBeDefined();
    });

    it('should display upload count in header', () => {
      vi.mocked(useCMSModule.useCMS).mockReturnValue({
        mediaQueue: [
          {
            id: '1',
            fileName: 'test.txt',
            fileSize: 1000,
            progress: 50,
            status: 'uploading',
          },
        ],
        addToQueue: mockAddToQueue,
        updateUploadProgress: mockUpdateUploadProgress,
        setUploadStatus: mockSetUploadStatus,
      } as any);

      render(<MediaManager />);

      expect(screen.getByText('1 uploads in progress')).toBeDefined();
    });

    it('should prevent default drag behavior', () => {
      render(<MediaManager />);

      const dropzone = screen.getByText('Click or drag to upload media').closest('div');
      const event = new DragEvent('dragover', {
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      fireEvent.dragOver(dropzone!, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
