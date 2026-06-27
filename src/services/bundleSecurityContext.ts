/**
 * Bundle Security Context (#409)
 *
 * Provides per-chunk security policies for the bundle optimizer:
 *   - Subresource Integrity (SRI) enforcement
 *   - Origin allow-listing (regex)
 *   - Maximum chunk size
 *   - Trust-level tagging
 *
 * The context is fully decoupled from the bundle registry so it can be
 * unit-tested in isolation and consumed by any bundle-loading pipeline.
 */

import type { BundleChunk } from './bundleOptimizer';

/** Trust level required to load a chunk. */
export type TrustLevel = 'trusted' | 'verified' | 'untrusted';

/** Per-chunk security policy applied during audit. */
export interface ChunkSecurityPolicy {
  /** Regex patterns; if set, chunk.origin must match at least one. */
  allowedOrigins?: RegExp[];
  /** When true, chunk must declare an SRI `integrity` hash. */
  requiredIntegrity?: boolean;
  /** Maximum size in KB the chunk is allowed to occupy. */
  maxSize?: number;
  /** Minimum trust level the chunk must declare. */
  trustLevel: TrustLevel;
}

/** Security metadata attached to a registered chunk. */
export interface ChunkSecurityMetadata {
  origin?: string;
  integrity?: string;
  trustLevel: TrustLevel;
}

const DEFAULT_POLICY: ChunkSecurityPolicy = {
  requiredIntegrity: true,
  maxSize: 500, // KB
  trustLevel: 'verified',
};

/**
 * Ranks trust levels so we can compare "at least" requirements.
 * Lower number = higher privilege.
 */
const TRUST_RANK: Record<TrustLevel, number> = {
  trusted: 0,
  verified: 1,
  untrusted: 2,
};

/**
 * Holds the effective security policy for every registered chunk and
 * exposes an `audit()` helper used by the bundle optimizer's health report.
 */
export class BundleSecurityContext {
  private policies: Map<string, ChunkSecurityPolicy> = new Map();
  private metadata: Map<string, ChunkSecurityMetadata> = new Map();
  private defaultPolicy: ChunkSecurityPolicy = { ...DEFAULT_POLICY };

  setDefaultPolicy(policy: Partial<ChunkSecurityPolicy>): void {
    this.defaultPolicy = { ...DEFAULT_POLICY, ...policy };
  }

  getDefaultPolicy(): ChunkSecurityPolicy {
    return { ...this.defaultPolicy };
  }

  setPolicyFor(chunkId: string, policy: ChunkSecurityPolicy): void {
    this.policies.set(chunkId, policy);
  }

  getPolicyFor(chunkId: string): ChunkSecurityPolicy | undefined {
    const p = this.policies.get(chunkId);
    return p ? { ...p } : undefined;
  }

  attachMetadata(chunkId: string, metadata: ChunkSecurityMetadata): void {
    this.metadata.set(chunkId, metadata);
  }

  /** Removes metadata for a chunk (called when a chunk is unregistered). */
  detachMetadata(chunkId: string): void {
    this.metadata.delete(chunkId);
  }

  getMetadata(chunkId: string): ChunkSecurityMetadata | undefined {
    const m = this.metadata.get(chunkId);
    return m ? { ...m } : undefined;
  }

  /**
   * Resolves the effective policy for a chunk (per-chunk override or default).
   * Default fields act as a fallback; per-chunk fields take precedence.
   */
  getEffectivePolicy(chunkId: string): ChunkSecurityPolicy {
    const per = this.policies.get(chunkId);
    return per ? { ...this.defaultPolicy, ...per } : { ...this.defaultPolicy };
  }

  /**
   * Audits a single chunk against its effective policy.
   * Returns a list of human-readable violations (empty = compliant).
   */
  audit(chunk: BundleChunk): string[] {
    const policy = this.getEffectivePolicy(chunk.id);
    const meta = this.metadata.get(chunk.id) ?? { trustLevel: 'untrusted' as const };
    const violations: string[] = [];

    if (policy.requiredIntegrity) {
      const integrity = meta.integrity?.trim() ?? '';
      if (integrity.length === 0) {
        violations.push(`Chunk "${chunk.name}" is missing SRI integrity attribute.`);
      }
    }

    if (policy.allowedOrigins && policy.allowedOrigins.length > 0) {
      const origin = meta.origin?.trim() ?? '';
      if (origin.length === 0) {
        violations.push(`Chunk "${chunk.name}" has no declared origin.`);
      } else if (!policy.allowedOrigins.some((re) => re.test(origin))) {
        violations.push(`Chunk "${chunk.name}" origin "${origin}" is not in the allow-list.`);
      }
    }

    if (typeof policy.maxSize === 'number' && typeof chunk.size === 'number') {
      if (chunk.size > policy.maxSize) {
        violations.push(
          `Chunk "${chunk.name}" size ${chunk.size}KB exceeds maximum ${policy.maxSize}KB.`,
        );
      }
    }

    if (TRUST_RANK[meta.trustLevel] > TRUST_RANK[policy.trustLevel]) {
      violations.push(
        `Chunk "${chunk.name}" declared trust level "${meta.trustLevel}" is below required "${policy.trustLevel}".`,
      );
    }

    return violations;
  }

  /**
   * Audits every provided chunk. Returns the chunks that have at least one
   * violation, indexed by chunk id along with their violation messages.
   */
  auditBatch(chunks: BundleChunk[]): Map<string, string[]> {
    const results = new Map<string, string[]>();
    for (const chunk of chunks) {
      const v = this.audit(chunk);
      if (v.length > 0) results.set(chunk.id, v);
    }
    return results;
  }
}

/** Shared singleton used by the bundle optimizer and webpack hooks. */
export const bundleSecurityContext = new BundleSecurityContext();
