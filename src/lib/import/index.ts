/**
 * Public barrel for src/lib/import.
 *
 * Import from '@/lib/import' to access the full pipeline:
 *
 *   import { parseCsv, parseXlsxAsync, runValidationPipeline,
 *            createRollbackManager } from '@/lib/import';
 */

export { parseCsv, parseXlsx, parseXlsxAsync } from './parser';
export { applyMappings, validateRow, runValidationPipeline } from './validator';
export { createRollbackManager } from './rollback';
export type {
  RawRow,
  ImportRecord,
  ImportResult,
  ColumnMapping,
  ProgressCallback,
  FieldValidator,
  ImportSchema,
} from './types';
export type { RollbackManager, RollbackAction, RollbackResult } from './rollback';
