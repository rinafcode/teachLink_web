'use client';

import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DragDropItem } from '../../utils/dragDropUtils';
import { EmptyState } from '@/components';

interface SortableListProps {
  zoneId: string;
  items: DragDropItem[];
  emptyText?: string;
}

const SortableRow = ({ item, zoneId }: { item: DragDropItem; zoneId: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'COURSE_CONTENT_ITEM',
      item,
      zoneId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-blue-500 ${
        isDragging ? 'opacity-50 relative z-10' : 'opacity-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-slate-800">{item.title}</div>
          <div className="mt-1 text-xs text-slate-500">#{item.order + 1}</div>
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag handle for ${item.title}`}
          className="ml-2 cursor-grab active:cursor-grabbing rounded p-1 focus:ring-2 focus:ring-blue-500 outline-none"
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
    <SortableContext id={zoneId} items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
      <div role="listbox" aria-label="Sortable content list" className="min-h-[50px]">
        {items.map((item) => (
          <SortableRow key={item.id} item={item} zoneId={zoneId} />
        ))}
      </div>
    </SortableContext>
  );
};
