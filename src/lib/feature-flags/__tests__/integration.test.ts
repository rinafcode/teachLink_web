/**
 * Feature Flags Integration Tests
 * Tests the complete flow: create -> update -> evaluate -> delete
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFlag,
  getFlagById,
  updateFlag,
  deleteFlag,
  createAuditEntry,
  getAuditLog,
} from '../db';
import { evaluateFlag } from '../store';

// Skip if no database connection
const skipTests = !process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL;

describe.skipIf(skipTests)('Feature Flags Integration', () => {
  it('should handle complete flag lifecycle', async () => {
    // 1. Create a flag
    const flag = await createFlag({
      name: 'Integration Test Flag',
      description: 'Testing complete lifecycle',
      enabled: false,
      strategy: 'percentage',
      percentage: 50,
      rules: [],
      tags: ['integration', 'test'],
      createdBy: 'integration-test',
    });

    expect(flag.id).toMatch(/^flag_/);
    expect(flag.enabled).toBe(false);

    // Log creation
    await createAuditEntry('created', 'integration-test', null, flag);

    // 2. Retrieve the flag
    const retrieved = await getFlagById(flag.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Integration Test Flag');

    // 3. Evaluate the flag (should be false since disabled)
    if (retrieved) {
      const isEnabled = evaluateFlag(retrieved, { userId: 'test-user' });
      expect(isEnabled).toBe(false);
    }

    // 4. Enable the flag
    const updated = await updateFlag(flag.id, {
      enabled: true,
      percentage: 100, // 100% rollout
    });

    expect(updated?.enabled).toBe(true);
    expect(updated?.percentage).toBe(100);

    // Log the update
    if (retrieved && updated) {
      await createAuditEntry('toggled', 'integration-test', retrieved, updated);
    }

    // 5. Evaluate again (should now be true)
    if (updated) {
      const isEnabledNow = evaluateFlag(updated, { userId: 'test-user' });
      expect(isEnabledNow).toBe(true);
    }

    // 6. Check audit log
    const auditEntries = await getAuditLog(flag.id);
    expect(auditEntries.length).toBeGreaterThanOrEqual(2);
    expect(auditEntries[0].action).toBe('toggled');
    expect(auditEntries[1].action).toBe('created');

    // 7. Delete the flag
    const deleted = await deleteFlag(flag.id);
    expect(deleted).toBe(true);

    // Log deletion
    if (updated) {
      await createAuditEntry('deleted', 'integration-test', updated, null);
    }

    // 8. Verify deletion
    const afterDelete = await getFlagById(flag.id);
    expect(afterDelete).toBeNull();
  });

  it('should handle percentage-based rollout correctly', async () => {
    // Create flag with 0% rollout
    const flag = await createFlag({
      name: 'Integration Percentage Test',
      description: 'Testing percentage rollout',
      enabled: true,
      strategy: 'percentage',
      percentage: 0,
      rules: [],
      tags: ['test'],
      createdBy: 'integration-test',
    });

    // At 0%, should always be false
    expect(evaluateFlag(flag, { userId: 'user1' })).toBe(false);
    expect(evaluateFlag(flag, { userId: 'user2' })).toBe(false);

    // Update to 100%
    const updated = await updateFlag(flag.id, { percentage: 100 });
    expect(updated).toBeDefined();

    // At 100%, should always be true
    if (updated) {
      expect(evaluateFlag(updated, { userId: 'user1' })).toBe(true);
      expect(evaluateFlag(updated, { userId: 'user2' })).toBe(true);
    }

    // Clean up
    await deleteFlag(flag.id);
  });

  it('should handle targeting rules correctly', async () => {
    // Create flag with targeting rule
    const flag = await createFlag({
      name: 'Integration Targeting Test',
      description: 'Testing targeting rules',
      enabled: true,
      strategy: 'targeting',
      percentage: 0,
      rules: [
        {
          attribute: 'plan',
          operator: 'equals',
          value: 'pro',
        },
      ],
      tags: ['test'],
      createdBy: 'integration-test',
    });

    // Should be enabled for pro users
    expect(evaluateFlag(flag, { plan: 'pro' })).toBe(true);

    // Should be disabled for free users
    expect(evaluateFlag(flag, { plan: 'free' })).toBe(false);

    // Should be disabled if no plan provided
    expect(evaluateFlag(flag, { userId: 'test' })).toBe(false);

    // Clean up
    await deleteFlag(flag.id);
  });

  it('should handle multiple tags', async () => {
    const flag = await createFlag({
      name: 'Integration Tags Test',
      description: 'Testing multiple tags',
      enabled: true,
      strategy: 'all',
      percentage: 100,
      rules: [],
      tags: ['ui', 'beta', 'experimental', 'mobile'],
      createdBy: 'integration-test',
    });

    const retrieved = await getFlagById(flag.id);
    expect(retrieved?.tags).toEqual(['ui', 'beta', 'experimental', 'mobile']);

    // Update tags
    const updated = await updateFlag(flag.id, {
      tags: ['ui', 'stable', 'mobile'],
    });

    expect(updated?.tags).toEqual(['ui', 'stable', 'mobile']);

    // Clean up
    await deleteFlag(flag.id);
  });
});
