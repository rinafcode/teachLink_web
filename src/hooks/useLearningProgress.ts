'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { offlineApi } from '@/services/offlineApi';
import type { ApiResponse, LearningProgressItem } from '@/types/api';

export interface UseLearningProgressReturn {
  items: LearningProgressItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateProgress: (courseId: string, progress: number) => Promise<void>;
}

export function useLearningProgress(): UseLearningProgressReturn {
  const [items, setItems] = useState<LearningProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const itemsRef = useRef(items);
  const updateSequenceRef = useRef(new Map<string, number>());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateProgress = useCallback(async (courseId: string, progress: number) => {
    const previousItems = itemsRef.current;
    const optimisticItems = previousItems.map((item) =>
      item.courseId === courseId ? { ...item, progress } : item,
    );
    const requestId = (updateSequenceRef.current.get(courseId) ?? 0) + 1;
    updateSequenceRef.current.set(courseId, requestId);

    itemsRef.current = optimisticItems;
    setItems(optimisticItems);
    setError(null);

    try {
      const response = await offlineApi.updateLearningProgress({
        courseId,
        moduleId: courseId,
        progress,
        completed: progress >= 100,
      });
      if (!mountedRef.current || updateSequenceRef.current.get(courseId) !== requestId) return;
      if (!response.success) {
        throw new Error(response.message || 'Progress update failed');
      }

      const reconciledProgress = response.data.progress;
      const reconciledItems = itemsRef.current.map((item) =>
        item.courseId === courseId ? { ...item, progress: reconciledProgress } : item,
      );
      itemsRef.current = reconciledItems;
      setItems(reconciledItems);
    } catch (err) {
      if (!mountedRef.current || updateSequenceRef.current.get(courseId) !== requestId) return;

      itemsRef.current = previousItems;
      setItems(previousItems);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  const load = useCallback(async () => {
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await apiClient.get<ApiResponse<LearningProgressItem[]>>(
        '/api/user/learning-progress',
      );
      if (mountedRef.current) {
        itemsRef.current = response.data;
        setItems(response.data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, error, refetch: load, updateProgress };
}
