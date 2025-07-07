import { useState, useEffect, useCallback } from 'react';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  isCollapsed: boolean;
  settings: Record<string, any>;
}

export const useDashboardWidgets = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load widget layout from localStorage
  const loadWidgetLayout = useCallback((): Widget[] => {
    try {
      const saved = localStorage.getItem('dashboard-widgets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load widget layout:', error);
    }
    return [];
  }, []);

  // Save widget layout to localStorage
  const saveWidgetLayout = useCallback((widgets: Widget[]) => {
    try {
      localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save widget layout:', error);
    }
  }, []);

  // Initialize widgets on mount
  useEffect(() => {
    const savedWidgets = loadWidgetLayout();
    if (savedWidgets.length > 0) {
      setWidgets(savedWidgets);
    } else {
      // Default widgets
      const defaultWidgets: Widget[] = [
        {
          id: 'progress-summary',
          type: 'progress-summary',
          title: 'My Progress',
          size: 'medium',
          position: 0,
          isCollapsed: false,
          settings: {}
        },
        {
          id: 'upcoming-deadlines',
          type: 'upcoming-deadlines',
          title: 'Upcoming Deadlines',
          size: 'medium',
          position: 1,
          isCollapsed: false,
          settings: {}
        },
        {
          id: 'recommended-courses',
          type: 'recommended-courses',
          title: 'Recommended Courses',
          size: 'large',
          position: 2,
          isCollapsed: false,
          settings: {}
        },
        {
          id: 'learning-streak',
          type: 'learning-streak',
          title: 'Learning Streak',
          size: 'small',
          position: 3,
          isCollapsed: false,
          settings: {}
        }
      ];
      setWidgets(defaultWidgets);
      saveWidgetLayout(defaultWidgets);
    }
    setIsLoading(false);
  }, [loadWidgetLayout, saveWidgetLayout]);

  // Add a new widget
  const addWidget = useCallback((widget: Omit<Widget, 'id' | 'position'>) => {
    const newWidget: Widget = {
      ...widget,
      id: `${widget.type}-${Date.now()}`,
      position: widgets.length
    };
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    saveWidgetLayout(updatedWidgets);
    return newWidget;
  }, [widgets, saveWidgetLayout]);

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    setWidgets(updatedWidgets);
    saveWidgetLayout(updatedWidgets);
  }, [widgets, saveWidgetLayout]);

  // Update widget settings
  const updateWidgetSettings = useCallback((widgetId: string, settings: Record<string, any>) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, settings: { ...widget.settings, ...settings } }
        : widget
    );
    setWidgets(updatedWidgets);
    saveWidgetLayout(updatedWidgets);
  }, [widgets, saveWidgetLayout]);

  // Toggle widget collapse state
  const toggleWidgetCollapse = useCallback((widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, isCollapsed: !widget.isCollapsed }
        : widget
    );
    setWidgets(updatedWidgets);
    saveWidgetLayout(updatedWidgets);
  }, [widgets, saveWidgetLayout]);

  // Reorder widgets
  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    const updatedWidgets = [...widgets];
    const [movedWidget] = updatedWidgets.splice(fromIndex, 1);
    updatedWidgets.splice(toIndex, 0, movedWidget);
    
    // Update positions
    const reorderedWidgets = updatedWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));
    
    setWidgets(reorderedWidgets);
    saveWidgetLayout(reorderedWidgets);
  }, [widgets, saveWidgetLayout]);

  // Change widget size
  const changeWidgetSize = useCallback((widgetId: string, size: 'small' | 'medium' | 'large') => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, size }
        : widget
    );
    setWidgets(updatedWidgets);
    saveWidgetLayout(updatedWidgets);
  }, [widgets, saveWidgetLayout]);

  // Reset to default layout
  const resetToDefault = useCallback(() => {
    const defaultWidgets: Widget[] = [
      {
        id: 'progress-summary',
        type: 'progress-summary',
        title: 'My Progress',
        size: 'medium',
        position: 0,
        isCollapsed: false,
        settings: {}
      },
      {
        id: 'upcoming-deadlines',
        type: 'upcoming-deadlines',
        title: 'Upcoming Deadlines',
        size: 'medium',
        position: 1,
        isCollapsed: false,
        settings: {}
      },
      {
        id: 'recommended-courses',
        type: 'recommended-courses',
        title: 'Recommended Courses',
        size: 'large',
        position: 2,
        isCollapsed: false,
        settings: {}
      },
      {
        id: 'learning-streak',
        type: 'learning-streak',
        title: 'Learning Streak',
        size: 'small',
        position: 3,
        isCollapsed: false,
        settings: {}
      }
    ];
    setWidgets(defaultWidgets);
    saveWidgetLayout(defaultWidgets);
  }, [saveWidgetLayout]);

  // Export widget configuration
  const exportWidgetConfig = useCallback(() => {
    const config = {
      widgets,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [widgets]);

  // Import widget configuration
  const importWidgetConfig = useCallback((config: any) => {
    try {
      if (config.widgets && Array.isArray(config.widgets)) {
        setWidgets(config.widgets);
        saveWidgetLayout(config.widgets);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import widget config:', error);
      return false;
    }
  }, [saveWidgetLayout]);

  return {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    updateWidgetSettings,
    toggleWidgetCollapse,
    reorderWidgets,
    changeWidgetSize,
    resetToDefault,
    exportWidgetConfig,
    importWidgetConfig,
    saveWidgetLayout,
    loadWidgetLayout
  };
}; 