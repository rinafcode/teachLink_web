import React, { useState } from "react";
import { ChartConfig, ChartType, ChartDataPoint } from "@/types/analytics";

interface InteractiveChartsProps {
  chart: ChartConfig;
  onDrillDown?: (dataPoint: ChartDataPoint) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  className?: string;
}

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  chart,
  onDrillDown,
  onFilterChange,
  className = "",
}) => {
  const [selectedData, setSelectedData] = useState<ChartDataPoint | null>(null);
  const [hoveredData, setHoveredData] = useState<ChartDataPoint | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const handleDrillDown = (dataPoint: ChartDataPoint) => {
    setSelectedData(dataPoint);
    if (onDrillDown) {
      onDrillDown(dataPoint);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setCategoryFilter("");
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleExport = () => {
    // Create CSV data
    const headers = [chart.xAxisKey, chart.yAxisKey, ...Object.keys(chart.data[0] || {}).filter(key => key !== chart.xAxisKey && key !== chart.yAxisKey)];
    const csvData = [
      headers.join(','),
      ...chart.data.map(row => 
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chart.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case "percent":
        return `${value}%`;
      case "currency":
        return `$${value.toFixed(2)}`;
      default:
        return value.toString();
    }
  };

  // Get unique categories from chart data
  const uniqueCategories = Array.from(new Set(chart.data.map(item => item.category).filter(Boolean)));

  // Filter data based on active filters
  const getFilteredData = () => {
    let filtered = [...chart.data];
    
    // Apply time range filter
    if (timeRange === "day") {
      filtered = filtered.slice(-7); 
    } else if (timeRange === "week") {
      filtered = filtered.slice(-4); 
    } else if (timeRange === "month") {
      filtered = filtered.slice(-12); 
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Apply value range filter
    if (filters.minValue !== undefined) {
      filtered = filtered.filter(item => item.value >= filters.minValue);
    }
    if (filters.maxValue !== undefined) {
      filtered = filtered.filter(item => item.value <= filters.maxValue);
    }
    
    return filtered;
  };

  const filteredData = getFilteredData();

  const renderChart = () => {
    const dataToRender = filteredData.length > 0 ? filteredData : chart.data;

    switch (chart.type) {
      case "bar":
        return renderBarChart(dataToRender);
      case "line":
        return renderLineChart(dataToRender);
      case "pie":
        return renderPieChart(dataToRender);
      case "area":
        return renderAreaChart(dataToRender);
      case "scatter":
        return renderScatterChart(dataToRender);
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const renderBarChart = (data: ChartDataPoint[]) => {
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
      <div className="space-y-2">
        <div className="flex items-end h-48 gap-1">
          {data.map((point, index) => {
            const height = (point.value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredData(point)}
                onMouseLeave={() => setHoveredData(null)}
                onClick={() => {
                  setSelectedData(point);
                  handleDrillDown(point);
                }}
              >
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={`w-3/4 mx-auto rounded-t-lg transition-all duration-300 group-hover:w-full ${
                      selectedData?.name === point.name
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : ""
                    }`}
                    style={{
                      height: `${height}%`,
                      backgroundColor: point.color || chart.color,
                      opacity: hoveredData?.name === point.name ? 0.8 : 1,
                    }}
                  />
                </div>
                <div className="text-xs mt-2 text-gray-600 truncate w-full text-center">
                  {point[chart.xAxisKey]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = (data: ChartDataPoint[]) => {
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue;

    return (
      <div className="relative h-48">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke={chart.color}
            strokeWidth="2"
            points={data
              .map((point, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((point.value - minValue) / range) * 100;
                return `${x},${y}`;
              })
              .join(" ")}
          />
          {data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={point.color || chart.color}
                className="cursor-pointer hover:r-4 transition-all"
                onMouseEnter={() => setHoveredData(point)}
                onMouseLeave={() => setHoveredData(null)}
                onClick={() => {
                  setSelectedData(point);
                  handleDrillDown(point);
                }}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const renderPieChart = (data: ChartDataPoint[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;

    return (
      <div className="relative h-48 w-48 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((slice, i) => {
            const percent = (slice.value / total) * 100;
            const startAngle = cumulativePercent * 3.6;
            cumulativePercent += percent;
            const endAngle = cumulativePercent * 3.6;

            // Convert angles to radians
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            // Calculate coordinates
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArcFlag = percent > 50 ? 1 : 0;

            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`,
            ].join(" ");

            return (
              <path
                key={i}
                d={pathData}
                fill={slice.color || chart.color}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onMouseEnter={() => setHoveredData(slice)}
                onMouseLeave={() => setHoveredData(null)}
                onClick={() => {
                  setSelectedData(slice);
                  handleDrillDown(slice);
                }}
              />
            );
          })}
          <circle cx="50" cy="50" r="20" fill="white" />
        </svg>
      </div>
    );
  };

  const renderAreaChart = (data: ChartDataPoint[]) => {
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue;

    const areaPoints = data
      .map((point, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="relative h-48">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chart.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={chart.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,100 ${areaPoints} 100,100`}
            fill="url(#areaGradient)"
          />
          <polyline
            fill="none"
            stroke={chart.color}
            strokeWidth="2"
            points={areaPoints}
          />
        </svg>
      </div>
    );
  };

  const renderScatterChart = (data: ChartDataPoint[]) => {
    const xValues = data.map((d) => d[chart.xAxisKey]);
    const yValues = data.map((d) => d[chart.yAxisKey]);

    return (
      <div className="h-48">
        <div className="relative w-full h-full border-l border-b border-gray-300">
          {data.map((point, i) => {
            const xPercent =
              ((point[chart.xAxisKey] - Math.min(...xValues)) /
                (Math.max(...xValues) - Math.min(...xValues))) *
                90 +
              5;
            const yPercent =
              100 -
              ((point[chart.yAxisKey] - Math.min(...yValues)) /
                (Math.max(...yValues) - Math.min(...yValues))) *
                90 -
              5;

            return (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  backgroundColor: point.color || chart.color,
                }}
                onMouseEnter={() => setHoveredData(point)}
                onMouseLeave={() => setHoveredData(null)}
                onClick={() => {
                  setSelectedData(point);
                  handleDrillDown(point);
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{chart.title}</h3>
        <div className="flex gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Filter
            </button>
            
            {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Range
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                
                {uniqueCategories.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Categories</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minValue || ''}
                      onChange={(e) => handleFilterChange('minValue', e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxValue || ''}
                      onChange={(e) => handleFilterChange('maxValue', e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleExport}
            className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      <div className="mb-4">
        {chart.description && (
          <p className="text-sm text-gray-600">{chart.description}</p>
        )}
        
        {/* Active filters indicator */}
        {(Object.keys(filters).length > 0 || categoryFilter || timeRange !== "month") && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {timeRange !== "month" && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {timeRange}
              </span>
            )}
            {categoryFilter && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {categoryFilter}
              </span>
            )}
            {filters.minValue !== undefined && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Min: {filters.minValue}
              </span>
            )}
            {filters.maxValue !== undefined && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Max: {filters.maxValue}
              </span>
            )}
          </div>
        )}
      </div>

      {renderChart()}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div>
            {hoveredData ? (
              <span className="text-gray-700">
                {hoveredData[chart.xAxisKey]}: {formatValue(hoveredData.value)}
                {hoveredData.category && ` (${hoveredData.category})`}
              </span>
            ) : selectedData ? (
              <span className="text-gray-700">
                Selected: {selectedData[chart.xAxisKey]} ={" "}
                {formatValue(selectedData.value)}
                {selectedData.category && ` (${selectedData.category})`}
              </span>
            ) : (
              <span className="text-gray-500">Hover or click for details</span>
            )}
          </div>
          <div className="text-gray-500">
            {filteredData.length} of {chart.data.length} data points
            {filteredData.length !== chart.data.length && (
              <span className="text-blue-600 ml-2">(filtered)</span>
            )}
          </div>
        </div>
      </div>

      {selectedData && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-blue-800">
                Drill down available
              </span>
              <div className="text-xs text-blue-600 mt-1">
                Click below to view detailed analysis
              </div>
            </div>
            <button
              onClick={() => handleDrillDown(selectedData)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
            >
              View details →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCharts;