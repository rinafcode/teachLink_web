import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULT_RESOLUTION_POLICY,
  createResolutionPolicy,
  getMergeStrategy,
  registerMergeStrategy,
  resetMergeStrategies,
  resolveByEntityType,
  resolveConflictForEntity,
  unregisterMergeStrategy,
  strategyForEntity,
  withEntityStrategy,
} from '../resolver';
import type { ProgressData } from '../types';

const progress = (overrides: Partial<ProgressData> = {}): ProgressData => ({
  progress: 10,
  completed: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  ...overrides,
});

afterEach(() => {
  resetMergeStrategies();
});

describe('strategyForEntity', () => {
  it('falls back to the policy default for an unlisted entity type', () => {
    expect(strategyForEntity('assessment_submission')).toBe(DEFAULT_RESOLUTION_POLICY.default);
  });

  it('uses the override when the entity type is listed', () => {
    const policy = createResolutionPolicy({
      byEntityType: { assessment_submission: 'manual' },
    });

    expect(strategyForEntity('assessment_submission', policy)).toBe('manual');
  });

  it('leaves unlisted types on the default when overrides exist', () => {
    const policy = createResolutionPolicy({
      byEntityType: { assessment_submission: 'manual' },
    });

    expect(strategyForEntity('course_progress', policy)).toBe('merge');
  });

  it('falls back to the default for a missing entity type', () => {
    expect(strategyForEntity(undefined)).toBe('merge');
  });

  it('honours a custom default', () => {
    const policy = createResolutionPolicy({ default: 'remote' });

    expect(strategyForEntity('anything', policy)).toBe('remote');
  });

  // course_progress is listed explicitly so that changing the default cannot
  // silently change how progress is resolved.
  it('keeps course_progress merging even when the default changes', () => {
    const policy = createResolutionPolicy({ default: 'local' });

    expect(strategyForEntity('course_progress', policy)).toBe('merge');
    expect(strategyForEntity('other', policy)).toBe('local');
  });
});

describe('createResolutionPolicy', () => {
  it('keeps the shipped defaults for anything not overridden', () => {
    const policy = createResolutionPolicy({ byEntityType: { note: 'local' } });

    expect(policy.default).toBe('merge');
    expect(policy.byEntityType.course_progress).toBe('merge');
    expect(policy.byEntityType.note).toBe('local');
  });

  it('allows an entity override to replace a shipped one', () => {
    const policy = createResolutionPolicy({ byEntityType: { course_progress: 'local' } });

    expect(strategyForEntity('course_progress', policy)).toBe('local');
  });

  // A policy mutated after the fact would make resolution depend on call order.
  it('returns a frozen policy', () => {
    const policy = createResolutionPolicy();

    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.byEntityType)).toBe(true);
  });

  it('does not modify the shipped default policy', () => {
    createResolutionPolicy({ default: 'local', byEntityType: { note: 'remote' } });

    expect(DEFAULT_RESOLUTION_POLICY.default).toBe('merge');
    expect(DEFAULT_RESOLUTION_POLICY.byEntityType).not.toHaveProperty('note');
  });
});

describe('withEntityStrategy', () => {
  it('adds an override without touching the original policy', () => {
    const base = createResolutionPolicy();
    const extended = withEntityStrategy(base, 'note', 'local');

    expect(strategyForEntity('note', extended)).toBe('local');
    expect(strategyForEntity('note', base)).toBe('merge');
  });

  it('replaces an existing override', () => {
    const policy = withEntityStrategy(
      createResolutionPolicy({ byEntityType: { note: 'local' } }),
      'note',
      'remote',
    );

    expect(strategyForEntity('note', policy)).toBe('remote');
  });
});

describe('resolveConflictForEntity', () => {
  it('merges progress deterministically under the default policy', () => {
    const local = progress({ progress: 40 });
    const remote = progress({ progress: 70, completed: true });

    const merged = resolveConflictForEntity('course_progress', local, remote);

    expect(merged.progress).toBe(70);
    expect(merged.completed).toBe(true);
  });

  // The point of the policy: an entity whose fields cannot be combined picks a
  // side instead of being merged into something neither device reported.
  it('keeps the local side for an entity configured as local-wins', () => {
    const policy = createResolutionPolicy({ byEntityType: { note: 'local' } });
    const local = { body: 'mine' };
    const remote = { body: 'theirs' };

    expect(resolveConflictForEntity('note', local, remote, policy)).toBe(local);
  });

  it('keeps the remote side for an entity configured as remote-wins', () => {
    const policy = createResolutionPolicy({ byEntityType: { note: 'remote' } });
    const local = { body: 'mine' };
    const remote = { body: 'theirs' };

    expect(resolveConflictForEntity('note', local, remote, policy)).toBe(remote);
  });

  it('resolves two entity types differently in one policy', () => {
    const policy = createResolutionPolicy({
      byEntityType: { note: 'local', draft: 'remote' },
    });
    const local = { body: 'mine' };
    const remote = { body: 'theirs' };

    expect(resolveConflictForEntity('note', local, remote, policy)).toBe(local);
    expect(resolveConflictForEntity('draft', local, remote, policy)).toBe(remote);
  });

  it('is deterministic across repeated calls', () => {
    const local = progress({ progress: 40, updatedAt: '2026-01-02T00:00:00.000Z' });
    const remote = progress({ progress: 70 });

    expect(resolveConflictForEntity('course_progress', local, remote)).toEqual(
      resolveConflictForEntity('course_progress', local, remote),
    );
  });
});

describe('merge strategy registry', () => {
  it('uses a strategy registered for a new entity type', () => {
    registerMergeStrategy('tags', (local: unknown, remote: unknown) => ({
      tags: [...new Set([...(local as { tags: string[] }).tags, ...(remote as { tags: string[] }).tags])].sort(),
    }));

    const merged = resolveByEntityType('tags', { tags: ['b', 'a'] }, { tags: ['c', 'a'] }) as {
      tags: string[];
    };

    expect(merged.tags).toEqual(['a', 'b', 'c']);
  });

  it('exposes a registered strategy', () => {
    const strategy = (local: unknown) => local;
    registerMergeStrategy('custom', strategy);

    expect(getMergeStrategy('custom')).toBe(strategy);
  });

  // Without the registry the resolver read a frozen map, so registering a
  // strategy silently fell through to the generic shallow merge.
  it('falls back to the generic merge for an unregistered type', () => {
    const merged = resolveByEntityType('unknown_type', { a: 1, b: 1 }, { b: 2 });

    expect(merged).toEqual({ a: 1, b: 2 });
  });

  it('restores the built-in strategies on reset', () => {
    registerMergeStrategy('temporary', (local: unknown) => local);
    resetMergeStrategies();

    expect(getMergeStrategy('temporary')).toBeUndefined();
    expect(getMergeStrategy('course_progress')).toBeDefined();
  });

  // Removing the progress merge would send course progress down the generic
  // shallow merge, which is not deterministic across devices.
  it('refuses to unregister a built-in strategy', () => {
    expect(unregisterMergeStrategy('course_progress')).toBe(false);
    expect(getMergeStrategy('course_progress')).toBeDefined();
  });

  it('unregisters a custom strategy', () => {
    registerMergeStrategy('custom', (local: unknown) => local);

    expect(unregisterMergeStrategy('custom')).toBe(true);
    expect(getMergeStrategy('custom')).toBeUndefined();
  });
});
