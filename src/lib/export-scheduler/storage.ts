/**
 * Export Scheduler Storage Layer
 * Handles persistence of templates, schedules, and history
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ExportTemplate,
  ExportSchedule,
  ExportHistory,
  CreateTemplateInput,
  CreateScheduleInput,
  UpdateScheduleInput,
} from './types';

interface ExportSchedulerDB extends DBSchema {
  templates: {
    key: string;
    value: ExportTemplate;
    indexes: { 'by-user': string };
  };
  schedules: {
    key: string;
    value: ExportSchedule;
    indexes: { 'by-user': string; 'by-template': string; 'by-next-run': Date };
  };
  history: {
    key: string;
    value: ExportHistory;
    indexes: { 'by-user': string; 'by-schedule': string; 'by-date': Date };
  };
}

const DB_NAME = 'export-scheduler-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ExportSchedulerDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ExportSchedulerDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ExportSchedulerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Templates store
      if (!db.objectStoreNames.contains('templates')) {
        const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
        templateStore.createIndex('by-user', 'userId');
      }

      // Schedules store
      if (!db.objectStoreNames.contains('schedules')) {
        const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id' });
        scheduleStore.createIndex('by-user', 'userId');
        scheduleStore.createIndex('by-template', 'templateId');
        scheduleStore.createIndex('by-next-run', 'nextRunAt');
      }

      // History store
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('by-user', 'userId');
        historyStore.createIndex('by-schedule', 'scheduleId');
        historyStore.createIndex('by-date', 'executedAt');
      }
    },
  });

  return dbInstance;
}

// Template operations
export async function createTemplate(
  input: CreateTemplateInput,
  userId: string,
): Promise<ExportTemplate> {
  const db = await getDB();
  const template: ExportTemplate = {
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
  };
  await db.add('templates', template);
  return template;
}

export async function getTemplate(id: string): Promise<ExportTemplate | undefined> {
  const db = await getDB();
  return db.get('templates', id);
}

export async function getTemplatesByUser(userId: string): Promise<ExportTemplate[]> {
  const db = await getDB();
  return db.getAllFromIndex('templates', 'by-user', userId);
}

export async function updateTemplate(
  id: string,
  updates: Partial<CreateTemplateInput>,
): Promise<ExportTemplate | undefined> {
  const db = await getDB();
  const template = await db.get('templates', id);
  if (!template) return undefined;

  const updated: ExportTemplate = {
    ...template,
    ...updates,
    updatedAt: new Date(),
  };
  await db.put('templates', updated);
  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('templates', id);
  return true;
}

// Schedule operations
export async function createSchedule(
  input: CreateScheduleInput,
  userId: string,
  nextRunAt: Date,
): Promise<ExportSchedule> {
  const db = await getDB();
  const schedule: ExportSchedule = {
    id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...input,
    nextRunAt,
    enabled: true,
    emailDelivery: input.emailDelivery ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
  };
  await db.add('schedules', schedule);
  return schedule;
}

export async function getSchedule(id: string): Promise<ExportSchedule | undefined> {
  const db = await getDB();
  return db.get('schedules', id);
}

export async function getSchedulesByUser(userId: string): Promise<ExportSchedule[]> {
  const db = await getDB();
  return db.getAllFromIndex('schedules', 'by-user', userId);
}

export async function getSchedulesByTemplate(templateId: string): Promise<ExportSchedule[]> {
  const db = await getDB();
  return db.getAllFromIndex('schedules', 'by-template', templateId);
}

export async function getDueSchedules(beforeDate: Date = new Date()): Promise<ExportSchedule[]> {
  const db = await getDB();
  const allSchedules = await db.getAll('schedules');
  return allSchedules.filter((schedule) => schedule.enabled && schedule.nextRunAt <= beforeDate);
}

export async function updateSchedule(
  id: string,
  updates: UpdateScheduleInput,
): Promise<ExportSchedule | undefined> {
  const db = await getDB();
  const schedule = await db.get('schedules', id);
  if (!schedule) return undefined;

  const updated: ExportSchedule = {
    ...schedule,
    ...updates,
    updatedAt: new Date(),
  };
  await db.put('schedules', updated);
  return updated;
}

export async function updateScheduleNextRun(
  id: string,
  nextRunAt: Date,
  lastRunAt: Date,
): Promise<void> {
  const db = await getDB();
  const schedule = await db.get('schedules', id);
  if (!schedule) return;

  schedule.nextRunAt = nextRunAt;
  schedule.lastRunAt = lastRunAt;
  schedule.updatedAt = new Date();
  await db.put('schedules', schedule);
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('schedules', id);
  return true;
}

// History operations
export async function addHistory(history: ExportHistory): Promise<void> {
  const db = await getDB();
  await db.add('history', history);
}

export async function getHistoryByUser(
  userId: string,
  limit: number = 50,
): Promise<ExportHistory[]> {
  const db = await getDB();
  const allHistory = await db.getAllFromIndex('history', 'by-user', userId);
  return allHistory.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime()).slice(0, limit);
}

export async function getHistoryBySchedule(scheduleId: string): Promise<ExportHistory[]> {
  const db = await getDB();
  return db.getAllFromIndex('history', 'by-schedule', scheduleId);
}

export async function clearOldHistory(beforeDate: Date): Promise<number> {
  const db = await getDB();
  const allHistory = await db.getAll('history');
  const toDelete = allHistory.filter((h) => h.executedAt < beforeDate);

  for (const history of toDelete) {
    await db.delete('history', history.id);
  }

  return toDelete.length;
}
