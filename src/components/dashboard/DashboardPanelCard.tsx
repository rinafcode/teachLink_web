import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { DashboardPanel } from '@/hooks/useDashboardData';
import { ChartType } from '@/utils/visualizationUtils';
import { InteractiveCharts } from './InteractiveCharts';
import { RealTimeUpdater } from './RealTimeUpdater';

interface DashboardPanelCardProps {
  panel: DashboardPanel;
  index: number;
  onExport: (id: string, format: 'csv') => void;
  onChartTypeChange: (id: string, type: ChartType) => void;
  onDrillDown: (id: string, index: number) => void;
  onClearDrillDown: (id: string) => void;
}

export const DashboardPanelCard: React.FC<DashboardPanelCardProps> = ({
  panel,
  index,
  onExport,
  onChartTypeChange,
  onDrillDown,
  onClearDrillDown,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      style={{ willChange: 'transform, opacity', transform: 'translate3d(0,0,0)' }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 pr-10 h-full"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{panel.title}</h2>
        <button
          onClick={() => onExport(panel.id, 'csv')}
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
          onChartTypeChange={(type) => onChartTypeChange(panel.id, type)}
          onDrillDown={(idx) => onDrillDown(panel.id, idx)}
          onClearDrillDown={() => onClearDrillDown(panel.id)}
        />
      )}
    </motion.div>
  );
};
