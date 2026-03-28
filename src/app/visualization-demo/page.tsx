/**
 * Data Visualization Demo Page
 * Showcases all visualization components with sample data
 */

'use client';

import React, { useState } from 'react';
import {
  InteractiveChartLibrary,
  RealTimeDataVisualizer,
  CustomVisualizationBuilder,
  DataExplorationTools,
} from '@/components/visualization';
import { ChartData, generateSampleData } from '@/utils/visualizationUtils';
import { BarChart3, Activity, Wrench, Search } from 'lucide-react';

type DemoTab = 'charts' | 'realtime' | 'builder' | 'exploration';

export default function VisualizationDemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>('charts');

  // Sample data for demonstrations
  const sampleData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Course Completions',
        data: [65, 78, 90, 81, 96, 105, 120],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
      {
        label: 'New Enrollments',
        data: [45, 52, 68, 74, 82, 91, 98],
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        borderColor: '#8b5cf6',
        borderWidth: 2,
      },
    ],
  };

  const explorationData: ChartData = {
    labels: generateSampleData(30, 1, 30).map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Active Users',
        data: generateSampleData(30, 100, 500),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10b981',
      },
      {
        label: 'Page Views',
        data: generateSampleData(30, 500, 2000),
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: '#f59e0b',
      },
    ],
  };

  const tabs = [
    { id: 'charts' as DemoTab, label: 'Chart Library', icon: BarChart3 },
    { id: 'realtime' as DemoTab, label: 'Real-Time', icon: Activity },
    { id: 'builder' as DemoTab, label: 'Chart Builder', icon: Wrench },
    { id: 'exploration' as DemoTab, label: 'Data Exploration', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Data Visualization Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore interactive charts, real-time data updates, and custom visualization tools
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Interactive Chart Library
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Multiple chart types with interactive features and customization options
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveChartLibrary
                  data={sampleData}
                  chartType="line"
                  title="Line Chart"
                  showLegend={true}
                  showGrid={true}
                  animated={true}
                />

                <InteractiveChartLibrary
                  data={sampleData}
                  chartType="bar"
                  title="Bar Chart"
                  showLegend={true}
                  showGrid={true}
                  animated={true}
                />

                <InteractiveChartLibrary
                  data={sampleData}
                  chartType="area"
                  title="Area Chart"
                  showLegend={true}
                  showGrid={true}
                  animated={true}
                />

                <InteractiveChartLibrary
                  data={sampleData}
                  chartType="pie"
                  title="Pie Chart"
                  showLegend={true}
                  animated={true}
                />
              </div>
            </div>
          )}

          {activeTab === 'realtime' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Real-Time Data Visualization
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Live data updates with WebSocket support and automatic refresh
                </p>
              </div>

              <RealTimeDataVisualizer
                chartType="line"
                title="Live User Activity"
                updateInterval={2000}
                maxDataPoints={20}
              />

              <RealTimeDataVisualizer
                chartType="bar"
                title="Real-Time Metrics"
                updateInterval={3000}
                maxDataPoints={15}
              />
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Custom Visualization Builder
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your own charts with custom data, labels, and styling
                </p>
              </div>

              <CustomVisualizationBuilder
                onSave={(config) => {
                  console.log('Saved chart configuration:', config);
                  alert('Chart configuration saved! Check console for details.');
                }}
              />
            </div>
          )}

          {activeTab === 'exploration' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Data Exploration Tools
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Interactive analysis with filtering, statistics, and export capabilities
                </p>
              </div>

              <DataExplorationTools data={explorationData} title="Analytics Dashboard" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600 dark:text-gray-400">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Multiple chart types (Line, Bar, Area, Pie, Scatter, Radar)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Real-time data updates with WebSocket support</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Custom chart builder with drag-and-drop</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Interactive data exploration and filtering</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Statistical analysis (mean, median, std dev)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Export to CSV and JSON formats</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Responsive design with dark mode support</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Smooth animations and transitions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
