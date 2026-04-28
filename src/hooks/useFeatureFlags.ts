import { useFeatureFlag } from '@/components/shared/FeatureFlagProvider';
import type { FeatureFlag } from '@/lib/featureFlags';

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(flags: FeatureFlag[]) {
  const results: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;

  flags.forEach((flag) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[flag] = useFeatureFlag(flag);
  });

  return results;
}

/**
 * Hook to conditionally render components based on feature flags
 */
export function useConditionalFeature(flag: FeatureFlag, component: React.ReactNode) {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? component : null;
}
