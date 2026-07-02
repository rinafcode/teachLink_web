import { describe, it, expect, beforeEach } from 'vitest';
import {
  BundleSecurityContext,
  bundleSecurityContext,
  type ChunkSecurityPolicy,
} from '../bundleSecurityContext';
import type { BundleChunk } from '../bundleOptimizer';

const makeChunk = (over: Partial<BundleChunk> = {}): BundleChunk => ({
  id: 'default-id',
  name: 'default-chunk',
  size: 100,
  priority: 'medium',
  ...over,
});

describe('BundleSecurityContext (#409)', () => {
  let ctx: BundleSecurityContext;

  beforeEach(() => {
    ctx = new BundleSecurityContext();
  });

  describe('default policy', () => {
    it('requires SRI by default', () => {
      const violations = ctx.audit(makeChunk({ id: 'a', name: 'a' }));
      expect(violations).toContain('Chunk "a" is missing SRI integrity attribute.');
    });

    it('is satisfied when an integrity hash is supplied', () => {
      ctx.attachMetadata('a', {
        integrity: 'sha384-abc',
        trustLevel: 'verified',
      });
      expect(ctx.audit(makeChunk({ id: 'a', name: 'a' }))).toEqual([]);
    });
  });

  describe('per-chunk override', () => {
    it('uses per-chunk policy over default', () => {
      ctx.setPolicyFor('trusted', {
        trustLevel: 'trusted',
        requiredIntegrity: false,
      });
      ctx.attachMetadata('trusted', { trustLevel: 'trusted' });
      // Lax on integrity, trust level matches policy
      const v = ctx.audit(makeChunk({ id: 'trusted', name: 'trusted' }));
      expect(v).toEqual([]);
      // Default still requires integrity for other chunks
      expect(ctx.audit(makeChunk({ id: 'other', name: 'other' })).length).toBeGreaterThan(0);
    });

    it('falls back to untrusted when no metadata is attached', () => {
      // Secure-by-default: a chunk with no metadata is treated as untrusted
      const v = ctx.audit(makeChunk({ id: 'a', name: 'a' }));
      expect(v.some((s) => s.includes('trust level'))).toBe(true);
    });

    it('detachMetadata clears the chunk security state', () => {
      ctx.attachMetadata('a', { trustLevel: 'verified' });
      ctx.detachMetadata('a');
      expect(ctx.getMetadata('a')).toBeUndefined();
      // After detach, chunk falls back to untrusted
      const v = ctx.audit(makeChunk({ id: 'a', name: 'a' }));
      expect(v.some((s) => s.includes('trust level'))).toBe(true);
    });

    it('attachMetadata overwrites prior metadata for the same id', () => {
      ctx.attachMetadata('a', { trustLevel: 'verified', origin: 'https://x.example.com/a.js' });
      ctx.attachMetadata('a', { trustLevel: 'trusted' });
      const m = ctx.getMetadata('a')!;
      expect(m.trustLevel).toBe('trusted');
      expect(m.origin).toBeUndefined();
    });
  });

  describe('origin allow-list', () => {
    it('reports unknown origins', () => {
      ctx.setDefaultPolicy({
        trustLevel: 'verified',
        requiredIntegrity: false,
        allowedOrigins: [/^https:\/\/cdn\.example\.com\//],
      });
      ctx.attachMetadata('a', { trustLevel: 'verified' });
      const v = ctx.audit(makeChunk({ id: 'a', name: 'a' }));
      expect(v).toContain('Chunk "a" has no declared origin.');
    });

    it('passes when origin matches', () => {
      ctx.setDefaultPolicy({
        trustLevel: 'verified',
        requiredIntegrity: false,
        allowedOrigins: [/^https:\/\/cdn\.example\.com\//],
      });
      ctx.attachMetadata('a', {
        trustLevel: 'verified',
        origin: 'https://cdn.example.com/lib.js',
      });
      expect(ctx.audit(makeChunk({ id: 'a', name: 'a' }))).toEqual([]);
    });
  });

  describe('size limit', () => {
    it('flags oversized chunks', () => {
      ctx.setDefaultPolicy({ trustLevel: 'verified', requiredIntegrity: false });
      ctx.attachMetadata('a', { trustLevel: 'verified' });
      const v = ctx.audit(makeChunk({ id: 'a', name: 'a', size: 600 }));
      expect(v[0]).toMatch(/exceeds maximum 500KB/);
    });
  });

  describe('trust level', () => {
    it('flags chunk trust below required', () => {
      ctx.setDefaultPolicy({
        trustLevel: 'trusted',
        requiredIntegrity: false,
      });
      ctx.attachMetadata('a', { trustLevel: 'untrusted' });
      const v = ctx.audit(makeChunk({ id: 'a', name: 'a', size: 10 }));
      expect(v).toContain(
        'Chunk "a" declared trust level "untrusted" is below required "trusted".',
      );
    });
  });

  describe('auditBatch', () => {
    it('returns only chunks with violations', () => {
      ctx.setDefaultPolicy({ trustLevel: 'verified', requiredIntegrity: false });
      ctx.attachMetadata('good', { trustLevel: 'verified' });
      const audit = ctx.auditBatch([
        makeChunk({ id: 'good', name: 'good', size: 50 }),
        makeChunk({ id: 'bad', name: 'bad', size: 9999 }),
      ]);
      expect(audit.has('good')).toBe(false);
      expect(audit.has('bad')).toBe(true);
    });
  });

  describe('singleton', () => {
    it('exports a shared instance', () => {
      expect(bundleSecurityContext).toBeInstanceOf(BundleSecurityContext);
    });
  });

  describe('policy immutability', () => {
    it('getPolicyFor returns a defensive copy', () => {
      const p: ChunkSecurityPolicy = { trustLevel: 'verified', requiredIntegrity: false };
      ctx.setPolicyFor('a', p);
      const fetched = ctx.getPolicyFor('a')!;
      fetched.requiredIntegrity = true;
      expect(ctx.getPolicyFor('a')!.requiredIntegrity).toBe(false);
    });

    it('getEffectivePolicy returns a defensive copy', () => {
      const fetched = ctx.getEffectivePolicy('a');
      fetched.requiredIntegrity = false;
      expect(ctx.getEffectivePolicy('a').requiredIntegrity).toBe(true);
    });
  });
});
