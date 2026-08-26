'use client';

import { useState, useCallback, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ABTestVariant {
  /** Unique identifier for this variant */
  id: string;
  /** Human-readable label */
  label: string;
  /** Traffic weight (relative, not percentage). E.g. [50, 50] for a 50/50 split. */
  weight: number;
}

export interface ABTestConfig {
  /** Unique experiment identifier (used as storage key) */
  experimentId: string;
  /** Available variants (must include at least one) */
  variants: ABTestVariant[];
}

export interface ABTestResult {
  /** The variant assigned to the current user */
  variant: ABTestVariant;
  /** All available variants */
  variants: ABTestVariant[];
  /** Whether the variant was resolved (not from default fallback) */
  isResolved: boolean;
  /** Call this when the variant is rendered to track exposure */
  trackExposure: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

function getBucket(experimentId: string, userId: string): number {
  const hash = djb2Hash(`${experimentId}:${userId}`);
  return hash % 10000; // 0-9999 for sub-percent precision
}

function resolveVariant(
  config: ABTestConfig,
  bucket: number,
): ABTestVariant {
  const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) return config.variants[0];

  const bucketScaled = (bucket / 10000) * totalWeight;
  let cumulative = 0;

  for (const variant of config.variants) {
    cumulative += variant.weight;
    if (bucketScaled < cumulative) return variant;
  }

  return config.variants[config.variants.length - 1];
}

const STORAGE_PREFIX = 'ab_test_';
const EXPOSURE_SUFFIX = '_exposed';

function getStoredAssignment(experimentId: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${experimentId}`);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
  } catch {
    // localStorage unavailable (SSR, privacy settings, etc.)
  }
  return null;
}

function storeAssignment(experimentId: string, bucket: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${experimentId}`, String(bucket));
  } catch {
    // localStorage unavailable
  }
}

function trackExposureEvent(experimentId: string, variantId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${experimentId}${EXPOSURE_SUFFIX}`;
    const existing = localStorage.getItem(key);
    if (existing) return; // already exposed

    localStorage.setItem(key, JSON.stringify({
      variantId,
      exposedAt: new Date().toISOString(),
    }));

    // Dispatch a custom event for analytics consumers
    window.dispatchEvent(
      new CustomEvent('ab-test:exposure', {
        detail: { experimentId, variantId },
      }),
    );
  } catch {
    // localStorage unavailable
  }
}

function getStableUserId(): string {
  if (typeof window === 'undefined') return 'server';

  try {
    const ANON_KEY = 'ab_test_anon_id';
    let anonId = localStorage.getItem(ANON_KEY);
    if (anonId) return anonId;

    // Generate a stable anonymous ID
    anonId = `anon_${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36)}${Date.now().toString(36)}`;
    localStorage.setItem(ANON_KEY, anonId);
    return anonId;
  } catch {
    return 'anonymous';
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useABTest — deterministic client-side A/B testing hook.
 *
 * Assigns users to variants based on a stable hash so the same user
 * always sees the same variant (within the same experiment).
 *
 * @example
 * ```tsx
 * const { variant, trackExposure } = useABTest({
 *   experimentId: 'breadcrumbs_layout',
 *   variants: [
 *     { id: 'control', label: 'Standard', weight: 50 },
 *     { id: 'compact', label: 'Compact', weight: 50 },
 *   ],
 * });
 *
 * // Use variant.id to render different layouts
 * if (variant.id === 'compact') return <CompactBreadcrumbs ... />;
 * return <Breadcrumbs ... />;
 * ```
 */
export function useABTest(config: ABTestConfig): ABTestResult {
  const { experimentId, variants } = config;

  // Validate: must have at least one variant
  if (variants.length === 0) {
    throw new Error(`useABTest: experiment "${experimentId}" must have at least one variant`);
  }

  const userId = useMemo(() => getStableUserId(), []);

  const [assignedBucket] = useState<number>(() => {
    // First check for an existing assignment (stable across re-renders)
    const existing = getStoredAssignment(experimentId);
    if (existing !== null) return existing;

    // Otherwise compute a new assignment
    const bucket = getBucket(experimentId, userId);
    storeAssignment(experimentId, bucket);
    return bucket;
  });

  const variant = useMemo(
    () => resolveVariant(config, assignedBucket),
    [config, assignedBucket],
  );

  const trackExposure = useCallback(() => {
    trackExposureEvent(experimentId, variant.id);
  }, [experimentId, variant.id]);

  return {
    variant,
    variants,
    isResolved: true,
    trackExposure,
  };
}
