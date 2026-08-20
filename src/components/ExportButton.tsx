import React, { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
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
  onError?: (error: Error) => void;
}

export function ExportButton({
  templateId,
  label = 'Run Export',
  className = '',
  filters,
  sort,
  columns,
  onComplete,
  onError,
}: ExportButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ExportProgressState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const isDisabled = isRunning || !templateId || templateId.trim() === '';

  const { refetch } = useApiResource<{ result: ExportButtonResult }>('/api/exports/execute', { method: 'POST', manual: true });

  const handleClick = async () => {
    if (isDisabled) return;

    setIsRunning(true);
    setIsError(false);
    setMessage(null);
    setProgress({
      stage: 'preparing',
      percent: 10,
      message: 'Preparing export request',
    });

    try {
      const response = await refetch({
        body: {
          templateId,
          filters,
          sort,
          columns,
        }
      });

      if (!response?.result?.success) {
        throw new Error('Export failed');
      }

      const finalProgress = response.result.progress?.[response.result.progress.length - 1] ?? {
        stage: 'completed' as const,
        percent: 100,
        message: 'Export completed',
      };

      setProgress(finalProgress);
      setIsError(false);
      setMessage(
        `${response.result.fileName} ready (${response.result.rowCount} rows, ${(
          response.result.fileSize / 1024
        ).toFixed(2)} KB)`,
      );
      onComplete?.(response.result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error) || 'Export failed');
      setProgress({
        stage: 'failed',
        percent: 100,
        message: err.message,
      });
      setIsError(true);
      setMessage(err.message);
      onError?.(err);
    } finally {
      setIsRunning(false);
    }
  };

  const isFailedStage = progress?.stage === 'failed' || isError;

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleClick} disabled={isDisabled} className={className}>
        {isRunning ? 'Exporting...' : label}
      </button>

      {progress && (
        <div className="space-y-1">
          <div
            className={`flex items-center justify-between text-xs ${
              isFailedStage ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}
          >
            <span>{progress.message}</span>
            <span>{progress.percent}%</span>
          </div>
          <div
            className="h-2 rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress.percent}
          >
            <div
              className={`h-2 rounded-full transition-all ${
                isFailedStage ? 'bg-red-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs ${isFailedStage ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default ExportButton;
