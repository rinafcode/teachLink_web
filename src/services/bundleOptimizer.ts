/**
 * Service for bundle analysis and dynamic loading optimization.
 */

export interface BundleChunk {
  id: string;
  name: string;
  size?: number;
  priority: 'high' | 'medium' | 'low';
}

class BundleOptimizer {
  private chunks: Map<string, BundleChunk> = new Map();

  /**
   * Registers a chunk for monitoring.
   */
  registerChunk(chunk: BundleChunk) {
    this.chunks.set(chunk.id, chunk);
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
  analyzeChunkSizes(threshold: number = 200) { // threshold in KB
    const heavyChunks = Array.from(this.chunks.values()).filter(
      (chunk) => chunk.size && chunk.size > threshold
    );

    if (heavyChunks.length > 0) {
      console.warn(`[Bundle Analysis] Found ${heavyChunks.length} heavy chunks (> ${threshold}KB). Consider further code splitting.`);
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
    const totalChunks = this.chunks.size;
    const totalSize = Array.from(this.chunks.values()).reduce((acc, c) => acc + (c.size || 0), 0);
    
    console.log(`[Bundle Optimizer] Monitoring ${totalChunks} logical chunks. Total estimated size: ${totalSize}KB.`);
    this.analyzeChunkSizes();
  }
}

export const bundleOptimizer = new BundleOptimizer();
