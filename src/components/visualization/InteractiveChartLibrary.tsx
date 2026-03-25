/**
 * InteractiveChartLibrary Component
 * Comprehensive chart library with multiple visualization types
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartData, ChartType, CHART_COLOR_PALETTE } from '@/utils/visualizationUtils';

export interface InteractiveChartLibraryProps {
  data: ChartData;
  chartType: ChartType;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  onDataPointClick?: (data: any) => void;
  className?: string;
}

export const InteractiveChartLibrary: React.FC<InteractiveChartLibraryProps> = ({
  data,
  chartType,
  title,
  height = 400,
  showLegend = true,
  showGrid = true,
  animated = true,
  onDataPointClick,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Transform data for recharts format
  const transformedData = data.labels.map((label, index) => {
    const point: any = { name: label };
    data.datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index];
    });
    return point;
  });

  // Transform data for pie/doughnut charts
  const pieData = data.datasets[0]?.data.map((value, index) => ({
    name: data.labels[index],
    value,
  })) || [];

  const handleClick = (data: any, index: number) => {
    setActiveIndex(index);
    onDataPointClick?.(data);
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={transformedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, onClick: handleClick }}
                isAnimationActive={animated}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={transformedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={dataset.backgroundColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                onClick={handleClick}
                isAnimationActive={animated}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={transformedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Area
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                fill={dataset.backgroundColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                fillOpacity={0.6}
                isAnimationActive={animated}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={chartType === 'doughnut' ? 120 : 140}
              innerRadius={chartType === 'doughnut' ? 60 : 0}
              fill="#8884d8"
              dataKey="value"
              onClick={handleClick}
              isAnimationActive={animated}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Scatter
                key={dataset.label}
                name={dataset.label}
                data={transformedData}
                fill={dataset.backgroundColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                isAnimationActive={animated}
              />
            ))}
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart data={transformedData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Radar
                key={dataset.label}
                name={dataset.label}
                dataKey={dataset.label}
                stroke={dataset.borderColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                fill={dataset.backgroundColor || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                fillOpacity={0.6}
                isAnimationActive={animated}
              />
            ))}
          </RadarChart>
        );

      default:
        return <div className="text-center text-gray-500">Unsupported chart type</div>;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
      {activeIndex !== null && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Selected: {data.labels[activeIndex]}
        </div>
      )}
    </div>
  );
};
