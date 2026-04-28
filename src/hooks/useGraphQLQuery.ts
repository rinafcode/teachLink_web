import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraphQLClient } from '@/lib/graphql';
import type { GraphQLMonitoringReport, GraphQLQueryConfig } from '@/lib/graphql';

interface UseGraphQLQueryOptions {
  endpoint: string;
  enabled?: boolean;
  usePersistedQuery?: boolean;
  maxComplexity?: number;
}

interface UseGraphQLQueryState<TData> {
  data: TData | null;
  error: string | null;
  isLoading: boolean;
  metrics: GraphQLMonitoringReport | null;
  refetch: () => Promise<void>;
}

export function useGraphQLQuery<TData>(
  config: GraphQLQueryConfig,
  options: UseGraphQLQueryOptions,
): UseGraphQLQueryState<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<GraphQLMonitoringReport | null>(null);
  const client = useMemo(() => new GraphQLClient(options.endpoint), [options.endpoint]);

  const enabled = options.enabled ?? true;

  const run = useCallback(async () => {
    if (!enabled) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const nextData = await client.execute<TData>(config, {
        usePersistedQuery: options.usePersistedQuery ?? true,
        maxComplexity: options.maxComplexity,
        signal: controller.signal,
        monitor: (report) => setMetrics(report),
      });
      setData(nextData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown GraphQL error';
      setError(message);
    } finally {
      controller.abort();
      setIsLoading(false);
    }
  }, [client, config, enabled, options.maxComplexity, options.usePersistedQuery]);

  useEffect(() => {
    void run();
  }, [run]);

  return {
    data,
    error,
    isLoading,
    metrics,
    refetch: run,
  };
}
