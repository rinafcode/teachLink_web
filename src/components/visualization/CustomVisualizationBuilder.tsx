/**
 * CustomVisualizationBuilder Component
 * User-friendly interface for creating custom charts
 */

'use client';

import React, { useState } from 'react';
import { InteractiveChartLibrary } from './InteractiveChartLibrary';
import { ChartData, ChartType, CHART_COLOR_PALETTE } from '@/utils/visualizationUtils';
import { Plus, Trash2, Save, Download } from 'lucide-react';

export interface CustomVisualizationBuilderProps {
  onSave?: (config: { data: ChartData; chartType: ChartType; title: string }) => void;
  className?: string;
}

export const CustomVisualizationBuilder: React.FC<CustomVisualizationBuilderProps> = ({
  onSave,
  className = '',
}) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [title, setTitle] = useState('Custom Chart');
  const [labels, setLabels] = useState<string[]>(['Jan', 'Feb', 'Mar', 'Apr', 'May']);
  const [datasets, setDatasets] = useState([
    {
      label: 'Dataset 1',
      data: [65, 59, 80, 81, 56],
      backgroundColor: CHART_COLOR_PALETTE[0],
      borderColor: CHART_COLOR_PALETTE[0],
    },
  ]);

  const [newLabel, setNewLabel] = useState('');
  const [newDatasetName, setNewDatasetName] = useState('');

  const chartData: ChartData = {
    labels,
    datasets,
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      setLabels([...labels, newLabel.trim()]);
      setDatasets(
        datasets.map((dataset) => ({
          ...dataset,
          data: [...dataset.data, 0],
        })),
      );
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
    setDatasets(
      datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.filter((_, i) => i !== index),
      })),
    );
  };

  const handleAddDataset = () => {
    if (newDatasetName.trim()) {
      const colorIndex = datasets.length % CHART_COLOR_PALETTE.length;
      setDatasets([
        ...datasets,
        {
          label: newDatasetName.trim(),
          data: Array(labels.length).fill(0),
          backgroundColor: CHART_COLOR_PALETTE[colorIndex],
          borderColor: CHART_COLOR_PALETTE[colorIndex],
        },
      ]);
      setNewDatasetName('');
    }
  };

  const handleRemoveDataset = (index: number) => {
    setDatasets(datasets.filter((_, i) => i !== index));
  };

  const handleDataChange = (datasetIndex: number, labelIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setDatasets(
      datasets.map((dataset, i) =>
        i === datasetIndex
          ? {
              ...dataset,
              data: dataset.data.map((d, j) => (j === labelIndex ? numValue : d)),
            }
          : dataset,
      ),
    );
  };

  const handleSave = () => {
    onSave?.({ data: chartData, chartType, title });
  };

  const handleExport = () => {
    const config = { data: chartData, chartType, title };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Chart Configuration
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chart Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter chart title"
            />
          </div>

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
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
              <option value="scatter">Scatter Chart</option>
              <option value="radar">Radar Chart</option>
            </select>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Labels
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Add label"
              />
              <button
                onClick={handleAddLabel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {labels.map((label, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <button
                    onClick={() => handleRemoveLabel(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Datasets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Datasets
            </label>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDataset()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Add dataset"
              />
              <button
                onClick={handleAddDataset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {datasets.map((dataset, datasetIndex) => (
                <div
                  key={datasetIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: dataset.backgroundColor }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dataset.label}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveDataset(datasetIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {labels.map((label, labelIndex) => (
                      <div key={labelIndex}>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="number"
                          value={dataset.data[labelIndex]}
                          onChange={(e) =>
                            handleDataChange(datasetIndex, labelIndex, e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <InteractiveChartLibrary
        data={chartData}
        chartType={chartType}
        title={title}
        height={400}
        showLegend={true}
        showGrid={true}
        animated={true}
      />
    </div>
  );
};
