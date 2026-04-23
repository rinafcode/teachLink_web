/**
 * InteractiveCharts Component
 * Chart panel with multiple chart type switcher and drill-down capability.
 * Wraps the existing InteractiveChartLibrary with dashboard-specific interactions.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  AreaChart,
  PieChart,
  ScatterChart,
  Radar,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { InteractiveChartLibrary } from '@/components/visualization/InteractiveChartLibrary';
import { getDrillDownData } from '@/utils/chartUtils';
import type { ChartData, ChartType } from '@/utils/visualizationUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InteractiveChartsProps {
  panelId: string;
  data: ChartData;
  chartType: ChartType;
  title: string;
  drillDownIndex: number | null;
  onChartTypeChange: (type: ChartType) => void;
  onDrillDown: (index: number) => void;
  onClearDrillDown: () => void;
  className?: string;
}

// ─── Chart type toolbar config ────────────────────────────────────────────────

const CHART_TYPE_BUTTONS: { type: ChartType; Icon: React.ElementType; label: string }[] = [
  { type: 'line', Icon: TrendingUp, label: 'Line chart' },
  { type: 'bar', Icon: BarChart3, label: 'Bar chart' },
  { type: 'area', Icon: AreaChart, label: 'Area chart' },
  { type: 'pie', Icon: PieChart, label: 'Pie chart' },
  { type: 'scatter', Icon: ScatterChart, label: 'Scatter chart' },
  { type: 'radar', Icon: Radar, label: 'Radar chart' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const InteractiveCharts = React.memo<InteractiveChartsProps>(({
  panelId,
  data,
  chartType,
  title,
  drillDownIndex,
  onChartTypeChange,
  onDrillDown,
  onClearDrillDown,
  className = '',
}) => {
  const isDrillDown = drillDownIndex !== null;
  const drillDownData = isDrillDown ? getDrillDownData(data, drillDownIndex) : null;
  const drillDownLabel = isDrillDown ? data.labels[drillDownIndex] ?? 'Selected' : null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Chart type toolbar */}
      <div
        className="flex items-center gap-1 flex-wrap"
        role="toolbar"
        aria-label="Chart type selector"
      >
        {CHART_TYPE_BUTTONS.map(({ type, Icon, label }) => (
          <button
            key={type}
            onClick={() => onChartTypeChange(type)}
            aria-label={label}
            aria-pressed={chartType === type}
            className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              chartType === type
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Main chart */}
      <AnimatePresence mode="wait">
        {!isDrillDown ? (
          <motion.div
            key={`${panelId}-main`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <InteractiveChartLibrary
              data={data}
              chartType={chartType}
              title={title}
              height={320}
              showLegend
              showGrid
              animated
              onDataPointClick={(data: any) =>
                onDrillDown(data?.activeTooltipIndex ?? data?.index ?? 0)
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key={`${panelId}-drilldown`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={onClearDrillDown}
                className="text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                aria-label="Back to all data"
              >
                All Data
              </button>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-medium text-gray-700 dark:text-gray-200">{drillDownLabel}</span>
            </div>

            {/* Drill-down chart */}
            {drillDownData && (
              <InteractiveChartLibrary
                data={drillDownData}
                chartType="bar"
                title={`Detail — ${drillDownLabel}`}
                height={280}
                showLegend
                showGrid
                animated
              />
            )}

            {/* Back button */}
            <button
              onClick={onClearDrillDown}
              className="self-start flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Back to overview"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to overview
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

InteractiveCharts.displayName = 'InteractiveCharts';
