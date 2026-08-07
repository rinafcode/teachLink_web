/**
 * Feature Flags Database Functions Tests
 * 
 * Note: These tests require a database connection.
 * Set TEST_DATABASE_URL in your environment for isolated testing.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getFlagById,
  getAllFlags,
  createFlag,
  updateFlag,
  deleteFlag,
  createAuditEntry,
  getAuditLog,
} from '../db';
import type { FeatureFlag } from '../types';

// Skip these tests if no database is available
const skipTests = !process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL;

describe.skipIf(skipTests)('Feature Flags Database Functions', () => {
  let testFlagId: string;

  beforeEach(async () => {
    // Clean up test flags before each test
    const flags = await getAllFlags();
    for (const flag of flags) {
      if (flag.name.startsWith('Test Flag')) {
        await deleteFlag(flag.id);
      }
    }
  });

  describe('createFlag', () => {
    it('should create a new flag with all fields', async () => {
      const newFlag = await createFlag({
        name: 'Test Flag Create',
        description: 'Test description',
        enabled: true,
        strategy: 'percentage',
        percentage: 50,
        rules: [],
        tags: ['test', 'demo'],
        createdBy: 'test-user',
      });

      expect(newFlag).toBeDefined();
      expect(newFlag.id).toMatch(/^flag_/);
      expect(newFlag.name).toBe('Test Flag Create');
      expect(newFlag.enabled).toBe(true);
      expect(newFlag.strategy).toBe('percentage');
      expect(newFlag.percentage).toBe(50);
      expect(newFlag.tags).toEqual(['test', 'demo']);
      expect(newFlag.createdBy).toBe('test-user');

      testFlagId = newFlag.id;

      // Clean up
      await deleteFlag(testFlagId);
    });
  });

  describe('getFlagById', () => {
    it('should retrieve a flag by ID', async () => {
      // Create a test flag
      const created = await createFlag({
        name: 'Test Flag Get',
        description: 'Get test',
        enabled: false,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      // Retrieve it
      const retrieved = await getFlagById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Flag Get');

      // Clean up
      await deleteFlag(created.id);
    });

    it('should return null for non-existent flag', async () => {
      const result = await getFlagById('flag_does_not_exist');
      expect(result).toBeNull();
    });
  });

  describe('getAllFlags', () => {
    it('should retrieve all flags', async () => {
      // Create test flags
      const flag1 = await createFlag({
        name: 'Test Flag All 1',
        description: 'Test 1',
        enabled: true,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      const flag2 = await createFlag({
        name: 'Test Flag All 2',
        description: 'Test 2',
        enabled: false,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      const flags = await getAllFlags();

      expect(flags.length).toBeGreaterThanOrEqual(2);
      const testFlags = flags.filter((f) => f.name.startsWith('Test Flag All'));
      expect(testFlags.length).toBe(2);

      // Clean up
      await deleteFlag(flag1.id);
      await deleteFlag(flag2.id);
    });

    it('should sort flags by updatedAt desc by default', async () => {
      const flag1 = await createFlag({
        name: 'Test Flag Sort 1',
        description: 'First',
        enabled: true,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const flag2 = await createFlag({
        name: 'Test Flag Sort 2',
        description: 'Second',
        enabled: true,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      const flags = await getAllFlags('updatedAt');
      const testFlags = flags.filter((f) => f.name.startsWith('Test Flag Sort'));

      expect(testFlags[0].name).toBe('Test Flag Sort 2'); // Most recent first

      // Clean up
      await deleteFlag(flag1.id);
      await deleteFlag(flag2.id);
    });
  });

  describe('updateFlag', () => {
    it('should update flag fields', async () => {
      // Create a test flag
      const created = await createFlag({
        name: 'Test Flag Update',
        description: 'Original description',
        enabled: false,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: ['original'],
        createdBy: 'test-user',
      });

      // Update it
      const updated = await updateFlag(created.id, {
        description: 'Updated description',
        enabled: true,
        percentage: 75,
        tags: ['updated', 'test'],
      });

      expect(updated).toBeDefined();
      expect(updated?.description).toBe('Updated description');
      expect(updated?.enabled).toBe(true);
      expect(updated?.percentage).toBe(75);
      expect(updated?.tags).toEqual(['updated', 'test']);
      expect(updated?.name).toBe('Test Flag Update'); // Unchanged

      // Clean up
      await deleteFlag(created.id);
    });

    it('should return null for non-existent flag', async () => {
      const result = await updateFlag('flag_does_not_exist', { enabled: true });
      expect(result).toBeNull();
    });
  });

  describe('deleteFlag', () => {
    it('should delete a flag', async () => {
      // Create a test flag
      const created = await createFlag({
        name: 'Test Flag Delete',
        description: 'To be deleted',
        enabled: false,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      // Delete it
      const deleted = await deleteFlag(created.id);
      expect(deleted).toBe(true);

      // Verify it's gone
      const retrieved = await getFlagById(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent flag', async () => {
      const result = await deleteFlag('flag_does_not_exist');
      expect(result).toBe(false);
    });
  });

  describe('audit log', () => {
    it('should create audit entries', async () => {
      // Create a test flag
      const flag = await createFlag({
        name: 'Test Flag Audit',
        description: 'Audit test',
        enabled: false,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      // Create audit entry
      const auditEntry = await createAuditEntry('created', 'test-actor', null, flag);

      expect(auditEntry).toBeDefined();
      expect(auditEntry.flagId).toBe(flag.id);
      expect(auditEntry.action).toBe('created');
      expect(auditEntry.actor).toBe('test-actor');
      expect(auditEntry.after).toBeDefined();

      // Clean up
      await deleteFlag(flag.id);
    });

    it('should retrieve audit log', async () => {
      // Create a test flag
      const flag = await createFlag({
        name: 'Test Flag Audit Log',
        description: 'Audit log test',
        enabled: false,
        strategy: 'all',
        percentage: 0,
        rules: [],
        tags: [],
        createdBy: 'test-user',
      });

      // Create audit entries
      await createAuditEntry('created', 'test-actor', null, flag);
      await createAuditEntry('updated', 'test-actor', flag, flag);

      // Get audit log for this flag
      const entries = await getAuditLog(flag.id, 10);

      expect(entries.length).toBeGreaterThanOrEqual(2);
      expect(entries[0].flagId).toBe(flag.id);

      // Clean up
      await deleteFlag(flag.id);
    });
  });
});
