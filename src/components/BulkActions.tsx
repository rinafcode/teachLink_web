'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, X, RotateCcw, RotateCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useBulkHistory } from '@/lib/bulk/bulkHistory';
import {
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  createCancellationToken,
} from '@/lib/bulk/bulkOperations';

export interface BulkActionsProps<T> {
  items: T[];
  onCreate?: (items: T[]) => Promise<void>;
  onUpdate?: (items: T[]) => Promise<void>;
  onDelete?: (items: T[]) => Promise<void>;
  onUndo?: (snapshot: T[]) => Promise<void>;
  onRedo?: (snapshot: T[]) => Promise<void>;
  disabled?: boolean;
  className?: string;
  operationLabels?: {
    create?: string;
    update?: string;
    delete?: string;
    undo?: string;
    redo?: string;
  };
}

export function BulkActions<T extends { id?: string }>({
  items,
  onCreate,
  onUpdate,
  onDelete,
  onUndo,
  onRedo,
  disabled = false,
  className = '',
  operationLabels = {},
}: BulkActionsProps<T>) {
  const toast = useToast();
  const history = useBulkHistory<T[]>();

  const [isLoading, setIsLoading] = useState(false);
  const [operationType, setOperationType] = useState<'create' | 'update' | 'delete' | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancellationToken, setCancellationToken] = useState<{
    signal: AbortSignal;
    cancel: () => void;
  } | null>(null);

  const handleBulkOperation = useCallback(
    async (
      opType: 'create' | 'update' | 'delete',
      operationFn?: (items: T[]) => Promise<void>,
      bulkFn?: (
        items: T[],
        options: {
          signal: AbortSignal;
          onProgress?: (p: { completed: number; total: number; percentage: number }) => void;
        },
      ) => Promise<{
        successful: Array<{ item: T }>;
        failed: Array<{ item: T; error: Error }>;
        cancelled: boolean;
      }>,
    ) => {
      if (!items.length) {
        toast.info('No items selected');
        return;
      }

      if (disabled) return;

      setIsLoading(true);
      setIsProcessing(true);
      setOperationType(opType);

      const token = createCancellationToken();
      setCancellationToken(token);

      try {
        let result;

        if (bulkFn) {
          result = await bulkFn(items, {
            signal: token.signal,
            onProgress: (p) => setProgress(p.percentage),
          });
        } else if (operationFn) {
          // Fallback using provided operation function
          await operationFn(items);
          result = { successful: items.map((i) => ({ item: i })), failed: [], cancelled: false };
        } else {
          throw new Error('No operation function provided');
        }

        if (result.cancelled) {
          toast.info('Operation was cancelled');
          return;
        }

        const successCount = result.successful.length;
        const failCount = result.failed.length;

        if (failCount === 0) {
          toast.success(
            `${operationLabels[opType] || opType} successful for ${successCount} item(s)`,
          );
        } else if (successCount > 0) {
          toast.success(
            `${
              operationLabels[opType] || opType
            } completed: ${successCount} successful, ${failCount} failed`,
          );
        } else {
          toast.error(`All ${failCount} ${opType} operations failed`);
        }

        if (successCount > 0 && opType !== 'delete') {
          history.push({
            operation: opType,
            snapshot: result.successful.map((s) => s.item),
            itemCount: successCount,
            description: `Bulk ${opType} ${successCount} items`,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          toast.info('Operation cancelled');
        } else {
          toast.error(error instanceof Error ? error.message : 'Operation failed');
        }
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
        setOperationType(null);
        setCancellationToken(null);
        setProgress(0);
      }
    },
    [items, toast, history, operationLabels, disabled],
  );

  const handleUndo = useCallback(async () => {
    const entry = history.undo();
    if (entry && onUndo) {
      setIsLoading(true);
      try {
        await onUndo(entry.snapshot);
        toast.success('Undo successful');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Undo failed');
        history.redo();
      } finally {
        setIsLoading(false);
      }
    }
  }, [history, onUndo, toast]);

  const handleRedo = useCallback(async () => {
    const entry = history.redo();
    if (entry && onRedo) {
      setIsLoading(true);
      try {
        await onRedo(entry.snapshot);
        toast.success('Redo successful');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Redo failed');
        history.undo();
      } finally {
        setIsLoading(false);
      }
    }
  }, [history, onRedo, toast]);

  const handleCancel = useCallback(() => {
    cancellationToken?.cancel();
  }, [cancellationToken]);

  const getButtonState = (type: 'create' | 'update' | 'delete' | 'undo' | 'redo') => {
    if (isProcessing && operationType === type) return 'loading';
    if (type === 'undo' && !history.canUndo) return 'disabled';
    if (type === 'redo' && !history.canRedo) return 'disabled';
    return 'idle';
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Progress Bar */}
      {isProcessing && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Processing... {progress}%</span>
            <span>{items.length} items</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Create */}
        {onCreate && (
          <button
            onClick={() => handleBulkOperation('create', onCreate, bulkCreate)}
            disabled={disabled || isLoading || isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {getButtonState('create') === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>Create All</span>
          </button>
        )}

        {/* Update */}
        {onUpdate && (
          <button
            onClick={() => handleBulkOperation('update', onUpdate, bulkUpdate)}
            disabled={disabled || isLoading || isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {getButtonState('update') === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>Update All</span>
          </button>
        )}

        {/* Delete */}
        {onDelete && (
          <button
            onClick={() => handleBulkOperation('delete', onDelete, bulkDelete)}
            disabled={disabled || isLoading || isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {getButtonState('delete') === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>Delete All</span>
          </button>
        )}

        {/* Cancel */}
        {isProcessing && (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}

        {/* Undo */}
        {onUndo && history.canUndo && !isProcessing && (
          <button
            onClick={handleUndo}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Undo</span>
          </button>
        )}

        {/* Redo */}
        {onRedo && history.canRedo && !isProcessing && (
          <button
            onClick={handleRedo}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
            <span>Redo</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default BulkActions;
