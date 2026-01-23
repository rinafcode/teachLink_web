import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { UserRole, Widget } from '@/types/analytics';
import InteractiveCharts from './InteractiveCharts';
import CustomWidgetBuilder from './CustomWidgetBuilder';
import DataExportTools from './DataExportTools';

interface AnalyticsDashboardProps {
  role: UserRole;
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  role, 
  className = '' 
}) => {
  const {
    isLoading,
    metrics,
    charts,
    dashboardLayout,
    realTimeData,
    updateWidgetLayout,
    exportData,
    getChartById,
    getMetricById
  } = useAnalytics(role);

  const [activeView, setActiveView] = useState<'dashboard' | 'builder' | 'export'>('dashboard');
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [currentWidgets, setCurrentWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    if (dashboardLayout?.widgets) {
      setCurrentWidgets(dashboardLayout.widgets);
    }
  }, [dashboardLayout]);

  if (isLoading || !dashboardLayout) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleDrillDown = (dataPoint: any) => {
    setSelectedDataPoint(dataPoint);
    alert(`Drill down to: ${JSON.stringify(dataPoint, null, 2)}`);
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    console.log('Filters changed:', filters);
  };

  const handleWidgetsUpdate = (widgets: Widget[]) => {
    setCurrentWidgets(widgets);
    updateWidgetLayout(widgets);
  };

  const renderMetricWidget = (widget: Widget) => {
    const metric = getMetricById(widget.metricId || '');
    if (!metric) return null;

    const formatValue = (value: number | string, format: string) => {
      switch (format) {
        case 'percent':
          return `${value}%`;
        case 'currency':
          return `$${Number(value).toFixed(2)}`;
        case 'duration':
          return `${value} hrs`;
        default:
          return value;
      }
    };

    const isPositive = metric.change >= 0;

    return (
      <div className="bg-white rounded-lg shadow p-4 h-full">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-gray-600">{widget.title || metric.title}</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isPositive ? '+' : ''}{metric.change}%
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-800 mb-1">
          {formatValue(metric.value, metric.format)}
        </div>
        {metric.description && (
          <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
        )}
        <div className="mt-4 text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    );
  };

  const renderChartWidget = (widget: Widget) => {
    const chart = getChartById(widget.chartId || '');
    if (!chart) return null;

    return (
      <InteractiveCharts
        chart={chart}
        onDrillDown={handleDrillDown}
        onFilterChange={handleFilterChange}
        className="h-full"
      />
    );
  };

  const renderWidget = (widget: Widget) => {
    const sizeClasses = {
      small: 'col-span-1 row-span-1',
      medium: 'col-span-2 row-span-2',
      large: 'col-span-3 row-span-3'
    }[widget.size];

    return (
      <div
        key={widget.id}
        className={`${sizeClasses} group relative`}
        style={{
          gridColumnStart: widget.position.x + 1,
          gridRowStart: widget.position.y + 1
        }}
      >
        {widget.type === 'chart' && renderChartWidget(widget)}
        {widget.type === 'metric' && renderMetricWidget(widget)}
        {widget.type === 'table' && (
          <div className="bg-white rounded-lg shadow p-4 h-full">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{widget.title}</h4>
            <div className="text-sm">
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="font-medium">Student</div>
                <div className="font-medium">Score</div>
                <div className="font-medium">Status</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-gray-600">
                <div>John Doe</div>
                <div>95%</div>
                <div className="text-green-600">Completed</div>
              </div>
            </div>
          </div>
        )}
        {widget.type === 'list' && (
          <div className="bg-white rounded-lg shadow p-4 h-full">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{widget.title}</h4>
            <div className="space-y-2">
              {['Task 1', 'Task 2', 'Task 3'].map((task, i) => (
                <div key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">{task}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widget controls - visible on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <button
              onClick={() => {
                const newTitle = prompt('New title:', widget.title);
                if (newTitle) {
                  handleWidgetsUpdate(
                    currentWidgets.map(w => 
                      w.id === widget.id ? { ...w, title: newTitle } : w
                    )
                  );
                }
              }}
              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this widget?')) {
                  handleWidgetsUpdate(
                    currentWidgets.filter(w => w.id !== widget.id)
                  );
                }
              }}
              className="p-1 bg-red-100 rounded hover:bg-red-200"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{dashboardLayout.name}</h1>
            <p className="text-gray-600 mt-1">
              Role: <span className="font-medium capitalize">{role}</span>
              {realTimeData.timestamp && (
                <span className="ml-4 text-sm">
                  Last updated: {new Date(realTimeData.timestamp).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {realTimeData.activeUsers || 245} active users
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('builder')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'builder'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Widget Builder
              </button>
              <button
                onClick={() => setActiveView('export')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'export'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {metrics.slice(0, 4).map(metric => (
            <div key={metric.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600">{metric.title}</div>
              <div className="text-xl font-bold text-gray-800 mt-1">
                {metric.format === 'percent' ? `${metric.value}%` : metric.value}
              </div>
              <div className={`text-xs mt-1 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% from last month
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Dashboard Overview</h2>
                <div className="text-sm text-gray-500">
                  Drag widgets to rearrange • Click for details
                </div>
              </div>
              
              {/* Grid container for widgets */}
              <div 
                className="grid grid-cols-1 gap-4 min-h-150 p-4 bg-gray-50 rounded-lg"
                style={{
                  backgroundSize: '100px 100px',
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `
                }}
              >
                {currentWidgets.map(renderWidget)}
                
                {/* Empty state */}
                {currentWidgets.length === 0 && (
                  <div className="col-span-12 flex flex-col items-center justify-center h-100">
                    <div className="text-gray-400 mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No widgets yet</h3>
                    <p className="text-gray-500 mb-4">Add widgets using the Widget Builder</p>
                    <button
                      onClick={() => setActiveView('builder')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Go to Widget Builder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Real-time updates */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Real-time Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="font-medium">{realTimeData.activeUsers || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New Activities</span>
                  <span className="font-medium">{realTimeData.newActivities || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg. Response Time</span>
                  <span className="font-medium">1.2s</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Updates every 5 seconds
              </div>
            </div>

            {/* Drill-down details */}
            {selectedDataPoint && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Selected Data Point</h3>
                  <button
                    onClick={() => setSelectedDataPoint(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(selectedDataPoint).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleDrillDown(selectedDataPoint)}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Detailed Analysis
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveView('builder')}
                  className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Customize Dashboard
                </button>
                <button
                  onClick={() => setActiveView('export')}
                  className="w-full bg-transparent border-2 border-white text-white py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'builder' && (
        <CustomWidgetBuilder
          availableCharts={charts}
          availableMetrics={metrics}
          currentWidgets={currentWidgets}
          onWidgetsUpdate={handleWidgetsUpdate}
        />
      )}

      {activeView === 'export' && (
        <DataExportTools
          onExport={exportData}
          availableDataSets={[
            'user_metrics',
            'course_performance',
            'engagement_data',
            'progress_history',
            'assessment_results',
            'time_spent_data'
          ]}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;  