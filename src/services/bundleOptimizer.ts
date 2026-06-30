/**
 * Service for bundle analysis and dynamic loading optimization.
 *
 * Includes a Security Context integration that enforces integrity,
 * origin allow-listing, size limits and trust levels per chunk
 * (see #409: Bundle Optimization: Security Context).
 */

import { bundleSecurityContext, type ChunkSecurityMetadata } from './bundleSecurityContext';

export interface BundleChunk {
  id: string;
  name: string;
  size?: number;
  priority: 'high' | 'medium' | 'low';
}

/** Optional security metadata that can be supplied when registering a chunk. */
export interface BundleChunkRegistration extends BundleChunk {
  security?: ChunkSecurityMetadata;
}

class BundleOptimizer {
  private chunks: Map<string, BundleChunk> = new Map();

  /**
   * Registers a chunk for monitoring. Optional security metadata is forwarded
   * to the shared BundleSecurityContext so the chunk participates in audits.
   */
  registerChunk(chunk: BundleChunk | BundleChunkRegistration) {
    this.chunks.set(chunk.id, chunk);
    const registration = chunk as BundleChunkRegistration;
    if (registration.security) {
      bundleSecurityContext.attachMetadata(chunk.id, registration.security);
    }
  }

  /** Detaches and forgets a chunk. Also clears its security metadata. */
  unregisterChunk(chunkId: string) {
    this.chunks.delete(chunkId);
    bundleSecurityContext.detachMetadata(chunkId);
  }

  /**
   * Recommends a loading strategy based on chunk priority and network conditions.
   */
  getLoadingStrategy(chunkId: string, isSlow: boolean) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return 'default';

    if (isSlow) {
      return chunk.priority === 'high' ? 'eager' : 'lazy';
    }

    return chunk.priority === 'low' ? 'lazy' : 'eager';
  }

  /**
   * Identifies large chunks that might need further code splitting.
   */
  analyzeChunkSizes(threshold: number = 200) {
    // threshold in KB
    const heavyChunks = Array.from(this.chunks.values()).filter(
      (chunk) => chunk.size && chunk.size > threshold,
    );

    if (heavyChunks.length > 0) {
      console.warn(
        `[Bundle Analysis] Found ${heavyChunks.length} heavy chunks (> ${threshold}KB). Consider further code splitting.`,
      );
      heavyChunks.forEach((chunk) => {
        console.warn(` - Chunk: ${chunk.name} (${chunk.size}KB)`);
      });
    }

    return heavyChunks;
  }

  /**
   * Performs basic bundle size reporting.
   */
  reportBundleHealth() {
    const _totalChunks = this.chunks.size;
    const _totalSize = Array.from(this.chunks.values()).reduce((acc, c) => acc + (c.size || 0), 0);

    this.analyzeChunkSizes();
  }
}

export const bundleOptimizer = new BundleOptimizer();
