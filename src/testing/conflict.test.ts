import { describe, it, expect } from 'vitest';
import { detectConflict, resolveConflict, createConflictRecord } from '../lib/conflict/resolver';
import { ProgressData } from '../lib/conflict/types';

describe('Conflict Resolution', () => {
  describe('detectConflict', () => {
    it('should detect conflict when remote is newer', () => {
      const local = { updatedAt: '2023-01-01T10:00:00Z', version: 1 };
      const remote = { updatedAt: '2023-01-01T11:00:00Z', version: 2 };
      expect(detectConflict(local, remote)).toBe(true);
    });

    it('should not detect conflict when local is newer', () => {
      const local = { updatedAt: '2023-01-01T12:00:00Z', version: 3 };
      const remote = { updatedAt: '2023-01-01T11:00:00Z', version: 2 };
      expect(detectConflict(local, remote)).toBe(false);
    });

    it('should detect conflict on version mismatch even if timestamps are same', () => {
      const local = { updatedAt: '2023-01-01T10:00:00Z', version: 1 };
      const remote = { updatedAt: '2023-01-01T10:00:00Z', version: 2 };
      expect(detectConflict(local, remote)).toBe(true);
    });
  });

  describe('resolveConflict', () => {
    const local: ProgressData = {
      progress: 50,
      completed: false,
      updatedAt: '2023-01-01T10:00:00Z',
      version: 1,
    };
    const remote: ProgressData = {
      progress: 30,
      completed: true,
      updatedAt: '2023-01-01T11:00:00Z',
      version: 2,
    };

    it('should resolve using local strategy', () => {
      expect(resolveConflict(local, remote, 'local')).toEqual(local);
    });

    it('should resolve using remote strategy', () => {
      expect(resolveConflict(local, remote, 'remote')).toEqual(remote);
    });

    it('should resolve using merge strategy for progress', () => {
      const merged = resolveConflict(local, remote, 'merge') as ProgressData;
      expect(merged.progress).toBe(50); // Max of 50 and 30
      expect(merged.completed).toBe(true); // true || false
      expect(merged.version).toBe(3); // Max(1, 2) + 1
    });
  });

  describe('createConflictRecord', () => {
    it('should create a record with initial history', () => {
      const local = { data: 'a' };
      const remote = { data: 'b' };
      const record = createConflictRecord('test', 'key', local, remote);

      expect(record.entityType).toBe('test');
      expect(record.entityKey).toBe('key');
      expect(record.history).toHaveLength(1);
      expect(record.history[0].action).toBe('CREATED');
    });
  });
});
