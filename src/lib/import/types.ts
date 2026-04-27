/**
 * Shared types for the bulk-import pipeline.
 */

/** A raw row from CSV/Excel parsing (column name → cell value). */
export type RawRow = Record<string, string>;

/** One validated (or failed) record after the validation stage. */
export interface ImportRecord<T = unknown> {
  /** Original 1-based row number in the source file. */
  rowIndex: number;
  /** Raw values before transformation. */
  raw: RawRow;
  /** Transformed data — present only when the row passed validation. */
  data?: T;
  /** Field-level validation errors, keyed by field name. */
  errors: Record<string, string>;
  /** Whether this row passed all validation checks. */
  valid: boolean;
}

/** Result returned by the full import pipeline. */
export interface ImportResult<T = unknown> {
  total: number;
  succeeded: number;
  failed: number;
  records: ImportRecord<T>[];
}

/** A single column-mapping entry: source CSV header → target model field. */
export interface ColumnMapping {
  sourceHeader: string;
  targetField: string;
}

/** Progress callback shape. */
export type ProgressCallback = (processed: number, total: number) => void;

/** A field-level validator: returns an error message string or null when valid. */
export type FieldValidator<V = unknown> = (value: V, row: RawRow) => string | null;

/** Schema used to validate and transform a single import row. */
export type ImportSchema<T> = {
  [K in keyof T]: {
    /** Column name(s) to read from — supports aliases. */
    sourceCols: string[];
    /** Whether the field is required. */
    required?: boolean;
    /** Optional transform applied before validation. */
    transform?: (raw: string) => T[K];
    /** Optional extra validators beyond required/presence checks. */
    validators?: FieldValidator<T[K]>[];
  };
};
