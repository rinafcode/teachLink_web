'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FeatureFlag } from '@/lib/feature-flags';

interface FlagState {
  flag: FeatureFlag | null;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * useFeatureFlag — evaluates a single flag server-side for the given user context.
 *
 * @param flagId  The flag's id (e.g. "flag_new_dashboard")
 * @param context Flat key→value attributes for targeting (userId, plan, …)
 *
 * @example
 * const { isEnabled } = useFeatureFlag('flag_new_dashboard', { userId: user.id });
 * if (isEnabled) return <NewDashboard />;
 */
export function useFeatureFlag(
  flagId: string,
  context: Record<string, string> = {},
): FlagState {
  const [state, setState] = useState<FlagState>({
    flag: null,
    isEnabled: false,
    isLoading: true,
    error: null,
  });

  const contextKey = JSON.stringify(context);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ id: flagId, ...context });
      const res = await fetch(`/api/admin/feature-flags/evaluate?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { flag: FeatureFlag; isEnabled: boolean };
      setState({ flag: data.flag, isEnabled: data.isEnabled, isLoading: false, error: null });
    } catch (err) {
      setState({ flag: null, isEnabled: false, isLoading: false, error: String(err) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagId, contextKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return state;
}

/**
 * useAllFeatureFlags — fetches the full flag list (for admin UI use).
 */
export function useAllFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { flags: FeatureFlag[] };
      setFlags(data.flags);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { flags, isLoading, error, reload };
}
