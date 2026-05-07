export const FLAGS = {
  TIPPING: 'NEXT_PUBLIC_FEATURE_TIPPING',
  OFFLINE_MODE: 'NEXT_PUBLIC_FEATURE_OFFLINE_MODE',
  PERFORMANCE_ANALYTICS: 'NEXT_PUBLIC_FEATURE_PERFORMANCE_ANALYTICS',
  DAO_GOVERNANCE: 'NEXT_PUBLIC_FEATURE_DAO_GOVERNANCE',
  COLLABORATIVE_EDITING: 'NEXT_PUBLIC_FEATURE_COLLABORATIVE_EDITING',
} as const;

export type FeatureFlag = keyof typeof FLAGS;

/** Returns true if the flag is enabled via env var (defaults to true if unset). */
export function isEnabled(flag: FeatureFlag): boolean {
  const value = process.env[FLAGS[flag]];
  return value === undefined || value === 'true';
}

/** Returns a snapshot of all flags and their current state. */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  return (Object.keys(FLAGS) as FeatureFlag[]).reduce(
    (acc, key) => ({ ...acc, [key]: isEnabled(key) }),
    {} as Record<FeatureFlag, boolean>,
  );
}
