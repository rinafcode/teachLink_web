'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableRowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
}

export interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  onRowDoubleTap?: (row: T) => void;
  onRowLongPress?: (row: T) => void;
  rowActions?: TableRowAction<T>[];
  resizableColumns?: boolean;
  touchOptimization?: boolean;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  selectedRowKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
}

interface TableRowProps<T> {
  row: T;
  rowId: string;
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  onRowDoubleTap?: (row: T) => void;
  onRowLongPress?: (row: T) => void;
  rowActions?: TableRowAction<T>[];
  columnWidths: Record<string, number>;
  selected: boolean;
  onSelect: () => void;
  touchOptimization: boolean;
  rowClassName?: string;
}

function TableRow<T>({
  row,
  rowId,
  columns,
  onRowClick,
  onRowDoubleTap,
  onRowLongPress,
  rowActions,
  columnWidths,
  selected,
  onSelect,
  touchOptimization,
  rowClassName = '',
}: TableRowProps<T>) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!touchOptimization) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    if (onRowLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onRowLongPress(row);
        if (rowRef.current) {
          rowRef.current.style.transform = 'scale(0.98)';
          setTimeout(() => {
            if (rowRef.current) rowRef.current.style.transform = `translateX(${swipeOffset}px)`;
          }, 150);
        }
      }, 500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchOptimization || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (rowActions && rowActions.length > 0) {
        // Prevent default scrolling when swiping horizontally
        if (e.cancelable) {
          e.preventDefault();
        }
        setIsSwiping(true);
        const maxSwipe = rowActions.length * 72; // Width of action buttons (72px)
        if (deltaX < 0) {
          setSwipeOffset(Math.max(-maxSwipe, deltaX));
        } else {
          setSwipeOffset(Math.min(maxSwipe / 2, deltaX)); // drag resistance for right swipe
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchOptimization || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const isTap = Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10;

    if (isTap) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        if (onRowDoubleTap) {
          onRowDoubleTap(row);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        if (onRowClick) {
          onRowClick(row);
        }
      }
    }

    if (isSwiping && rowActions) {
      const maxSwipe = rowActions.length * 72;
      if (swipeOffset < -maxSwipe / 3) {
        setSwipeOffset(-maxSwipe); // snap open
      } else {
        setSwipeOffset(0); // snap shut
      }
    }

    setIsSwiping(false);
    touchStartRef.current = null;
  };

  const handleActionClick = (action: TableRowAction<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick(row);
    setSwipeOffset(0); // close swipe drawer after action click
  };

  return (
    <div
      ref={rowRef}
      className={`relative border-b border-gray-100 dark:border-gray-800 transition-all duration-200 ${
        selected
          ? 'bg-blue-50/50 dark:bg-blue-900/10'
          : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
      } ${rowClassName}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: rowActions && rowActions.length > 0 ? 'pan-y' : 'auto' }}
    >
      {/* Swipe actions underneath */}
      {rowActions && rowActions.length > 0 && (
        <div
          data-testid="swipe-actions"
          className="absolute inset-y-0 right-0 flex items-center justify-end z-0"
          style={{ width: `${rowActions.length * 72}px` }}
        >
          {rowActions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => handleActionClick(action, e)}
              className={`h-full w-[72px] flex flex-col items-center justify-center text-xs font-medium transition-colors select-none ${
                action.className ||
                'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {action.icon && <div className="mb-1">{action.icon}</div>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Row foreground content */}
      <div
        role="row"
        aria-selected={selected}
        className="flex items-center min-h-[48px] md:min-h-[56px] relative z-10 bg-white dark:bg-gray-900 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {/* Selection checkbox cell */}
        {onSelectionChangeCheckbox(selected, onSelect, touchOptimization)}

        {/* Column cells */}
        {columns.map((col) => {
          const width = columnWidths[col.key];
          const style = width ? { width: `${width}px`, flexShrink: 0, flexGrow: 0 } : { flex: 1 };

          return (
            <div
              key={col.key}
              role="gridcell"
              className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 overflow-hidden text-ellipsis whitespace-nowrap flex items-center"
              style={style}
            >
              {col.render
                ? col.render(row, 0)
                : (row[col.key as keyof T] as unknown as React.ReactNode)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function onSelectionChangeCheckbox(
  selected: boolean,
  onSelect: () => void,
  touchOptimization: boolean,
) {
  if (!onSelect) return null;
  return (
    <div
      role="gridcell"
      className="px-4 flex items-center justify-center flex-shrink-0"
      style={{ width: '48px' }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        aria-label="Select row"
        className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${
          touchOptimization ? 'h-6 w-6' : 'h-4 w-4'
        }`}
      />
    </div>
  );
}

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  onRowDoubleTap,
  onRowLongPress,
  rowActions,
  resizableColumns = false,
  touchOptimization = true,
  className = '',
  headerClassName = '',
  rowClassName = '',
  selectedRowKeys = [],
  onSelectionChange,
}: TableProps<T>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  useEffect(() => {
    const initialWidths: Record<string, number> = {};
    columns.forEach((col) => {
      if (col.width) {
        initialWidths[col.key] = col.width;
      }
    });
    setColumnWidths(initialWidths);
  }, [columns]);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 5);
    setShowRightScroll(scrollWidth - clientWidth - scrollLeft > 5);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [data, columns, checkScroll]);

  const handleResizeStart = (colKey: string, clientX: number) => {
    const startWidth = columnWidths[colKey] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - clientX;
      const colDef = columns.find((c) => c.key === colKey);
      const minW = colDef?.minWidth || 60;
      const maxW = colDef?.maxWidth || 800;
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: Math.min(maxW, Math.max(minW, startWidth + delta)),
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchResizeStart = (colKey: string, touchStartEvent: React.TouchEvent) => {
    if (touchStartEvent.touches.length !== 1) return;
    touchStartEvent.stopPropagation();

    const clientX = touchStartEvent.touches[0].clientX;
    const startWidth = columnWidths[colKey] || 150;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const delta = moveEvent.touches[0].clientX - clientX;
      const colDef = columns.find((c) => c.key === colKey);
      const minW = colDef?.minWidth || 60;
      const maxW = colDef?.maxWidth || 800;
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: Math.min(maxW, Math.max(minW, startWidth + delta)),
      }));
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  };

  const getRowId = useCallback(
    (row: T): string => {
      if (typeof rowKey === 'function') {
        return rowKey(row);
      }
      return String(row[rowKey]);
    },
    [rowKey],
  );

  const toggleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedRowKeys.includes(id)) {
      onSelectionChange(selectedRowKeys.filter((k) => k !== id));
    } else {
      onSelectionChange([...selectedRowKeys, id]);
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    const allIds = data.map(getRowId);
    if (selectedRowKeys.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}
    >
      {/* Horizontal Scroll Left Fade Overlay */}
      {showLeftScroll && (
        <div
          data-testid="scroll-indicator-left"
          className="absolute left-0 inset-y-0 w-10 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-gray-900 dark:via-gray-900/70 pointer-events-none z-20 flex items-center justify-start pl-1 text-gray-400 dark:text-gray-500"
        >
          <ChevronLeft size={20} className="animate-pulse" />
        </div>
      )}

      {/* Horizontal Scroll Right Fade Overlay */}
      {showRightScroll && (
        <div
          data-testid="scroll-indicator-right"
          className="absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-gray-900 dark:via-gray-900/70 pointer-events-none z-20 flex items-center justify-end pr-1 text-gray-400 dark:text-gray-500"
        >
          <ChevronRight size={20} className="animate-pulse" />
        </div>
      )}

      {/* Main Table Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto scrollbar-thin scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div role="table" aria-rowcount={data.length + 1} className="min-w-full inline-block">
          {/* Header Row */}
          <div
            role="rowgroup"
            className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800"
          >
            <div role="row" className="flex items-center min-h-[48px]">
              {onSelectionChange && (
                <div
                  role="columnheader"
                  className="px-4 flex items-center justify-center flex-shrink-0"
                  style={{ width: '48px' }}
                >
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedRowKeys.length === data.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                    className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${
                      touchOptimization ? 'h-6 w-6' : 'h-4 w-4'
                    }`}
                  />
                </div>
              )}

              {columns.map((col) => {
                const width = columnWidths[col.key];
                const style = width
                  ? { width: `${width}px`, flexShrink: 0, flexGrow: 0 }
                  : { flex: 1 };

                return (
                  <div
                    key={col.key}
                    role="columnheader"
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative flex items-center group select-none ${headerClassName}`}
                    style={style}
                  >
                    <span>{col.header}</span>

                    {/* Resize handle (Desktop & Touch Support) */}
                    {resizableColumns && (
                      <div
                        data-testid={`resize-handle-${col.key}`}
                        className={`absolute right-0 inset-y-0 cursor-col-resize z-20 flex items-center justify-center transition-all ${
                          touchOptimization ? '-mr-2 w-6' : 'w-2 hover:bg-blue-500/20'
                        }`}
                        style={{ touchAction: 'none' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleResizeStart(col.key, e.clientX);
                        }}
                        onTouchStart={(e) => {
                          handleTouchResizeStart(col.key, e);
                        }}
                      >
                        {/* Visual resize handle indicator line */}
                        <div className="w-[2px] h-4 bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 active:bg-blue-600 transition-colors" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Row Group */}
          <div
            role="rowgroup"
            className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900"
          >
            {data.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No data available
              </div>
            ) : (
              data.map((row) => {
                const id = getRowId(row);
                return (
                  <TableRow
                    key={id}
                    row={row}
                    rowId={id}
                    columns={columns}
                    onRowClick={onRowClick}
                    onRowDoubleTap={onRowDoubleTap}
                    onRowLongPress={onRowLongPress}
                    rowActions={rowActions}
                    columnWidths={columnWidths}
                    selected={selectedRowKeys.includes(id)}
                    onSelect={() => toggleSelectRow(id)}
                    touchOptimization={touchOptimization}
                    rowClassName={rowClassName}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
