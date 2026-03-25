/**
 * DataExplorationTools Component
 * Interactive tools for data analysis and exploration
 */

'use client';

import React, { useState, useMemo } from 'react';
import { InteractiveChartLibrary } from './InteractiveChartLibrary';
import {
  ChartData,
  ChartType,
  TimeRange,
  AggregationType,
  calculateStatistics,
  exportToCSV,
  exportToJSON,
  formatNumber,
  formatPercentage,
} from '@/utils/visualizationUtils';
import {
  Filter,
  Download,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';

export interface DataExplorationToolsProps {
  data: ChartData;
  title?: string;
  className?: string;
}

export const DataExplorationTools: React.FC<DataExplorationToolsProps> = ({
  data,
  title = 'Data Exploration',
  className = '',
}) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedDataset, setSelectedDataset] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [aggregation, setAggregationType] = useState<AggregationType>('sum');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics for selected dataset
  const statistics = useMemo(() => {
    if (!data.datasets[selectedDataset]) return null;
    return calculateStatistics(data.datasets[selectedDataset].data);
  }, [data, selectedDataset]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    let dataPoints = data.labels.length;

    switch (timeRange) {
      case '7d':
        dataPoints = Math.min(7, data.labels.length);
        break;
      case '30d':
        dataPoints = Math.min(30, data.labels.length);
        break;
      case '90d':
        dataPoints = Math.min(90, data.labels.length);
        break;
      case '1y':
        dataPoints = Math.min(365, data.labels.length);
        break;
      default:
        dataPoints = data.labels.length;
    }

    return {
      labels: data.labels.slice(-dataPoints),
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.slice(-dataPoints),
      })),
    };
  }, [data, timeRange]);

  const handleExport = (format: 'csv' | 'json') => {
    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    if (format === 'csv') {
      exportToCSV(filteredData, filename);
    } else {
      exportToJSON(filteredData, filename);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chart Type
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="area">Area</option>
                <option value="pie">Pie</option>
                <option value="scatter">Scatter</option>
                <option value="radar">Radar</option>
              </select>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Dataset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dataset
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {data.datasets.map((dataset, index) => (
                  <option key={index} value={index}>
                    {dataset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Mean</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(statistics.mean)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Median</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(statistics.median)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2">
              <PieChartIcon className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Mode</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(statistics.mode)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Max</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(statistics.max)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Min</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(statistics.min)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Std Dev</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(statistics.stdDev)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <InteractiveChartLibrary
        data={filteredData}
        chartType={chartType}
        title={`${data.datasets[selectedDataset]?.label || 'Data'} - ${timeRange}`}
        height={500}
        showLegend={true}
        showGrid={true}
        animated={true}
      />

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-x-auto">
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Data Table
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">Label</th>
              {filteredData.datasets.map((dataset, index) => (
                <th key={index} className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">
                  {dataset.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.labels.map((label, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="py-2 px-4 text-gray-900 dark:text-white">{label}</td>
                {filteredData.datasets.map((dataset, datasetIndex) => (
                  <td
                    key={datasetIndex}
                    className="text-right py-2 px-4 text-gray-900 dark:text-white"
                  >
                    {formatNumber(dataset.data[index])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
