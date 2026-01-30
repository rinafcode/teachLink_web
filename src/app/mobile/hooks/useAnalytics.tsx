import { useState, useEffect, useCallback } from 'react';
import { UserRole, ChartConfig, Metric, DashboardLayout, Widget, ExportOptions } from '@/types/analytics';

export const useAnalytics = (role: UserRole) => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout | null>(null);
  const [realTimeData, setRealTimeData] = useState<Record<string, any>>({});

  // Mock data generation based on role
  const generateRoleBasedData = useCallback(() => {
    const baseMetrics: Metric[] = [
      {
        id: 'total_courses',
        title: 'Total Courses',
        value: role === 'student' ? 5 : role === 'teacher' ? 12 : 45,
        change: 12,
        format: 'number'
      },
      {
        id: 'completion_rate',
        title: 'Completion Rate',
        value: role === 'student' ? 75 : role === 'teacher' ? 82 : 88,
        change: 5,
        format: 'percent'
      },
      {
        id: 'avg_score',
        title: 'Average Score',
        value: role === 'student' ? 85 : role === 'teacher' ? 78 : 92,
        change: 2,
        format: 'number'
      },
      {
        id: 'engagement',
        title: 'Platform Engagement',
        value: role === 'student' ? 65 : role === 'teacher' ? 89 : 94,
        change: 8,
        format: 'percent'
      }
    ];

    const baseCharts: ChartConfig[] = [
      {
        id: 'progress_over_time',
        title: 'Progress Over Time',
        type: 'line',
        data: Array.from({ length: 12 }, (_, i) => ({
          name: `Month ${i + 1}`,
          value: Math.floor(Math.random() * 100),
          target: 80
        })),
        xAxisKey: 'name',
        yAxisKey: 'value',
        color: '#3b82f6'
      },
      {
        id: 'course_performance',
        title: 'Course Performance',
        type: 'bar',
        data: ['Math', 'Science', 'History', 'English', 'Arts'].map(subject => ({
          name: subject,
          value: Math.floor(Math.random() * 100),
          average: 75
        })),
        xAxisKey: 'name',
        yAxisKey: 'value',
        color: '#10b981'
      },
      {
        id: 'time_distribution',
        title: 'Time Distribution',
        type: 'pie',
        data: [
          { name: 'Learning', value: 40, color: '#3b82f6' },
          { name: 'Practice', value: 25, color: '#10b981' },
          { name: 'Assessments', value: 20, color: '#f59e0b' },
          { name: 'Collaboration', value: 15, color: '#8b5cf6' }
        ],
        xAxisKey: 'name',
        yAxisKey: 'value',
        color: '#3b82f6'
      }
    ];

    const defaultWidgets: Widget[] = [
      {
        id: 'metric_total_courses',
        title: 'Total Courses',
        type: 'metric',
        metricId: 'total_courses',
        size: 'small',
        position: { x: 0, y: 0 },
        config: {}
      },
      {
        id: 'metric_completion_rate',
        title: 'Completion Rate',
        type: 'metric',
        metricId: 'completion_rate',
        size: 'small',
        position: { x: 1, y: 0 },
        config: {}
      },
      {
        id: 'chart_progress',
        title: 'Learning Progress',
        type: 'chart',
        chartId: 'progress_over_time',
        size: 'medium',
        position: { x: 0, y: 1 },
        config: { showLegend: true }
      },
      {
        id: 'chart_performance',
        title: 'Course Performance',
        type: 'chart',
        chartId: 'course_performance',
        size: 'medium',
        position: { x: 2, y: 1 },
        config: { showLegend: true }
      }
    ];

    setMetrics(baseMetrics);
    setCharts(baseCharts);
    setDashboardLayout({
      id: 'default',
      name: `${role} Dashboard`,
      role,
      widgets: defaultWidgets,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }, [role]);

  // Real-time updates simulation
  useEffect(() => {
    generateRoleBasedData();
    setIsLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 1000),
        newActivities: Math.floor(Math.random() * 50)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [role, generateRoleBasedData]);

  const updateWidgetLayout = useCallback((widgets: Widget[]) => {
    setDashboardLayout(prev => prev ? {
      ...prev,
      widgets,
      updatedAt: new Date()
    } : null);
  }, []);

  const exportData = useCallback(async (options: ExportOptions) => {
    // This would be implemented with actual export logic
    console.log('Exporting with options:', options);
    return { success: true, message: 'Export started' };
  }, []);

  const getChartById = useCallback((id: string) => {
    return charts.find(chart => chart.id === id);
  }, [charts]);

  const getMetricById = useCallback((id: string) => {
    return metrics.find(metric => metric.id === id);
  }, [metrics]);

  return {
    isLoading,
    metrics,
    charts,
    dashboardLayout,
    realTimeData,
    updateWidgetLayout,
    exportData,
    getChartById,
    getMetricById
  };
};