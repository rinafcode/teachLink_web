/**
 * Data Export Scheduler Types
 * Issue #267 - Data Export Scheduling
 */

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  format: ExportFormat;
  dataSource: string;
  filters?: Record<string, unknown>;
  columns?: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ExportSchedule {
  id: string;
  templateId: string;
  name: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  nextRunAt: Date;
  lastRunAt?: Date;
  enabled: boolean;
  emailDelivery: boolean;
  emailRecipients?: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ExportJob {
  id: string;
  scheduleId?: string;
  templateId: string;
  status: ExportStatus;
  format: ExportFormat;
  startedAt?: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  userId: string;
}

export interface ExportHistory {
  id: string;
  jobId: string;
  scheduleId?: string;
  templateId: string;
  status: ExportStatus;
  format: ExportFormat;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  executedAt: Date;
  completedAt?: Date;
  error?: string;
  userId: string;
}

export interface ExportNotification {
  jobId: string;
  userId: string;
  email: string;
  status: ExportStatus;
  fileName?: string;
  downloadUrl?: string;
  error?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  format: ExportFormat;
  dataSource: string;
  filters?: Record<string, unknown>;
  columns?: string[];
}

export interface CreateScheduleInput {
  templateId: string;
  name: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  emailDelivery?: boolean;
  emailRecipients?: string[];
}

export interface UpdateScheduleInput {
  name?: string;
  frequency?: ScheduleFrequency;
  cronExpression?: string;
  enabled?: boolean;
  emailDelivery?: boolean;
  emailRecipients?: string[];
}

export interface ExportOptions {
  templateId: string;
  scheduleId?: string;
  immediate?: boolean;
}

export interface ExportResult {
  success: boolean;
  jobId?: string;
  fileUrl?: string;
  error?: string;
}
