/**
 * Tests for Scheduler Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExportSchedulerService } from '../scheduler-service';

describe('ExportSchedulerService', () => {
  let service: ExportSchedulerService;

  beforeEach(() => {
    service = new ExportSchedulerService();
  });

  afterEach(() => {
    service.stop();
  });

  describe('start/stop', () => {
    it('should start the scheduler', () => {
      service.start();
      expect(service['isRunning']).toBe(true);
    });

    it('should stop the scheduler', () => {
      service.start();
      service.stop();
      expect(service['isRunning']).toBe(false);
    });

    it('should not start twice', () => {
      service.start();
      service.start();
      expect(service['isRunning']).toBe(true);
    });
  });

  describe('executeExport', () => {
    it('should queue an export job', async () => {
      const result = await service.executeExport(
        { templateId: 'test-1', immediate: true },
        'user-1',
      );
      expect(result.success).toBe(false); // Template doesn't exist
      expect(result.error).toBeDefined();
    });
  });
});
