import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DashboardPanel } from '@/hooks/useDashboardData';

interface SortablePanelProps {
  panel: DashboardPanel;
  children: React.ReactNode;
}

export const SortablePanel = React.memo<SortablePanelProps>(({ panel, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: panel.id,
  });
  const transformValue = CSS.Transform.toString(transform);

  const style: React.CSSProperties = {
    transform: transformValue ? `${transformValue} translate3d(0,0,0)` : 'translate3d(0,0,0)',
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.75 : 1,
    willChange: isDragging ? 'transform' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${panel.title} panel`}
        className="absolute top-3 right-3 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>
      {children}
    </div>
  );
});

SortablePanel.displayName = 'SortablePanel';
