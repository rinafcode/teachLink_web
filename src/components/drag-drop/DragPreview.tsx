'use client';

import React from 'react';
import { DragDropItem } from '../../utils/dragDropUtils';

interface DragPreviewProps {
  item: DragDropItem;
}

export const DragPreview = ({ item }: DragPreviewProps) => {
  return (
    <div className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900 shadow-lg">
      {item.title || 'Moving item'}
    </div>
  );
};
