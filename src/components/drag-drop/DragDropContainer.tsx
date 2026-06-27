'use client';

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDragDrop } from '../../hooks/useDragDrop';
import { DragDropItem, DragDropZone } from '../../utils/dragDropUtils';
import { DragPreview } from './DragPreview';
import { DropZones } from './DropZones';

interface DragDropContainerProps {
  title?: string;
  subtitle?: string;
  zones: DragDropZone[];
  items: DragDropItem[];
  storageKey?: string;
  autoSaveDelay?: number;
  onAutoSave?: (state: Record<string, DragDropItem[]>) => void | Promise<void>;
}

export const DragDropContainer = ({
  title = 'Course Content Organizer',
  subtitle = 'Drag lessons, quizzes, and resources across zones. Changes auto-save.',
  zones,
  items,
  storageKey,
  autoSaveDelay,
  onAutoSave,
}: DragDropContainerProps) => {
  const {
    state,
    isSaving,
    lastSavedAt,
    saveError,
    reorderInZone,
    moveToZone,
    saveNow,
    resetState,
  } = useDragDrop({
    zones,
    items,
    storageKey,
    autoSaveDelay,
    onAutoSave,
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`rounded px-2 py-1 font-medium ${
                saveError
                  ? 'bg-red-100 text-red-700'
                  : isSaving
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {saveError
                ? `Save error: ${saveError}`
                : isSaving
                ? 'Saving...'
                : lastSavedAt
                ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                : 'Ready'}
            </span>
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 transition hover:bg-slate-100"
              onClick={() => void saveNow()}
            >
              Save now
            </button>
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 transition hover:bg-slate-100"
              onClick={resetState}
            >
              Reset
            </button>
          </div>
        </div>

        <DropZones
          zones={zones}
          state={state}
          onReorder={reorderInZone}
          onMoveToZone={moveToZone}
        />
      </div>
      <DragPreview />
    </DndProvider>
  );
};
