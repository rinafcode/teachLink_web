import React, { useState } from 'react';
import { apiClient } from '@/lib/api';
import { ExportFilter, ExportProgressState, ExportSort } from '@/lib/export';

interface ExportButtonResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  contentType: string;
  rowCount: number;
  progress?: ExportProgressState[];
}

interface ExportButtonProps {
  templateId: string;
  label?: string;
  className?: string;
  filters?: ExportFilter[];
  sort?: ExportSort[];
  columns?: string[];
  onComplete?: (result: ExportButtonResult) => void;
}

export function ExportButton({
  templateId,
  label = 'Run Export',
  className = '',
  filters,
  sort,
  columns,
  onComplete,
}: ExportButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ExportProgressState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setIsRunning(true);
    setMessage(null);
    setProgress({
      stage: 'preparing',
      percent: 10,
      message: 'Preparing export request',
    });

    try {
      const response = await apiClient.post<{ result: ExportButtonResult }>(
        '/api/exports/execute',
        {
          templateId,
          filters,
          sort,
          columns,
        },
      );

      const finalProgress =
        response.result.progress?.[response.result.progress.length - 1] ?? {
          stage: 'completed' as const,
          percent: 100,
          message: 'Export completed',
        };

      setProgress(finalProgress);
      setMessage(
        `${response.result.fileName} ready (${response.result.rowCount} rows, ${(
          response.result.fileSize / 1024
        ).toFixed(2)} KB)`,
      );
      onComplete?.(response.result);
    } catch (error) {
      setProgress({
        stage: 'completed',
        percent: 100,
        message: 'Export failed',
      });
      setMessage(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isRunning}
        className={className}
      >
        {isRunning ? 'Exporting...' : label}
      </button>

      {progress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{progress.message}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200" role="progressbar" aria-valuenow={progress.percent}>
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  );
}

export default ExportButton;
