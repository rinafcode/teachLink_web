import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportRecord, ImportResult, RawRow } from '@/lib/import';

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

const importMocks = vi.hoisted(() => {
  const rollbackManager = {
    register: vi.fn(),
    rollback: vi.fn(),
    clear: vi.fn(),
    get size() {
      return 0;
    },
  };

  return {
    parseCsv: vi.fn(),
    parseXlsxAsync: vi.fn(),
    runValidationPipeline: vi.fn(),
    createRollbackManager: vi.fn(() => rollbackManager),
    rollbackManager,
  };
});

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    track: analyticsMock.track,
    trackPageView: vi.fn(),
  }),
}));

vi.mock('@/lib/import', () => ({
  parseCsv: importMocks.parseCsv,
  parseXlsxAsync: importMocks.parseXlsxAsync,
  runValidationPipeline: importMocks.runValidationPipeline,
  createRollbackManager: importMocks.createRollbackManager,
}));

import { BulkImporter } from '../BulkImporter';

type ImportRow = {
  name: string;
  email: string;
};

const schema = {
  name: {
    sourceCols: ['name'],
    required: true,
  },
  email: {
    sourceCols: ['email'],
    required: true,
  },
} as const;

const targetFields = [
  { field: 'name', label: 'Name' },
  { field: 'email', label: 'Email' },
];

function createParsedRows(): RawRow[] {
  return [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' },
  ];
}

function createValidationResult(): ImportResult<ImportRow> {
  const records: ImportRecord<ImportRow>[] = createParsedRows().map((row, index) => ({
    rowIndex: index + 1,
    raw: row,
    data: row,
    errors: {},
    valid: true,
  }));

  return {
    total: 2,
    succeeded: 2,
    failed: 0,
    records,
  };
}

describe('BulkImporter analytics integration', () => {
  beforeEach(() => {
    analyticsMock.track.mockReset();
    importMocks.parseCsv.mockReset();
    importMocks.parseXlsxAsync.mockReset();
    importMocks.runValidationPipeline.mockReset();
    importMocks.createRollbackManager.mockClear();
    importMocks.rollbackManager.register.mockReset();
    importMocks.rollbackManager.rollback.mockReset();
    importMocks.rollbackManager.clear.mockReset();
  });

  it('tracks the happy-path import lifecycle', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue(undefined);

    importMocks.parseCsv.mockReturnValueOnce(createParsedRows());
    importMocks.runValidationPipeline.mockResolvedValueOnce(createValidationResult());

    render(<BulkImporter schema={schema} onImport={onImport} targetFields={targetFields} />);

    const fileInput = screen.getByLabelText(/drag & drop or browse/i);
    await user.upload(
      fileInput,
      new File(['name,email\nAda,ada@example.com'], 'people.csv', { type: 'text/csv' }),
    );

    await waitFor(() => expect(screen.getByText(/map columns/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /validate & continue/i }));

    await waitFor(() => expect(screen.getByText(/validation results/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /import 2 valid rows/i }));

    await waitFor(() => expect(screen.getByText(/import successful/i)).toBeInTheDocument());

    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_started',
      expect.objectContaining({
        feature: 'bulk_import',
        fileType: 'csv',
        fileSizeBytes: expect.any(Number),
        fileSizeKb: expect.any(Number),
      }),
    );
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_file_parsed',
      expect.objectContaining({
        feature: 'bulk_import',
        fileType: 'csv',
        rowCount: 2,
        columnCount: 2,
      }),
    );
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_validation_started',
      expect.objectContaining({
        feature: 'bulk_import',
        rowCount: 2,
        mappedColumns: 2,
      }),
    );
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_validation_completed',
      expect.objectContaining({
        feature: 'bulk_import',
        totalRows: 2,
        succeededRows: 2,
        failedRows: 0,
      }),
    );
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_completed',
      expect.objectContaining({
        feature: 'bulk_import',
        importedRows: 2,
        totalRows: 2,
        failedRows: 0,
      }),
    );
    expect(onImport).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Ada', email: 'ada@example.com' })]),
      importMocks.rollbackManager,
    );
  });

  it('tracks rollback and failure analytics when import persistence fails', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockImplementation(async () => {
      importMocks.rollbackManager.register(() => undefined, 'row-1');
      throw new Error('persist failed');
    });

    importMocks.parseCsv.mockReturnValueOnce(createParsedRows().slice(0, 1));
    importMocks.runValidationPipeline.mockResolvedValueOnce({
      total: 1,
      succeeded: 1,
      failed: 0,
      records: [
        {
          rowIndex: 1,
          raw: { name: 'Ada', email: 'ada@example.com' },
          data: { name: 'Ada', email: 'ada@example.com' },
          errors: {},
          valid: true,
        },
      ],
    });
    importMocks.rollbackManager.rollback.mockResolvedValueOnce({
      rolledBack: 1,
      errors: [],
    });

    render(<BulkImporter schema={schema} onImport={onImport} targetFields={targetFields} />);

    await user.upload(
      screen.getByLabelText(/drag & drop or browse/i),
      new File(['name,email\nAda,ada@example.com'], 'people.csv', { type: 'text/csv' }),
    );

    await waitFor(() => expect(screen.getByText(/map columns/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /validate & continue/i }));
    await waitFor(() => expect(screen.getByText(/validation results/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /import 1 valid row/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/rolled back 1 record/i),
    );

    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_rollback_completed',
      expect.objectContaining({
        feature: 'bulk_import',
        rolledBackRows: 1,
        rollbackErrors: 0,
      }),
    );
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'import_failed',
      expect.objectContaining({
        feature: 'bulk_import',
        stage: 'import',
        reason: 'onImport_error',
        rolledBackRows: 1,
        rollbackErrors: 0,
      }),
    );
  });
});
