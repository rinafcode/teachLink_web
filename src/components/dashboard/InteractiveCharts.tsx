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
  ArrowLeft,
} from 'lucide-react';
import { InteractiveChartLibrary } from '@/components/visualization/InteractiveChartLibrary';
import { getDrillDownData } from '@/utils/chartUtils';
import type { ChartData, ChartType } from '@/utils/visualizationUtils';
import { useInternationalization } from '@/hooks/useInternationalization';
import { getDashboardChartTypeLabel, translateWithFallback } from './dashboardI18n';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';

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

interface ChartClickPoint {
  activeTooltipIndex?: number;
  index?: number;
}

const CHART_TYPE_BUTTONS: { type: ChartType; Icon: React.ElementType }[] = [
  { type: 'line', Icon: TrendingUp },
  { type: 'bar', Icon: BarChart3 },
  { type: 'area', Icon: AreaChart },
  { type: 'pie', Icon: PieChart },
  { type: 'scatter', Icon: ScatterChart },
  { type: 'radar', Icon: Radar },
];

export const InteractiveCharts = React.memo<InteractiveChartsProps>(
  ({
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
    const { t } = useInternationalization();
    const isDrillDown = drillDownIndex !== null;
    const drillDownData = isDrillDown ? getDrillDownData(data, drillDownIndex) : null;
    const drillDownLabel = isDrillDown
      ? data.labels[drillDownIndex] ??
        translateWithFallback(t, 'dashboard.analytics.drillDown.selected', 'Selected')
      : null;

    // Build breadcrumb items for drill-down navigation
    const breadcrumbItems: BreadcrumbItem[] = isDrillDown
      ? [
          {
            label: translateWithFallback(t, 'dashboard.analytics.drillDown.allData', 'All Data'),
            href: '#',
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              onClearDrillDown();
            },
          },
          {
            label: drillDownLabel ?? '',
            current: true,
          },
        ]
      : [];

    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div
          className="flex items-center gap-1 flex-wrap"
          role="toolbar"
          aria-label={translateWithFallback(
            t,
            'dashboard.analytics.chartTypeSelector',
            'Chart type selector',
          )}
        >
          {CHART_TYPE_BUTTONS.map(({ type, Icon }) => (
            <button
              key={type}
              onClick={() => onChartTypeChange(type)}
              aria-label={getDashboardChartTypeLabel(type, t)}
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
                onDataPointClick={(clickedPoint: ChartClickPoint) =>
                  onDrillDown(clickedPoint?.activeTooltipIndex ?? clickedPoint?.index ?? 0)
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
              <Breadcrumbs
                items={breadcrumbItems}
                ariaLabel={translateWithFallback(
                  t,
                  'dashboard.analytics.drillDown.breadcrumbNav',
                  'Drill-down navigation',
                )}
                className="mb-1"
              />

              {drillDownData && (
                <InteractiveChartLibrary
                  data={drillDownData}
                  chartType="bar"
                  title={translateWithFallback(
                    t,
                    'dashboard.analytics.drillDown.detailTitle',
                    `Detail - ${drillDownLabel}`,
                    { label: drillDownLabel ?? '' },
                  )}
                  height={280}
                  showLegend
                  showGrid
                  animated
                />
              )}

              <button
                onClick={onClearDrillDown}
                className="self-start flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={translateWithFallback(
                  t,
                  'dashboard.analytics.drillDown.backToOverview',
                  'Back to overview',
                )}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                {translateWithFallback(
                  t,
                  'dashboard.analytics.drillDown.backToOverview',
                  'Back to overview',
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

InteractiveCharts.displayName = 'InteractiveCharts';