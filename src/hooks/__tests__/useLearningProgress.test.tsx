// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useLearningProgress } from '../useLearningProgress';
import type { UseLearningProgressReturn } from '../useLearningProgress';
import { apiClient } from '@/lib/api';
import { offlineApi } from '@/services/offlineApi';

vi.mock('@/services/offlineApi', () => ({
  offlineApi: {
    updateLearningProgress: vi.fn(),
  },
}));
import type { ApiResponse, LearningProgressItem } from '@/types/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockItems: LearningProgressItem[] = [
  {
    courseId: '1',
    title: 'Web3 UX Design Principles',
    progress: 68,
    timeRemaining: '12h',
    totalLessons: 12,
    category: 'Design',
  },
  {
    courseId: '2',
    title: 'Smart Contract Security Best Practices',
    progress: 45,
    timeRemaining: '18h',
    totalLessons: 18,
    category: 'Security',
  },
];

const mockResponse: ApiResponse<LearningProgressItem[]> = {
  success: true,
  data: mockItems,
};

const TestHarness: React.FC<{ onReady: (api: UseLearningProgressReturn) => void }> = ({
  onReady,
}) => {
  const api = useLearningProgress();
  useEffect(() => {
    onReady(api);
  });
  return null;
};

describe('useLearningProgress', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('fetches learning progress items on mount', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    let api: UseLearningProgressReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/user/learning-progress');
    expect(api!.items).toEqual(mockItems);
    expect(api!.isLoading).toBe(false);
    expect(api!.error).toBeNull();
  });

  it('returns empty items and clears loading when no data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: [] });

    let api: UseLearningProgressReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });

    expect(api!.items).toEqual([]);
    expect(api!.isLoading).toBe(false);
    expect(api!.error).toBeNull();
  });

  it('surfaces the error when the request fails', async () => {
    const networkError = new Error('Network error');
    vi.mocked(apiClient.get).mockRejectedValue(networkError);

    let api: UseLearningProgressReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });

    expect(api!.items).toEqual([]);
    expect(api!.isLoading).toBe(false);
    expect(api!.error).toBe(networkError);
  });

  it('updates progress optimistically and reconciles the server response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);
    vi.mocked(offlineApi.updateLearningProgress).mockResolvedValue({
      success: true,
      data: {
        courseId: '1',
        moduleId: '1',
        progress: 72,
        completed: false,
        updatedAt: new Date().toISOString(),
      },
    });

    let api: UseLearningProgressReturn | undefined;
    await act(async () => {
      root.render(<TestHarness onReady={(a) => (api = a)} />);
    });

    await act(async () => {
      await api!.updateProgress('1', 70);
    });

    expect(offlineApi.updateLearningProgress).toHaveBeenCalledWith({
      courseId: '1',
      moduleId: '1',
      progress: 70,
      completed: false,
    });
    expect(api!.items[0].progress).toBe(72);
  });

  it('rolls back the optimistic update when saving fails', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);
    const error = new Error('Save failed');
    vi.mocked(offlineApi.updateLearningProgress).mockRejectedValue(error);

    let api: UseLearningProgressReturn | undefined;
    await act(async () => {
      root.render(<TestHarness onReady={(a) => (api = a)} />);
    });

    await expect(api!.updateProgress('1', 90)).rejects.toThrow('Save failed');
    await act(async () => {});

    expect(api!.items[0].progress).toBe(68);
    expect(api!.error).toBe(error);
  });

  it('refetches items when refetch is called', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);
    const updatedResponse: ApiResponse<LearningProgressItem[]> = {
      success: true,
      data: [mockItems[0]],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce(updatedResponse);

    let api: UseLearningProgressReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });

    await act(async () => {
      await api!.refetch();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(api!.items).toEqual([mockItems[0]]);
  });
});
