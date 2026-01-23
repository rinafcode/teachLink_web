'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Plus, Grid3X3, Calendar } from 'lucide-react';
import { ProgressSummaryWidget } from './widgets/ProgressSummaryWidget';
import { UpcomingDeadlinesWidget } from './widgets/UpcomingDeadlinesWidget';
import { RecommendedCoursesWidget } from './widgets/RecommendedCoursesWidget';
import { LearningStreakWidget } from './widgets/LearningStreakWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { RecentSalesWidget } from './widgets/RecentSalesWidget';
import { useDashboardWidgets } from '../../hooks/useDashboardWidgets';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  isCollapsed: boolean;
  settings: Record<string, any>;
}

interface DashboardGridProps {
  widgets?: Widget[];
  onWidgetChange?: (widgets: Widget[]) => void;
}

// Sortable wrapper for grid items
const SortableItem: React.FC<{ id: string; children: React.ReactNode; }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab'
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets: initialWidgets = [],
  onWidgetChange
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('Last 30 days');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { saveWidgetLayout, loadWidgetLayout } = useDashboardWidgets();

  // Load saved layout on mount
  useEffect(() => {
    try {
      const savedLayout = loadWidgetLayout();
      if (Array.isArray(savedLayout) && savedLayout.length > 0) {
        setWidgets(savedLayout);
      } else if (initialWidgets.length > 0) {
        setWidgets(initialWidgets);
      }
    } catch (error) {
      console.error('Error loading widget layout', error);
      if (initialWidgets.length > 0) setWidgets(initialWidgets);
    }
  }, [initialWidgets, loadWidgetLayout]);

  // Save layout when widgets change
  useEffect(() => {
    try {
      saveWidgetLayout(widgets);
      onWidgetChange?.(widgets);
    } catch (error) {
      console.error('Error saving widget layout', error);
    }
  }, [widgets, saveWidgetLayout, onWidgetChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active?.id || !over?.id) return; // validate

    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        const reordered = arrayMove(items, oldIndex, newIndex).map((w, idx) => ({ ...w, position: idx }));
        return reordered;
      });
    }
  };

  const toggleWidgetCollapse = (widgetId: string) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, isCollapsed: !widget.isCollapsed }
        : widget
    ));
  };

  const updateWidgetSettings = (widgetId: string, settings: Record<string, any>) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, settings: { ...widget.settings, ...settings } }
        : widget
    ));
  };

  const updateWidgetTitle = (widgetId: string, title: string) => {
    const trimmed = (title ?? '').trim();
    if (!trimmed) return; // simple validation
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, title: trimmed }
        : widget
    ));
  };

  const changeWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    if (!['small', 'medium', 'large'].includes(size)) return; // validate
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, size }
        : widget
    ));
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId).map((w, idx) => ({ ...w, position: idx })));
  };

  const addWidget = (type: string, title: string) => {
    const trimmedTitle = (title ?? '').trim();
    if (!trimmedTitle) return;
    const validTypes = ['progress-summary', 'upcoming-deadlines', 'recommended-courses', 'learning-streak', 'recent-activity', 'recent-sales'];
    if (!validTypes.includes(type)) return;
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      title: trimmedTitle,
      size: 'medium',
      position: widgets.length,
      isCollapsed: false,
      settings: {}
    };
    setWidgets(prev => [...prev, newWidget]);
    setShowAddWidget(false);
  };

  const getWidgetComponent = (widget: Widget) => {
    const commonProps = {
      key: widget.id,
      id: widget.id,
      title: widget.title,
      isCollapsed: widget.isCollapsed,
      settings: widget.settings,
      onToggleCollapse: () => toggleWidgetCollapse(widget.id),
      onUpdateSettings: (settings: Record<string, any>) => updateWidgetSettings(widget.id, settings),
      onRemove: () => removeWidget(widget.id),
      size: widget.size as 'small' | 'medium' | 'large',
      onChangeSize: (size: 'small' | 'medium' | 'large') => changeWidgetSize(widget.id, size),
      onUpdateTitle: (newTitle: string) => updateWidgetTitle(widget.id, newTitle)
    } as any;

    switch (widget.type) {
      case 'progress-summary':
        return <ProgressSummaryWidget {...commonProps} />;
      case 'upcoming-deadlines':
        return <UpcomingDeadlinesWidget {...commonProps} />;
      case 'recommended-courses':
        return <RecommendedCoursesWidget {...commonProps} />;
      case 'learning-streak':
        return <LearningStreakWidget {...commonProps} />;
      case 'recent-activity':
        return <RecentActivityWidget {...commonProps} />;
      case 'recent-sales':
        return <RecentSalesWidget {...commonProps} />;
      default:
        return <div>Unknown widget type: {widget.type}</div>;
    }
  };

  const getGridCols = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-2';
    }
  };

  // Separate widgets by type for layout organization
  const summaryWidgets = widgets.filter(w => w.type === 'progress-summary' && w.size === 'small');
  const otherWidgets = widgets.filter(w => !(w.type === 'progress-summary' && w.size === 'small'));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your learning experience</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Widget</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex items-center justify-end">
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Calendar size={16} />
            <span>{dateRange}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'courses', label: 'Courses' },
              { id: 'students', label: 'Students' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Dashboard Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Layout
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Grid</option>
                      <option>Masonry</option>
                      <option>List</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Refresh Rate
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>30 seconds</option>
                      <option>1 minute</option>
                      <option>5 minutes</option>
                      <option>Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Auto</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Widget Modal */}
        <AnimatePresence>
          {showAddWidget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowAddWidget(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Add Widget</h3>
                <div className="space-y-3">
                  {[
                    { type: 'progress-summary', title: 'Progress Summary', icon: '📊' },
                    { type: 'recent-sales', title: 'Recent Sales', icon: '💰' },
                    { type: 'recent-activity', title: 'Recent Activity', icon: '📝' },
                    { type: 'upcoming-deadlines', title: 'Upcoming Schedule', icon: '⏰' },
                    { type: 'recommended-courses', title: 'Recommended Courses', icon: '🎯' },
                    { type: 'learning-streak', title: 'Learning Streak', icon: '🔥' }
                  ].map((widget) => (
                    <button
                      key={widget.type}
                      onClick={() => addWidget(widget.type, widget.title)}
                      className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                    >
                      <span className="text-2xl">{widget.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-50">{widget.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="space-y-6">
              {/* Summary Stats Row - 4 columns */}
              {summaryWidgets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {summaryWidgets.map((widget) => (
                    <SortableItem key={widget.id} id={widget.id}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        {getWidgetComponent(widget)}
                      </motion.div>
                    </SortableItem>
                  ))}
                </div>
              )}

              {/* Two Column Layout for Recent Sales and Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {otherWidgets
                  .filter(w => w.type === 'recent-sales' || w.type === 'recent-activity')
                  .map((widget) => (
                    <SortableItem key={widget.id} id={widget.id}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        {getWidgetComponent(widget)}
                      </motion.div>
                    </SortableItem>
                  ))}
              </div>

              {/* Full Width for Upcoming Schedule */}
              {otherWidgets
                .filter(w => w.type === 'upcoming-deadlines')
                .map((widget) => (
                  <SortableItem key={widget.id} id={widget.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      {getWidgetComponent(widget)}
                    </motion.div>
                  </SortableItem>
                ))}

              {/* Other Widgets in Flexible Grid */}
              {otherWidgets
                .filter(w => w.type !== 'recent-sales' && w.type !== 'recent-activity' && w.type !== 'upcoming-deadlines')
                .length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherWidgets
                    .filter(w => w.type !== 'recent-sales' && w.type !== 'recent-activity' && w.type !== 'upcoming-deadlines')
                    .map((widget) => (
                      <SortableItem key={widget.id} id={widget.id}>
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`${getGridCols(widget.size)}`}
                        >
                          {getWidgetComponent(widget)}
                        </motion.div>
                      </SortableItem>
                    ))}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="text-center py-12">
            <Grid3X3 size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets yet</h3>
            <p className="text-gray-600 mb-4">Add your first widget to get started</p>
            <button
              onClick={() => setShowAddWidget(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Widget
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 