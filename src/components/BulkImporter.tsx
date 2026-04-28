'use client';

/**
 * BulkImporter
 *
 * Full-featured CSV / Excel bulk-import UI.
 *
 * Stages:
 *   1. File drop / select
 *   2. Column-mapping (source header → target field)
 *   3. Preview (first N rows, validity colour-coded)
 *   4. Validation progress bar
 *   5. Results summary + per-row error table
 *   6. Rollback on failure
 *
 * Props:
 *   - schema        ImportSchema<T>          field definitions & validators
 *   - onImport      (records: T[]) => ...    called with valid rows after confirmation
 *   - targetFields  Array<{field, label}>    friendly labels for the mapping step
 *   - maxPreviewRows                         how many rows to show in the preview (default 10)
 *   - className                              extra Tailwind classes for the outer wrapper
 */

import React, {
  useCallback,
  useId,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Upload, AlertCircle, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  parseCsv,
  parseXlsxAsync,
  runValidationPipeline,
  createRollbackManager,
} from '@/lib/import';
import type {
  RawRow,
  ImportResult,
  ImportRecord,
  ColumnMapping,
  ImportSchema,
  RollbackManager,
} from '@/lib/import';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TargetFieldDef {
  field: string;
  label: string;
}

export interface BulkImporterProps<T> {
  schema: ImportSchema<T>;
  onImport: (records: T[], rollback: RollbackManager) => Promise<void> | void;
  targetFields: TargetFieldDef[];
  maxPreviewRows?: number;
  className?: string;
}

type Stage = 'idle' | 'mapping' | 'preview' | 'validating' | 'results' | 'done';

interface State {
  stage: Stage;
  fileName: string;
  rawRows: RawRow[];
  headers: string[];
  mappings: ColumnMapping[];
  progress: { processed: number; total: number };
  result: ImportResult | null;
  importedCount: number;
  error: string | null;
  rolledBack: boolean;
  expandedRow: number | null;
}

type Action =
  | { type: 'FILE_LOADED'; fileName: string; rawRows: RawRow[]; headers: string[] }
  | { type: 'SET_MAPPING'; sourceHeader: string; targetField: string }
  | { type: 'START_VALIDATION' }
  | { type: 'PROGRESS'; processed: number; total: number }
  | { type: 'VALIDATION_DONE'; result: ImportResult }
  | { type: 'IMPORT_SUCCESS'; count: number }
  | { type: 'ROLLBACK_DONE' }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'TOGGLE_ROW'; rowIndex: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FILE_LOADED':
      return {
        ...state,
        stage: 'mapping',
        fileName: action.fileName,
        rawRows: action.rawRows,
        headers: action.headers,
        // Pre-fill exact matches
        mappings: action.headers.map((h) => ({ sourceHeader: h, targetField: h })),
        result: null,
        error: null,
        rolledBack: false,
      };
    case 'SET_MAPPING':
      return {
        ...state,
        mappings: state.mappings.map((m) =>
          m.sourceHeader === action.sourceHeader
            ? { ...m, targetField: action.targetField }
            : m,
        ),
      };
    case 'START_VALIDATION':
      return { ...state, stage: 'validating', progress: { processed: 0, total: state.rawRows.length } };
    case 'PROGRESS':
      return { ...state, progress: { processed: action.processed, total: action.total } };
    case 'VALIDATION_DONE':
      return { ...state, stage: 'results', result: action.result as ImportResult };
    case 'IMPORT_SUCCESS':
      return { ...state, stage: 'done', importedCount: action.count };
    case 'ROLLBACK_DONE':
      return { ...state, rolledBack: true };
    case 'RESET':
      return initialState;
    case 'SET_ERROR':
      return { ...state, error: action.error, stage: 'idle' };
    case 'TOGGLE_ROW':
      return {
        ...state,
        expandedRow: state.expandedRow === action.rowIndex ? null : action.rowIndex,
      };
    default:
      return state;
  }
}

const initialState: State = {
  stage: 'idle',
  fileName: '',
  rawRows: [],
  headers: [],
  mappings: [],
  progress: { processed: 0, total: 0 },
  result: null,
  importedCount: 0,
  error: null,
  rolledBack: false,
  expandedRow: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkImporter<T>({
  schema,
  onImport,
  targetFields,
  maxPreviewRows = 10,
  className = '',
}: BulkImporterProps<T>) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputId = useId();
  const abortRef = useRef<AbortController | null>(null);
  const rollbackRef = useRef<RollbackManager>(createRollbackManager());

  // ── File ingestion ──────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isCsv = name.endsWith('.csv');

    if (!isExcel && !isCsv) {
      dispatch({ type: 'SET_ERROR', error: 'Unsupported file type. Please upload a CSV or XLSX file.' });
      return;
    }

    try {
      let rows: RawRow[] | null = null;

      if (isCsv) {
        const text = await file.text();
        rows = parseCsv(text);
      } else {
        const buffer = await file.arrayBuffer();
        rows = await parseXlsxAsync(buffer);
      }

      if (!rows || rows.length === 0) {
        dispatch({ type: 'SET_ERROR', error: 'The file is empty or could not be parsed.' });
        return;
      }

      const headers = Object.keys(rows[0]);
      dispatch({ type: 'FILE_LOADED', fileName: file.name, rawRows: rows, headers });
    } catch (e: unknown) {
      dispatch({
        type: 'SET_ERROR',
        error: `Failed to read file: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  // ── Validation ──────────────────────────────────────────────────────────────

  const runValidation = useCallback(async () => {
    // START_VALIDATION is already dispatched by the button click; do not repeat it.
    abortRef.current = new AbortController();

    const result = await runValidationPipeline<T>(
      state.rawRows,
      schema,
      state.mappings,
      (processed, total) => dispatch({ type: 'PROGRESS', processed, total }),
      100,
      abortRef.current.signal,
    );

    dispatch({ type: 'VALIDATION_DONE', result: result as ImportResult });
  }, [state.rawRows, schema, state.mappings]);

  // ── Import confirmed ────────────────────────────────────────────────────────

  const handleConfirmImport = useCallback(async () => {
    if (!state.result) return;
    const validRecords = state.result.records
      .filter((r) => r.valid)
      .map((r) => r.data as T);

    rollbackRef.current.clear();

    try {
      await onImport(validRecords, rollbackRef.current);
      dispatch({ type: 'IMPORT_SUCCESS', count: validRecords.length });
    } catch (e: unknown) {
      const rbResult = await rollbackRef.current.rollback();
      dispatch({ type: 'ROLLBACK_DONE' });
      dispatch({
        type: 'SET_ERROR',
        error: `Import failed${rbResult.rolledBack > 0 ? ` — rolled back ${rbResult.rolledBack} record(s)` : ''}: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }, [state.result, onImport]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const previewRows = state.rawRows.slice(0, maxPreviewRows);

  const progressPct =
    state.progress.total > 0
      ? Math.round((state.progress.processed / state.progress.total) * 100)
      : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full space-y-6 ${className}`}>

      {/* ── Error banner ── */}
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-sm">{state.error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STAGE: idle — file drop zone
      ──────────────────────────────────────────────────────────────────────── */}
      {state.stage === 'idle' && (
        <label
          htmlFor={fileInputId}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500'
            }`}
        >
          <Upload
            className={`mb-3 h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            aria-hidden="true"
          />
          <p className="text-base font-medium text-gray-700 dark:text-gray-200">
            Drag &amp; drop or <span className="text-blue-600 dark:text-blue-400">browse</span>
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Supports CSV and XLSX files
          </p>
          <input
            id={fileInputId}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STAGE: mapping
      ──────────────────────────────────────────────────────────────────────── */}
      {state.stage === 'mapping' && (
        <section aria-label="Column mapping">
          <Header title="Map columns" subtitle={`File: ${state.fileName} — ${state.rawRows.length} rows detected`} />

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <Th>Source column</Th>
                  <Th>Maps to</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {state.headers.map((header) => {
                  const mapping = state.mappings.find((m) => m.sourceHeader === header);
                  return (
                    <tr key={header}>
                      <Td>
                        <span className="font-mono text-gray-800 dark:text-gray-200">{header}</span>
                      </Td>
                      <Td>
                        <select
                          aria-label={`Map ${header} to target field`}
                          value={mapping?.targetField ?? ''}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_MAPPING',
                              sourceHeader: header,
                              targetField: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— skip —</option>
                          {targetFields.map((tf) => (
                            <option key={tf.field} value={tf.field}>
                              {tf.label}
                            </option>
                          ))}
                        </select>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Preview */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
              Preview first {Math.min(maxPreviewRows, state.rawRows.length)} rows
            </summary>
            <PreviewTable headers={state.headers} rows={previewRows} className="mt-2" />
          </details>

          <ActionRow>
            <CancelButton onClick={handleCancel} />
            <PrimaryButton onClick={() => dispatch({ type: 'START_VALIDATION' }) /* immediately go to validating */ } disabled={false}>
              Validate &amp; continue
            </PrimaryButton>
          </ActionRow>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STAGE: validating
      ──────────────────────────────────────────────────────────────────────── */}
      {state.stage === 'validating' && (
        <section aria-label="Validation progress" aria-live="polite">
          <Header title="Validating…" subtitle={`${state.progress.processed} / ${state.progress.total} rows processed`} />

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">{progressPct}%</p>

          {/* Kick off validation after this render */}
          <RunOnce fn={runValidation} onError={(e) => dispatch({ type: 'SET_ERROR', error: e })} />

          <ActionRow>
            <CancelButton onClick={handleCancel} label="Abort" />
          </ActionRow>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STAGE: results
      ──────────────────────────────────────────────────────────────────────── */}
      {state.stage === 'results' && state.result && (
        <section aria-label="Validation results">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard
              label="Total rows"
              value={state.result.total}
              color="gray"
            />
            <SummaryCard
              label="Valid"
              value={state.result.succeeded}
              color="green"
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            />
            <SummaryCard
              label="Failed"
              value={state.result.failed}
              color="red"
              icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
            />
          </div>

          {/* Error table */}
          {state.result.failed > 0 && (
            <ErrorTable
              records={state.result.records.filter((r) => !r.valid)}
              expandedRow={state.expandedRow}
              onToggleRow={(idx) => dispatch({ type: 'TOGGLE_ROW', rowIndex: idx })}
            />
          )}

          {state.rolledBack && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
            >
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
              Partial writes were rolled back successfully.
            </div>
          )}

          <ActionRow>
            <CancelButton onClick={handleCancel} label="Start over" />
            {state.result.succeeded > 0 && (
              <PrimaryButton onClick={() => void handleConfirmImport()} disabled={false}>
                Import {state.result.succeeded} valid row{state.result.succeeded !== 1 ? 's' : ''}
              </PrimaryButton>
            )}
          </ActionRow>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          STAGE: done — import succeeded
      ──────────────────────────────────────────────────────────────────────── */}
      {state.stage === 'done' && (
        <section
          aria-label="Import complete"
          className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-10 text-center dark:border-green-800 dark:bg-green-950"
        >
          <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">
              Import successful
            </p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              {state.importedCount} record{state.importedCount !== 1 ? 's' : ''} imported successfully.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="mt-2 rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-green-700 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
          >
            Import another file
          </button>
        </section>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>;
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex items-center justify-end gap-3">{children}</div>;
}

function CancelButton({ onClick, label = 'Cancel' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-400 dark:hover:text-gray-100"
    >
      {label}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      {children}
    </button>
  );
}

function PreviewTable({
  headers,
  rows,
  className = '',
}: {
  headers: string[];
  rows: RawRow[];
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-1.5 text-left font-semibold text-gray-500 dark:text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
          {rows.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h} className="max-w-xs truncate px-3 py-1.5 text-gray-700 dark:text-gray-300">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'gray' | 'green' | 'red';
  icon?: React.ReactNode;
}) {
  const colorMap = {
    gray: 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
    green: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
    red: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  };
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${colorMap[color]}`}>
      {icon}
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-75">{label}</p>
      </div>
    </div>
  );
}

function ErrorTable({
  records,
  expandedRow,
  onToggleRow,
}: {
  records: ImportRecord[];
  expandedRow: number | null;
  onToggleRow: (rowIndex: number) => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-red-200 dark:border-red-800">
      <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        Rows with errors ({records.length})
      </div>
      <ul className="max-h-72 divide-y divide-red-100 overflow-y-auto dark:divide-red-900" role="list">
        {records.map((record) => {
          const isExpanded = expandedRow === record.rowIndex;
          const errorKeys = Object.keys(record.errors);
          return (
            <li key={record.rowIndex} className="bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={() => onToggleRow(record.rowIndex)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-red-50 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-red-400 dark:hover:bg-red-950"
              >
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  Row {record.rowIndex}
                  <span className="ml-2 text-xs font-normal text-red-600 dark:text-red-400">
                    {errorKeys.length} error{errorKeys.length !== 1 ? 's' : ''}
                  </span>
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                )}
              </button>
              {isExpanded && (
                <dl className="border-t border-red-100 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
                  {errorKeys.map((key) => (
                    <div key={key} className="mb-1 flex gap-2 text-xs">
                      <dt className="font-semibold text-red-700 dark:text-red-300">{key}:</dt>
                      <dd className="text-red-600 dark:text-red-400">{record.errors[key]}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Utility: run an async `fn` exactly once after the first render.
 * Errors are forwarded to the `onError` callback rather than silently dropped.
 */
function RunOnce({ fn, onError }: { fn: () => Promise<void>; onError: (msg: string) => void }) {
  const ran = useRef(false);
  if (!ran.current) {
    ran.current = true;
    // Schedule asynchronously so the current state update completes first
    Promise.resolve()
      .then(fn)
      .catch((e: unknown) => onError(e instanceof Error ? e.message : String(e)));
  }
  return null;
}
