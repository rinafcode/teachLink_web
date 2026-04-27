'use client';

import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import { DragDropItem } from '../../utils/dragDropUtils';
import { EmptyState } from '@/components';

export const DRAG_ITEM_TYPE = 'COURSE_CONTENT_ITEM';

interface SortableListProps {
  zoneId: string;
  items: DragDropItem[];
  onReorder: (zoneId: string, fromIndex: number, toIndex: number) => void;
  onMoveToZone: (itemId: string, fromZoneId: string, toZoneId: string, toIndex?: number) => void;
  emptyText?: string;
}

interface DragPayload {
  id: string;
  fromZoneId: string;
  index: number;
  title: string;
}

const SortableRow = ({
  item,
  index,
  zoneId,
  onReorder,
  onMoveToZone,
}: {
  item: DragDropItem;
  index: number;
  zoneId: string;
  onReorder: (zoneId: string, fromIndex: number, toIndex: number) => void;
  onMoveToZone: (itemId: string, fromZoneId: string, toZoneId: string, toIndex?: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isKeyboardDragging, setIsKeyboardDragging] = useState(false);

  const moveItem = (direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0) return;
    onReorder(zoneId, index, targetIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        setIsKeyboardDragging((prev) => !prev);
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isKeyboardDragging) moveItem('up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isKeyboardDragging) moveItem('down');
        break;

      case 'Escape':
        setIsKeyboardDragging(false);
        break;
    }
  };

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DRAG_ITEM_TYPE,
      item: {
        id: item.id,
        fromZoneId: zoneId,
        index,
        title: item.title,
      } satisfies DragPayload,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index, item.id, item.title, zoneId],
  );

  const [, drop] = useDrop(
    () => ({
      accept: DRAG_ITEM_TYPE,
      hover: (dragged: DragPayload, monitor) => {
        if (!ref.current) return;
        if (dragged.fromZoneId !== zoneId) return;
        if (dragged.index === index) return;

        const hoverRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;

        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        const hoverClientY = clientOffset.y - hoverRect.top;

        if (dragged.index < index && hoverClientY < hoverMiddleY) return;
        if (dragged.index > index && hoverClientY > hoverMiddleY) return;

        onReorder(zoneId, dragged.index, index);
        dragged.index = index;
      },
      drop: (dragged: DragPayload) => {
        if (dragged.fromZoneId !== zoneId) {
          onMoveToZone(dragged.id, dragged.fromZoneId, zoneId, index);
          dragged.fromZoneId = zoneId;
          dragged.index = index;
        }
      },
    }),
    [index, onMoveToZone, onReorder, zoneId],
  );

  drag(drop(ref));

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="option"
      aria-grabbed={isKeyboardDragging}
      onKeyDown={handleKeyDown}
      className={`mb-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-blue-500 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${isKeyboardDragging ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-slate-800">{item.title}</div>
          <div className="mt-1 text-xs text-slate-500">#{item.order + 1}</div>
        </div>

        {/* Accessible drag handle */}
        <button
          type="button"
          aria-label={`Drag handle for ${item.title}`}
          className="ml-2 cursor-grab rounded p-1 focus:ring-2 focus:ring-blue-500"
        >
          ⠿
        </button>
      </div>
    </div>
  );
};

export const SortableList = ({
  zoneId,
  items,
  onReorder,
  onMoveToZone,
  emptyText = 'Drop content here',
}: SortableListProps) => {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={GripVertical}
        title={emptyText}
        className="border border-dashed border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900/30 py-8"
      />
    );
  }

  return (
    <div role="listbox" aria-label="Sortable content list">
      {items.map((item, index) => (
        <SortableRow
          key={item.id}
          item={item}
          index={index}
          zoneId={zoneId}
          onReorder={onReorder}
          onMoveToZone={onMoveToZone}
        />
      ))}
    </div>
  );
};
