import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useAbortController } from '@/hooks/useAbortController';
import type { RequestConfig } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface UseApiResourceOptions<T> extends Omit<RequestConfig, 'url' | 'method' | 'body'> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /**
   * If true, the request will not be automatically fetched on mount/dependency change.
   */
  manual?: boolean;
}

export function useApiResource<T>(url: string, options: UseApiResourceOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options.manual);
  const [error, setError] = useState<Error | null>(null);

  const { getSignal } = useAbortController();
  
  // Ref to prevent stale closures and infinite loops if options are passed inline
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const fetchResource = useCallback(async (overrideOptions?: Partial<UseApiResourceOptions<T>>) => {
    const currentOptions = { ...optionsRef.current, ...overrideOptions };
    const method = currentOptions.method || 'GET';
    const signal = getSignal();

    setLoading(true);
    setError(null);

    try {
      const { body, manual, ...restOptions } = currentOptions;
      const requestOptions = { ...restOptions, signal } as Omit<RequestConfig, 'url' | 'method'>;
      
      let response: ApiResponse<T>;
      if (method === 'GET') {
        response = await apiClient.get<ApiResponse<T>>(url, requestOptions);
      } else if (method === 'POST') {
        response = await apiClient.post<ApiResponse<T>>(url, body, requestOptions);
      } else if (method === 'PUT') {
        response = await apiClient.put<ApiResponse<T>>(url, body, requestOptions);
      } else if (method === 'PATCH') {
        response = await apiClient.patch<ApiResponse<T>>(url, body, requestOptions);
      } else if (method === 'DELETE') {
        response = await apiClient.delete<ApiResponse<T>>(url, requestOptions);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      // Unwrap the canonical ApiResponse envelope
      if (!signal.aborted) {
        // If the backend returned a wrapped ApiResponse, unwrap it.
        // Some mock/legacy endpoints might return the data directly, we handle that gracefully.
        const payload = (response && typeof response === 'object' && 'data' in response) 
          ? response.data 
          : (response as unknown as T);
        
        setData(payload);
        setLoading(false);
        return payload;
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return; // Ignore abort errors
      }
      if (!signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
      throw err;
    }
  }, [url, getSignal]);

  useEffect(() => {
    if (!options.manual) {
      fetchResource();
    }
  }, [fetchResource, options.manual]);

  return { data, setData, loading, error, refetch: fetchResource };
}
