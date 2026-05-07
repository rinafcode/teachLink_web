import { useState, useCallback } from 'react';
import { useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import { DashboardPanel } from '@/hooks/useDashboardData';

interface UseDashboardControlsProps {
  panels: DashboardPanel[];
  reorderPanels: (fromIndex: number, toIndex: number) => void;
  generateShareURL: () => string;
  exportPanel: (id: string, format: 'csv') => void;
}

export const useDashboardControls = ({
  panels,
  reorderPanels,
  generateShareURL,
  exportPanel,
}: UseDashboardControlsProps) => {
  const [shareSuccess, setShareSuccess] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = panels.findIndex((p) => p.id === active.id);
      const toIndex = panels.findIndex((p) => p.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderPanels(fromIndex, toIndex);
      }
    },
    [panels, reorderPanels],
  );

  const handleShare = useCallback(async () => {
    const url = generateShareURL();
    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      toast.success('Dashboard link copied to clipboard!', { duration: 2500 });
      setTimeout(() => setShareSuccess(false), 2500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }, [generateShareURL]);

  const handleExportAll = useCallback(() => {
    panels.forEach((panel) => {
      if (panel.id !== 'realtime') {
        exportPanel(panel.id, 'csv');
      }
    });
    toast.success('Panels exported as CSV');
  }, [panels, exportPanel]);

  return {
    sensors,
    handleDragEnd,
    handleShare,
    handleExportAll,
    shareSuccess,
  };
};
