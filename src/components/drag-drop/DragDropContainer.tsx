'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDragDrop } from '../../hooks/useDragDrop';
import { DragDropItem, DragDropZone } from '../../utils/dragDropUtils';
import { DropZones } from './DropZones';
import { DragPreview } from './DragPreview';

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

  const [activeItem, setActiveItem] = useState<DragDropItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'COURSE_CONTENT_ITEM') {
      setActiveItem(active.data.current.item as DragDropItem);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const activeItem = activeData.item as DragDropItem;
    const activeZoneId = activeData.zoneId as string;

    const overType = overData.type;

    if (overType === 'COURSE_CONTENT_ITEM') {
      const overItem = overData.item as DragDropItem;
      const overZoneId = overData.zoneId as string;

      if (activeZoneId !== overZoneId) {
        // Move item to new zone (temporary while dragging, or handled at dragEnd depending on preference)
        // For simpler implementation without intermediate state updates, we can just let handleDragEnd deal with it.
        // But for smooth dragging between lists, we might need to handle moving items between zones here.
        // In useDragDrop, state updates are batched, so calling moveToZone is fine.

        // Find index of over item
        const overZoneItems = state[overZoneId] || [];
        const overIndex = overZoneItems.findIndex((i) => i.id === overItem.id);

        moveToZone(activeItem.id, activeZoneId, overZoneId, overIndex);

        // Mutate active.data.current so it points to the new zoneId for subsequent events
        active.data.current = {
          ...active.data.current,
          zoneId: overZoneId,
        };
      }
    } else if (overType === 'ZONE') {
      const overZone = overData.zone as DragDropZone;

      if (activeZoneId !== overZone.id) {
        const overZoneItems = state[overZone.id] || [];
        moveToZone(activeItem.id, activeZoneId, overZone.id, overZoneItems.length);

        active.data.current = {
          ...active.data.current,
          zoneId: overZone.id,
        };
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const activeZoneId = activeData.zoneId as string;

    if (overData.type === 'COURSE_CONTENT_ITEM') {
      const overItem = overData.item as DragDropItem;
      const overZoneId = overData.zoneId as string;

      if (activeZoneId === overZoneId) {
        const zoneItems = state[activeZoneId] || [];
        const oldIndex = zoneItems.findIndex((i) => i.id === active.id);
        const newIndex = zoneItems.findIndex((i) => i.id === over.id);

        if (oldIndex !== newIndex) {
          reorderInZone(activeZoneId, oldIndex, newIndex);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

        <DropZones zones={zones} state={state} />
      </div>
      <DragOverlay>{activeItem ? <DragPreview item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  );
};
