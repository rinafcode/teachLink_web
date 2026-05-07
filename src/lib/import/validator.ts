/**
 * Validation pipeline.
 *
 * Runs each row through the ImportSchema and returns ImportRecord results
 * with per-field error messages. Reports progress via an optional callback.
 */

import type {
  RawRow,
  ImportRecord,
  ImportResult,
  ImportSchema,
  ColumnMapping,
  ProgressCallback,
} from './types';

/**
 * Apply column mappings to rename source headers to target field names.
 * Returns a new row object using the mapped keys.
 */
export function applyMappings(row: RawRow, mappings: ColumnMapping[]): RawRow {
  const mapped: RawRow = { ...row };
  for (const { sourceHeader, targetField } of mappings) {
    if (sourceHeader in mapped && sourceHeader !== targetField) {
      mapped[targetField] = mapped[sourceHeader];
      delete mapped[sourceHeader];
    }
  }
  return mapped;
}

/**
 * Validate and transform a single raw row against the schema.
 * Returns an ImportRecord with `valid=true` and `data` when the row passes,
 * or `valid=false` with populated `errors` when it fails.
 */
export function validateRow<T>(
  raw: RawRow,
  rowIndex: number,
  schema: ImportSchema<T>,
): ImportRecord<T> {
  const errors: Record<string, string> = {};
  const result: Partial<T> = {};

  for (const fieldKey of Object.keys(schema) as Array<keyof T>) {
    const def = schema[fieldKey];
    const { sourceCols, required = false, transform, validators = [] } = def;

    // Resolve the raw value from the first matching source column
    let rawValue = '';
    for (const col of sourceCols) {
      if (col in raw && raw[col] !== '') {
        rawValue = raw[col];
        break;
      }
    }

    // Required check
    if (required && rawValue === '') {
      errors[fieldKey as string] = `${String(fieldKey)} is required`;
      continue;
    }

    // Transform
    let transformed: T[keyof T];
    try {
      transformed = transform ? transform(rawValue) : (rawValue as unknown as T[keyof T]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors[fieldKey as string] = `Transform failed: ${msg}`;
      continue;
    }

    // Custom validators
    let fieldError: string | null = null;
    for (const validator of validators) {
      const msg = validator(transformed, raw);
      if (msg !== null) {
        fieldError = msg;
        break;
      }
    }

    if (fieldError !== null) {
      errors[fieldKey as string] = fieldError;
    } else {
      result[fieldKey] = transformed;
    }
  }

  const valid = Object.keys(errors).length === 0;
  return {
    rowIndex,
    raw,
    data: valid ? (result as T) : undefined,
    errors,
    valid,
  };
}

/**
 * Run the full validation pipeline over all rows.
 *
 * Processes rows in batches to keep the UI responsive (yields control via
 * `setTimeout(0)` between batches). Calls `onProgress` after each batch.
 *
 * @param rows      Raw rows from the parser
 * @param schema    Field-level validation schema
 * @param mappings  Optional column renames to apply before validation
 * @param onProgress Optional callback called after each batch
 * @param batchSize Rows per batch (default 100)
 * @param signal    AbortSignal to cancel mid-run
 */
export async function runValidationPipeline<T>(
  rows: RawRow[],
  schema: ImportSchema<T>,
  mappings: ColumnMapping[] = [],
  onProgress?: ProgressCallback,
  batchSize = 100,
  signal?: AbortSignal,
): Promise<ImportResult<T>> {
  const records: ImportRecord<T>[] = [];
  const total = rows.length;

  for (let i = 0; i < total; i += batchSize) {
    if (signal?.aborted) break;

    const batch = rows.slice(i, i + batchSize);
    for (let j = 0; j < batch.length; j++) {
      const mappedRow = applyMappings(batch[j], mappings);
      records.push(validateRow<T>(mappedRow, i + j + 1, schema));
    }

    onProgress?.(Math.min(i + batchSize, total), total);

    // Yield to keep the main thread responsive between batches
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  const succeeded = records.filter((r) => r.valid).length;

  return {
    total: records.length,
    succeeded,
    failed: records.length - succeeded,
    records,
  };
}
