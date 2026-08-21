import { describe, it, expect } from 'vitest';
import {
  compareVersionVectors,
  mergeVersionVectors,
  incrementVersionVector,
  detectConflict,
  resolveConflict,
  resolveByEntityType,
  createConflictRecord,
} from '../resolver';
import { ProgressData } from '../types';

const progress = (overrides: Partial<ProgressData> = {}): ProgressData => ({
  progress: 40,
  completed: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  logicalClock: 1,
  updatedBy: 'replica-a',
  versionVector: { 'replica-a': 1 },
  ...overrides,
});

describe('compareVersionVectors', () => {
  it('returns equal for identical vectors', () => {
    expect(compareVersionVectors({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe('equal');
  });

  it('detects a dominating b', () => {
    expect(compareVersionVectors({ a: 2, b: 1 }, { a: 1, b: 1 })).toBe('a-dominates');
  });

  it('detects b dominating a', () => {
    expect(compareVersionVectors({ a: 1 }, { a: 1, b: 1 })).toBe('b-dominates');
  });

  it('detects concurrent vectors (neither dominates)', () => {
    expect(compareVersionVectors({ a: 1 }, { b: 1 })).toBe('concurrent');
    expect(compareVersionVectors({ a: 2 }, { b: 2 })).toBe('concurrent');
  });

  it('treats missing entries as zero', () => {
    expect(compareVersionVectors({}, { a: 1 })).toBe('b-dominates');
    expect(compareVersionVectors({ a: 0 }, {})).toBe('equal');
  });
});

describe('mergeVersionVectors / incrementVersionVector', () => {
  it('merges element-wise max, commutatively', () => {
    expect(mergeVersionVectors({ a: 1, b: 2 }, { a: 3, c: 1 })).toEqual({ a: 3, b: 2, c: 1 });
    expect(mergeVersionVectors({ a: 3, c: 1 }, { a: 1, b: 2 })).toEqual({ a: 3, b: 2, c: 1 });
  });

  it('increments only the given replica', () => {
    expect(incrementVersionVector({ a: 1, b: 2 }, 'b')).toEqual({ a: 1, b: 3 });
    expect(incrementVersionVector({}, 'c')).toEqual({ c: 1 });
  });
});

describe('detectConflict', () => {
  it('does not flag a conflict when local dominates remote (local is strictly newer)', () => {
    const local = progress({ versionVector: { 'replica-a': 2 } });
    const remote = progress({ versionVector: { 'replica-a': 1 } });
    expect(detectConflict(local, remote)).toBe(false);
  });

  it('does not flag a conflict when remote dominates local', () => {
    const local = progress({ versionVector: { 'replica-a': 1 } });
    const remote = progress({ versionVector: { 'replica-a': 1, 'replica-b': 1 } });
    expect(detectConflict(local, remote)).toBe(false);
  });

  it('flags a conflict for concurrent vectors regardless of wall-clock skew', () => {
    // Remote has an EARLIER wall clock but a concurrent vector — clock drift
    // must not decide the outcome.
    const local = progress({
      updatedAt: '2026-01-02T00:00:00.000Z',
      versionVector: { 'replica-a': 1 },
    });
    const remote = progress({
      updatedAt: '2026-01-01T00:00:00.000Z',
      versionVector: { 'replica-b': 1 },
    });
    expect(detectConflict(local, remote)).toBe(true);
  });

  it('falls back to timestamp/version comparison for legacy records without vectors', () => {
    const local = progress({ versionVector: undefined, updatedAt: '2026-01-01T00:00:00.000Z', version: 1 });
    const remote = progress({ versionVector: undefined, updatedAt: '2026-01-02T00:00:00.000Z', version: 2 });
    expect(detectConflict(local, remote)).toBe(true);

    const newerLocal = progress({ versionVector: undefined, updatedAt: '2026-01-03T00:00:00.000Z', version: 3 });
    expect(detectConflict(newerLocal, remote)).toBe(false);
  });
});

describe('resolveConflict (deterministic merge)', () => {
  it('is deterministic across reordered inputs (commutative)', () => {
    const a = progress({
      progress: 60,
      completed: true,
      updatedAt: '2026-01-05T00:00:00.000Z',
      version: 7,
      logicalClock: 7,
      versionVector: { 'replica-a': 3, 'replica-b': 1 },
    });
    const b = progress({
      progress: 40,
      completed: false,
      updatedAt: '2026-01-02T00:00:00.000Z',
      version: 4,
      logicalClock: 4,
      versionVector: { 'replica-a': 1, 'replica-b': 2 },
    });

    const forward = resolveConflict(a, b, 'merge', 'course_progress');
    const backward = resolveConflict(b, a, 'merge', 'course_progress');
    expect(forward).toEqual(backward);
  });

  it('merges progress by max and completion by OR, advancing the logical clock', () => {
    const local = progress({ progress: 30, completed: false, versionVector: { a: 1 }, logicalClock: 1 });
    const remote = progress({ progress: 70, completed: true, versionVector: { b: 1 }, logicalClock: 5 });

    const merged = resolveConflict(local, remote, 'merge', 'course_progress');
    expect(merged.progress).toBe(70);
    expect(merged.completed).toBe(true);
    expect(merged.version).toBe(Math.max(1, 1) + 1);
    expect(merged.logicalClock).toBe(6);
    expect(merged.versionVector).toEqual({ a: 1, b: 1 });
  });

  it('is stable under device clock skew', () => {
    // Device A thinks it is 2026, device B thinks it is 2024.
    const local = progress({
      progress: 50,
      updatedAt: '2026-06-01T00:00:00.000Z',
      versionVector: { a: 1 },
    });
    const remote = progress({
      progress: 55,
      updatedAt: '2024-01-01T00:00:00.000Z',
      versionVector: { b: 1 },
    });

    const merged = resolveConflict(local, remote, 'merge', 'course_progress');
    expect(merged.progress).toBe(55);
    // Deterministic: does not depend on which wall clock is "newer".
    expect(merged).toEqual(resolveConflict(remote, local, 'merge', 'course_progress'));
  });

  it('honors local/remote strategies directly', () => {
    const local = progress({ progress: 10 });
    const remote = progress({ progress: 90 });
    expect(resolveConflict(local, remote, 'local', 'course_progress').progress).toBe(10);
    expect(resolveConflict(local, remote, 'remote', 'course_progress').progress).toBe(90);
  });
});

describe('resolveByEntityType (per-entity strategies)', () => {
  it('uses the course_progress strategy for progress-like payloads', () => {
    const local = progress({ progress: 20, completed: false });
    const remote = progress({ progress: 80, completed: true });
    const merged = resolveByEntityType('course_progress', local, remote);
    expect(merged.progress).toBe(80);
    expect(merged.completed).toBe(true);
  });

  it('falls back to a generic shallow merge for unknown entity types', () => {
    const local = { title: 'a', tags: ['x'] };
    const remote = { title: 'b', rating: 5 };
    expect(resolveByEntityType('unknown', local, remote)).toEqual({ title: 'b', tags: ['x'], rating: 5 });
  });
});

describe('createConflictRecord', () => {
  it('captures both version vectors and surfaces the conflicted state', () => {
    const local = progress({ versionVector: { a: 2 } });
    const remote = progress({ versionVector: { b: 1 } });

    const record = createConflictRecord('course_progress', 'c1:m1', local, remote);
    expect(record.entityType).toBe('course_progress');
    expect(record.entityKey).toBe('c1:m1');
    expect(record.state).toBe('conflicted');
    expect(record.resolved).toBe(false);
    expect(record.localVersionVector).toEqual({ a: 2 });
    expect(record.remoteVersionVector).toEqual({ b: 1 });
    expect(record.history[0].action).toBe('CREATED');
  });
});
