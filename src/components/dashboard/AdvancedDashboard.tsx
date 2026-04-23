/**
 * AdvancedDashboard Component
 * Main Advanced Data Visualization Dashboard.
 * Features: drag-and-drop panel layout, multiple chart types, real-time updates,
 * data filtering, drill-down, and dashboard sharing.
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Share2, Download, GripVertical, BarChart2, CheckCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { DashboardFilters } from './DashboardFilters';
import { InteractiveCharts } from './InteractiveCharts';
import { RealTimeUpdater } from './RealTimeUpdater';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { DashboardPanel } from '@/hooks/useDashboardData';

// ─── Sortable Panel Wrapper ───────────────────────────────────────────────────

interface SortablePanelProps {
  panel: DashboardPanel;
  children: React.ReactNode;
}

const SortablePanel = React.memo<SortablePanelProps>(({ panel, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: panel.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.75 : 1,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export interface AdvancedDashboardProps {
  className?: string;
}

export const AdvancedDashboard = React.memo<AdvancedDashboardProps>(({ className = '' }) => {
  const {
    panels,
    filters,
    setFilters,
    resetFilters,
    setPanelChartType,
    drillDown,
    clearDrillDown,
    reorderPanels,
    generateShareURL,
    exportPanel,
  } = useDashboardData();

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

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 ${className}`}>
      <Toaster position="top-right" />

      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <BarChart2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Interactive data visualization &amp; real-time insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export all */}
          <button
            onClick={handleExportAll}
            aria-label="Export all panels as CSV"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Export All
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            aria-label="Copy shareable dashboard link"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {shareSuccess ? (
              <>
                <CheckCheck className="w-4 h-4" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" aria-hidden="true" />
                Share
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
        className="mb-6"
      />

      {/* Drag-and-drop grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={panels.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {panels.map((panel, idx) => (
              <SortablePanel key={panel.id} panel={panel}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 pr-10"
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      {panel.title}
                    </h2>
                    <button
                      onClick={() => exportPanel(panel.id, 'csv')}
                      aria-label={`Export ${panel.title} as CSV`}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Panel content */}
                  {panel.id === 'realtime' ? (
                    <RealTimeUpdater title={panel.title} chartType={panel.chartType} />
                  ) : (
                    <InteractiveCharts
                      panelId={panel.id}
                      data={panel.data}
                      chartType={panel.chartType}
                      title={panel.title}
                      drillDownIndex={panel.drillDownIndex}
                      onChartTypeChange={(type) => setPanelChartType(panel.id, type)}
                      onDrillDown={(index) => drillDown(panel.id, index)}
                      onClearDrillDown={() => clearDrillDown(panel.id)}
                    />
                  )}
                </motion.div>
              </SortablePanel>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});

AdvancedDashboard.displayName = 'AdvancedDashboard';
