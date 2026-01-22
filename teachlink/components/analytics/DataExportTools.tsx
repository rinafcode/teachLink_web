import React, { useState } from 'react';
import { ExportFormat, ExportOptions } from '@/types/analytics';
import { format } from 'date-fns';

interface DataExportToolsProps {
  onExport: (options: ExportOptions) => Promise<{ success: boolean; message: string }>;
  availableDataSets: string[];
  className?: string;
}

const DataExportTools: React.FC<DataExportToolsProps> = ({
  onExport,
  availableDataSets,
  className = ''
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeCharts: false,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    filters: {}
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [selectedDataSets, setSelectedDataSets] = useState<string[]>(availableDataSets);

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);

    try {
      const result = await onExport({
        ...exportOptions,
        filters: {
          ...exportOptions.filters,
          dataSets: selectedDataSets
        }
      });

      if (result.success) {
        setExportMessage(`Export successful: ${result.message}`);
        
        // In a real app, this would trigger a file download
        // For now, we'll simulate it
        const blob = new Blob(['Simulated export data'], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}.${exportOptions.format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setExportMessage(`Export failed: ${result.message}`);
      }
    } catch (error) {
      setExportMessage(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setExportOptions(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [type]: date
        }
      }));
    }
  };

  const toggleDataSet = (dataSet: string) => {
    setSelectedDataSets(prev =>
      prev.includes(dataSet)
        ? prev.filter(ds => ds !== dataSet)
        : [...prev, dataSet]
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Export</h2>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Export Format</h3>
          <div className="flex gap-4">
            {(['csv', 'excel', 'pdf'] as ExportFormat[]).map(format => (
              <label
                key={format}
                className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  exportOptions.format === format
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={format}
                  checked={exportOptions.format === format}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    format: e.target.value as ExportFormat
                  })}
                  className="sr-only"
                />
                <span className="font-medium">{format.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={format(exportOptions.dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={format(exportOptions.dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Data Sets */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Data Sets to Include</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableDataSets.map(dataSet => (
              <label
                key={dataSet}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDataSets.includes(dataSet)
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDataSets.includes(dataSet)}
                  onChange={() => toggleDataSet(dataSet)}
                  className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium capitalize">
                  {dataSet.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3">
            <button
              onClick={() => setSelectedDataSets(availableDataSets)}
              className="text-sm text-blue-600 hover:text-blue-800 mr-4"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedDataSets([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Additional Options */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Additional Options</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  includeCharts: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">Include chart images in PDF exports</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!exportOptions.filters.includeRawData}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  filters: {
                    ...exportOptions.filters,
                    includeRawData: e.target.checked
                  }
                })}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">Include raw data (for CSV/Excel)</span>
            </label>
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {exportMessage && (
                <div className={`text-sm ${
                  exportMessage.includes('success') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {exportMessage}
                </div>
              )}
            </div>
            
            <button
              onClick={handleExport}
              disabled={isExporting || selectedDataSets.length === 0}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? 'Exporting...' : `Export as ${exportOptions.format.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Format Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Export Format Details:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>CSV</strong>: Comma-separated values, ideal for spreadsheet import</li>
            <li>• <strong>Excel</strong>: Microsoft Excel format with multiple sheets</li>
            <li>• <strong>PDF</strong>: Portable Document Format with charts and formatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataExportTools;