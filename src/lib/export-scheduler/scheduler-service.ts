/**
 * Export Scheduler Service
 * Main service for managing scheduled exports
 */

import { taskQueue } from '@/lib/queue';
import {
  ExportSchedule,
  ExportJob,
  ExportHistory,
  ExportOptions,
  ExportResult,
  ExportStatus,
} from './types';
import {
  getSchedule,
  getDueSchedules,
  updateScheduleNextRun,
  getTemplate,
  addHistory,
} from './storage';
import { getNextRunTime, frequencyToCron } from './cron-parser';
import { exportData, fetchDataForTemplate } from './exporter';
import { notificationService } from './notification-service';

interface ExportJobPayload {
  scheduleId?: string;
  templateId: string;
  userId: string;
  emailDelivery: boolean;
  emailRecipients?: string[];
}

export class ExportSchedulerService {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Register export job handler
    taskQueue.register<ExportJobPayload>('export-job', this.handleExportJob.bind(this));
  }

  /**
   * Start the scheduler
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Export scheduler started');

    // Check for due schedules periodically
    this.checkInterval = setInterval(() => {
      void this.checkDueSchedules();
    }, intervalMs);

    // Run initial check
    void this.checkDueSchedules();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Export scheduler stopped');
  }

  /**
   * Check for due schedules and queue export jobs
   */
  private async checkDueSchedules(): Promise<void> {
    try {
      const dueSchedules = await getDueSchedules();

      for (const schedule of dueSchedules) {
        await this.queueExportJob(schedule);
      }
    } catch (error) {
      console.error('Error checking due schedules:', error);
    }
  }

  /**
   * Queue an export job for a schedule
   */
  private async queueExportJob(schedule: ExportSchedule): Promise<void> {
    const payload: ExportJobPayload = {
      scheduleId: schedule.id,
      templateId: schedule.templateId,
      userId: schedule.userId,
      emailDelivery: schedule.emailDelivery,
      emailRecipients: schedule.emailRecipients,
    };

    taskQueue.enqueue('export-job', payload);

    // Update next run time
    const cronExpression = schedule.cronExpression || frequencyToCron(schedule.frequency);
    const nextRun = getNextRunTime(cronExpression);
    await updateScheduleNextRun(schedule.id, nextRun, new Date());
  }

  /**
   * Execute an export immediately
   */
  async executeExport(options: ExportOptions, userId: string): Promise<ExportResult> {
    const template = await getTemplate(options.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const schedule = options.scheduleId ? await getSchedule(options.scheduleId) : undefined;

    const payload: ExportJobPayload = {
      scheduleId: options.scheduleId,
      templateId: options.templateId,
      userId,
      emailDelivery: schedule?.emailDelivery ?? false,
      emailRecipients: schedule?.emailRecipients,
    };

    const job = taskQueue.enqueue('export-job', payload);

    return {
      success: true,
      jobId: job.id,
    };
  }

  /**
   * Handle export job execution
   */
  private async handleExportJob(job: { payload: ExportJobPayload }): Promise<void> {
    const { scheduleId, templateId, userId, emailDelivery, emailRecipients } = job.payload;

    const historyId = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const executedAt = new Date();

    try {
      // Get template
      const template = await getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Fetch data
      const data = await fetchDataForTemplate(template);

      // Export data
      const { blob, fileName } = await exportData(template, data);

      // In production, upload to cloud storage (S3, etc.)
      // For now, create a local object URL
      const downloadUrl = URL.createObjectURL(blob);
      const fileSize = blob.size;

      // Add to history
      const history: ExportHistory = {
        id: historyId,
        jobId: `job-${Date.now()}`,
        scheduleId,
        templateId,
        status: 'completed',
        format: template.format,
        fileName,
        fileSize,
        downloadUrl,
        executedAt,
        completedAt: new Date(),
        userId,
      };
      await addHistory(history);

      // Send notification if enabled
      if (emailDelivery && emailRecipients && emailRecipients.length > 0) {
        for (const email of emailRecipients) {
          await notificationService.sendExportNotification({
            jobId: history.jobId,
            userId,
            email,
            status: 'completed',
            fileName,
            downloadUrl,
          });
        }
      }

      console.log(`Export completed: ${fileName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Add failed history
      const history: ExportHistory = {
        id: historyId,
        jobId: `job-${Date.now()}`,
        scheduleId,
        templateId,
        status: 'failed',
        format: 'csv', // Default
        fileName: 'export-failed',
        fileSize: 0,
        executedAt,
        completedAt: new Date(),
        error: errorMessage,
        userId,
      };
      await addHistory(history);

      // Send failure notification
      if (emailDelivery && emailRecipients && emailRecipients.length > 0) {
        for (const email of emailRecipients) {
          await notificationService.sendExportNotification({
            jobId: history.jobId,
            userId,
            email,
            status: 'failed',
            error: errorMessage,
          });
        }
      }

      throw error;
    }
  }
}

// Singleton instance
export const schedulerService = new ExportSchedulerService();
