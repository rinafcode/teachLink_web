import React, { useState, useRef, useEffect } from 'react';
import { Widget, ChartConfig, Metric } from '@/types/analytics';

interface CustomWidgetBuilderProps {
  availableCharts: ChartConfig[];
  availableMetrics: Metric[];
  currentWidgets: Widget[];
  onWidgetsUpdate: (widgets: Widget[]) => void;
  className?: string;
}

const CustomWidgetBuilder: React.FC<CustomWidgetBuilderProps> = ({
  availableCharts,
  availableMetrics,
  currentWidgets,
  onWidgetsUpdate,
  className = ''
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWidget, setNewWidget] = useState<Partial<Omit<Widget, 'id'>>>({
    title: '',
    type: 'metric',
    size: 'medium',
    position: { x: 0, y: 0 },
    config: {}
  });
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingFromPalette, setDraggingFromPalette] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridSize = 100; // 100px per grid cell

  const handleCreateWidget = () => {
    if (!newWidget.title || !newWidget.type) return;

    const widgetToCreate: Widget = {
      id: `widget_${Date.now()}`,
      title: newWidget.title!,
      type: newWidget.type!,
      size: newWidget.size!,
      position: newWidget.position!,
      config: newWidget.config || {},
      chartId: newWidget.type === 'chart' ? newWidget.chartId : undefined,
      metricId: newWidget.type === 'metric' ? newWidget.metricId : undefined
    };

    const updatedWidgets = [...currentWidgets, widgetToCreate];
    onWidgetsUpdate(updatedWidgets);
    setIsCreating(false);
    setNewWidget({
      title: '',
      type: 'metric',
      size: 'medium',
      position: { x: 0, y: 0 },
      config: {}
    });
  };

  const handleDragStart = (e: React.DragEvent, widgetId: string, fromPalette = false) => {
    e.dataTransfer.setData('widgetId', widgetId);
    e.dataTransfer.setData('fromPalette', fromPalette.toString());
    
    if (fromPalette) {
      setDraggingFromPalette(true);
    } else {
      setDraggedWidget(widgetId);
      const widget = currentWidgets.find(w => w.id === widgetId);
      if (widget) {
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidget && !draggingFromPalette) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);

    // Update widget position during drag
    if (draggedWidget) {
      const updatedWidgets = currentWidgets.map(widget => {
        if (widget.id === draggedWidget) {
          return { ...widget, position: { x, y } };
        }
        return widget;
      });
      onWidgetsUpdate(updatedWidgets);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('widgetId');
    const fromPalette = e.dataTransfer.getData('fromPalette') === 'true';
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);

    if (fromPalette && widgetId === 'new-metric') {
      // Create a new metric widget
      const newWidget: Widget = {
        id: `widget_${Date.now()}`,
        title: 'New Metric',
        type: 'metric',
        size: 'small',
        position: { x, y },
        config: {},
        metricId: availableMetrics[0]?.id
      };
      onWidgetsUpdate([...currentWidgets, newWidget]);
    } else if (fromPalette && widgetId === 'new-chart') {
      // Create a new chart widget
      const newWidget: Widget = {
        id: `widget_${Date.now()}`,
        title: 'New Chart',
        type: 'chart',
        size: 'medium',
        position: { x, y },
        config: {},
        chartId: availableCharts[0]?.id
      };
      onWidgetsUpdate([...currentWidgets, newWidget]);
    } else {
      // Move existing widget
      const updatedWidgets = currentWidgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, position: { x, y } };
        }
        return widget;
      });
      onWidgetsUpdate(updatedWidgets);
    }

    setDraggedWidget(null);
    setDraggingFromPalette(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleWidgetDelete = (widgetId: string) => {
    const updatedWidgets = currentWidgets.filter(widget => widget.id !== widgetId);
    onWidgetsUpdate(updatedWidgets);
  };

  const handleWidgetUpdate = (widgetId: string, updates: Partial<Widget>) => {
    const updatedWidgets = currentWidgets.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    onWidgetsUpdate(updatedWidgets);
  };

  const getSizeClasses = (size: Widget['size']) => {
    switch (size) {
      case 'small': return 'w-[100px] h-[100px]';
      case 'medium': return 'w-[200px] h-[200px]';
      case 'large': return 'w-[300px] h-[300px]';
      default: return 'w-[200px] h-[200px]';
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Widget Builder</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isCreating ? 'Cancel' : '+ Add Custom Widget'}
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Create New Widget</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Title
              </label>
              <input
                type="text"
                value={newWidget.title}
                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter widget title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Type
              </label>
              <select
                value={newWidget.type}
                onChange={(e) => setNewWidget({ 
                  ...newWidget, 
                  type: e.target.value as Widget['type'] 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="metric">Metric</option>
                <option value="chart">Chart</option>
                <option value="table">Table</option>
                <option value="list">List</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={newWidget.size}
                onChange={(e) => setNewWidget({ 
                  ...newWidget, 
                  size: e.target.value as Widget['size'] 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small (1x1)</option>
                <option value="medium">Medium (2x2)</option>
                <option value="large">Large (3x3)</option>
              </select>
            </div>

            {newWidget.type === 'chart' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Chart
                </label>
                <select
                  value={newWidget.chartId}
                  onChange={(e) => setNewWidget({ ...newWidget, chartId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a chart</option>
                  {availableCharts.map(chart => (
                    <option key={chart.id} value={chart.id}>
                      {chart.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newWidget.type === 'metric' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Metric
                </label>
                <select
                  value={newWidget.metricId}
                  onChange={(e) => setNewWidget({ ...newWidget, metricId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a metric</option>
                  {availableMetrics.map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWidget}
              disabled={!newWidget.title || !newWidget.type}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Widget
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Widget Palette</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'new-metric', true)}
            className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-move hover:border-blue-500 transition-colors"
          >
            <div className="text-sm font-medium text-gray-800 mb-2">📊 Metric Widget</div>
            <div className="text-xs text-gray-600">Display single metric value</div>
          </div>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'new-chart', true)}
            className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-move hover:border-blue-500 transition-colors"
          >
            <div className="text-sm font-medium text-gray-800 mb-2">📈 Chart Widget</div>
            <div className="text-xs text-gray-600">Interactive chart visualization</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-800 mb-2">📋 Table Widget</div>
            <div className="text-xs text-gray-600">Tabular data display</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-800 mb-2">📝 List Widget</div>
            <div className="text-xs text-gray-600">Scrollable list of items</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Drag widgets from palette</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Drag existing widgets to move</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Dashboard Grid</h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop widgets to rearrange. Grid: 100px x 100px cells.
        </p>
        
        <div
          ref={containerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative min-h-150 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4"
          style={{
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `
          }}
        >
          {/* Render existing widgets */}
          {currentWidgets.map((widget) => (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              className={`absolute bg-white rounded-lg shadow border border-gray-300 p-2 cursor-move hover:border-green-500 hover:shadow-lg transition-all ${getSizeClasses(widget.size)}`}
              style={{
                left: `${widget.position.x * gridSize}px`,
                top: `${widget.position.y * gridSize}px`,
                zIndex: draggedWidget === widget.id ? 1000 : 1
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-700 truncate">
                  {widget.title}
                </h4>
                <button
                  onClick={() => handleWidgetDelete(widget.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                  title="Delete widget"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mb-2">
                Type: {widget.type}
              </div>
              
              <div className="mt-2">
                <input
                  type="text"
                  value={widget.title}
                  onChange={(e) => handleWidgetUpdate(widget.id, { title: e.target.value })}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  placeholder="Edit title"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Drag widgets from the palette to add them to the dashboard</li>
          <li>• Drag existing widgets to reposition them</li>
          <li>• Click on widget titles to edit them</li>
          <li>• Click the ✕ button to remove widgets</li>
          <li>• Widget positions are automatically saved</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomWidgetBuilder;