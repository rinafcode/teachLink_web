'use client';

import React from 'react';
import { useDragLayer } from 'react-dnd';

interface DragPreviewProps {
  getItemTitle?: (item: unknown) => string;
}

export const DragPreview = ({ getItemTitle }: DragPreviewProps) => {
  const { item, isDragging, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  const title = getItemTitle
    ? getItemTitle(item)
    : typeof item === 'object' && item !== null && 'title' in item
    ? String((item as { title: string }).title)
    : 'Moving item';

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900 shadow-lg"
        style={{
          transform: `translate(${currentOffset.x + 8}px, ${currentOffset.y + 8}px)`,
          position: 'absolute',
        }}
      >
        {title}
      </div>
    </div>
  );
};
