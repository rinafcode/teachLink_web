'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { ApiResponse, LearningProgressItem } from '@/types/api';

export interface UseLearningProgressReturn {
  items: LearningProgressItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLearningProgress(): UseLearningProgressReturn {
  const [items, setItems] = useState<LearningProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
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

  return { items, isLoading, error, refetch: load };
}
