/**
 * AdvancedDashboard Component
 * Main Advanced Data Visualization Dashboard.
 */

'use client';

import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Toaster } from 'react-hot-toast';

import { DashboardFilters } from './DashboardFilters';
import { DashboardHeader } from './DashboardHeader';
import { SortablePanel } from './SortablePanel';
import { DashboardPanelCard } from './DashboardPanelCard';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardControls } from '@/hooks/useDashboardControls';

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

  const { sensors, handleDragEnd, handleShare, handleExportAll, shareSuccess } =
    useDashboardControls({
      panels,
      reorderPanels,
      generateShareURL,
      exportPanel,
    });

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 ${className}`}>
      <Toaster position="top-right" />

      <DashboardHeader
        onExportAll={handleExportAll}
        onShare={handleShare}
        shareSuccess={shareSuccess}
      />

      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
        className="mb-6"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={panels.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {panels.map((panel, idx) => (
              <SortablePanel key={panel.id} panel={panel}>
                <DashboardPanelCard
                  panel={panel}
                  index={idx}
                  onExport={exportPanel}
                  onChartTypeChange={setPanelChartType}
                  onDrillDown={drillDown}
                  onClearDrillDown={clearDrillDown}
                />
              </SortablePanel>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});

AdvancedDashboard.displayName = 'AdvancedDashboard';
