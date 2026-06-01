'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Eraser,
  Globe,
  ShieldCheck,
  Trash2,
  Maximize2,
  Search,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from 'recharts';

import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { clearTrendHistory, type PerformanceTrendPoint } from '@/utils/performanceUtils';
import { CoreWebVitals } from './CoreWebVitals';
import { OptimizationSuggestions } from './OptimizationSuggestions';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { useInternationalization } from '@/hooks/useInternationalization';
import { translateWithFallback } from '@/components/dashboard/dashboardI18n';

const VITAL_NAMES = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;

function buildSeries(points: PerformanceTrendPoint[], name: string) {
  return points
    .filter((p) => p.name === name)
    .map((p, i) => ({
      i: i + 1,
      time: new Date(p.t).toLocaleTimeString(),
      value: p.value,
    }));
}

function formatTick(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}`;
}

/**
 * Full-screen performance monitoring: Core Web Vitals, alerts, suggestions, and trend charts.
 * Features advanced Zoom Integration (Presets + Drag selection).
 */
export const PerformanceDashboard: React.FC = () => {
  const { t } = useInternationalization();
  const { metrics, alerts, suggestions, trend, clearAlerts, refreshTrendFromStorage } =
    usePerformanceMonitoring();

  // Zoom States per Vital
  const [presets, setPresets] = useState<Record<string, 'all' | 10 | 25 | 50>>({});
  const [zoomRanges, setZoomRanges] = useState<
    Record<string, { left: number; right: number } | null>
  >({});
  const [refAreas, setRefAreas] = useState<Record<string, { start: number; end: number } | null>>(
    {},
  );

  const isAnalyticsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_PERF_ANALYTICS === 'true' ||
    process.env.NODE_ENV === 'production';

  const seriesByVital = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildSeries>> = {};
    for (const n of VITAL_NAMES) {
      map[n] = buildSeries(trend, n);
    }
    return map;
  }, [trend]);

  const handleClearTrends = () => {
    clearTrendHistory();
    setZoomRanges({});
    setRefAreas({});
    setPresets({});
    refreshTrendFromStorage();
  };

  // Drag selection handlers
  const handleMouseDown = (name: string, e: any) => {
    if (e && e.activeLabel) {
      const activeLabelNum = Number(e.activeLabel);
      if (!isNaN(activeLabelNum)) {
        setRefAreas((prev) => ({
          ...prev,
          [name]: { start: activeLabelNum, end: activeLabelNum },
        }));
      }
    }
  };

  const handleMouseMove = (name: string, e: any) => {
    const currentRef = refAreas[name];
    if (currentRef && e && e.activeLabel) {
      const activeLabelNum = Number(e.activeLabel);
      if (!isNaN(activeLabelNum)) {
        setRefAreas((prev) => ({
          ...prev,
          [name]: { ...currentRef, end: activeLabelNum },
        }));
      }
    }
  };

  const handleMouseUp = (name: string) => {
    const currentRef = refAreas[name];
    setRefAreas((prev) => ({ ...prev, [name]: null }));

    if (currentRef && currentRef.start !== currentRef.end) {
      let { start, end } = currentRef;
      if (start > end) {
        const temp = start;
        start = end;
        end = temp;
      }
      setZoomRanges((prev) => ({
        ...prev,
        [name]: { left: start, right: end },
      }));
    }
  };

  const handleResetZoom = (name: string) => {
    setZoomRanges((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  const handleApplyPreset = (name: string, val: 'all' | 10 | 25 | 50) => {
    setPresets((prev) => ({
      ...prev,
      [name]: val,
    }));
    // Reset drag zoom on preset change to avoid out of bounds
    setZoomRanges((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" role="main">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Breadcrumbs
              items={[
                { label: t('navigation.home'), href: '/' },
                {
                  label: translateWithFallback(
                    t,
                    'performance.dashboard.title',
                    'Performance Dashboard',
                  ),
                  current: true,
                },
              ]}
              ariaLabel={translateWithFallback(
                t,
                'performance.dashboard.navigation',
                'Performance dashboard navigation',
              )}
              className="mb-2"
            />
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" aria-hidden />
              {translateWithFallback(t, 'performance.dashboard.title', 'Performance dashboard')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {translateWithFallback(
                t,
                'performance.dashboard.subtitle',
                'Core Web Vitals, recent alerts, and session trend samples (stored in sessionStorage).',
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearTrends}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Eraser className="w-4 h-4" aria-hidden />
            {translateWithFallback(t, 'performance.dashboard.clearHistory', 'Clear trend history')}
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <CoreWebVitals metrics={metrics} />
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-500" aria-hidden />
              {translateWithFallback(
                t,
                'performance.dashboard.statusPanel.heading',
                'Analytics Status',
              )}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {translateWithFallback(
                    t,
                    'performance.dashboard.statusPanel.statusLabel',
                    'Status',
                  )}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isAnalyticsEnabled
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {isAnalyticsEnabled ? <ShieldCheck className="w-3 h-3" /> : null}
                  {isAnalyticsEnabled
                    ? translateWithFallback(t, 'performance.dashboard.statusPanel.active', 'Active')
                    : translateWithFallback(
                        t,
                        'performance.dashboard.statusPanel.disabled',
                        'Disabled (Dev)',
                      )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {translateWithFallback(
                    t,
                    'performance.dashboard.statusPanel.endpoint',
                    'Endpoint',
                  )}
                </span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                  /api/performance/vitals
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  <Globe className="inline w-3 h-3 mr-1" />
                  {translateWithFallback(
                    t,
                    'performance.dashboard.statusPanel.simulated',
                    'Simulated Global Average (7d)',
                  )}
                </p>
                <div className="space-y-1.5">
                  {[
                    { name: 'LCP', val: '1.2s', status: 'good' },
                    { name: 'CLS', val: '0.04', status: 'good' },
                    { name: 'INP', val: '180ms', status: 'good' },
                  ].map((m) => (
                    <div key={m.name} className="flex justify-between text-[11px]">
                      <span className="text-gray-600 dark:text-gray-400">{m.name}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {m.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section aria-labelledby="perf-alerts-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="perf-alerts-heading" className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden />
              {translateWithFallback(t, 'performance.dashboard.alertsPanel.heading', 'Alerts')}
            </h2>
            {alerts.length > 0 ? (
              <button
                type="button"
                onClick={clearAlerts}
                className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
                {translateWithFallback(
                  t,
                  'performance.dashboard.alertsPanel.clearList',
                  'Clear list',
                )}
              </button>
            ) : null}
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {translateWithFallback(
                t,
                'performance.dashboard.alertsPanel.empty',
                'No degradation alerts in this session.',
              )}
            </p>
          ) : (
            <ul className="space-y-2" aria-live="polite">
              {alerts.map((a) => {
                const formattedValue = a.message.match(/\(([^)]+)\)/)?.[1] || '';
                const translatedMessage = translateWithFallback(
                  t,
                  `performance.telemetry.alerts.${a.severity === 'critical' ? 'poor' : 'warning'}`,
                  a.message,
                  {
                    name: a.metricName,
                    value: formattedValue,
                  },
                );
                return (
                  <li
                    key={a.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      a.severity === 'critical'
                        ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
                    }`}
                  >
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {new Date(a.at).toLocaleTimeString()}
                    </span>
                    <span className="ml-2">{translatedMessage}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <OptimizationSuggestions suggestions={suggestions} />

        <section aria-labelledby="perf-trends-heading">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 id="perf-trends-heading" className="text-sm font-semibold">
                Trends (this tab session)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Drag horizontally to zoom in on a range. Click buttons to filter window sizes.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {VITAL_NAMES.map((name) => {
              const fullSeries = seriesByVital[name];
              const activePreset = presets[name] || 'all';

              // Apply Preset Filter First
              let presetSeries = fullSeries;
              if (activePreset !== 'all') {
                presetSeries = fullSeries.slice(-activePreset);
              }

              // Apply Drag Zoom Range Filter Second
              const activeZoom = zoomRanges[name];
              const displayedData = activeZoom
                ? presetSeries.filter((d) => d.i >= activeZoom.left && d.i <= activeZoom.right)
                : presetSeries;

              const isZoomed = !!activeZoom;

              return (
                <div
                  key={name}
                  className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 transition-all duration-200"
                >
                  {/* Floating Reset Zoom Badge */}
                  {isZoomed && (
                    <button
                      type="button"
                      onClick={() => handleResetZoom(name)}
                      className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md shadow-md transition-colors"
                      aria-label="Reset Zoom to show all samples in preset"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Reset Zoom
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      {name}
                      {isZoomed && (
                        <span className="inline-flex items-center text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                          Zoomed
                        </span>
                      )}
                    </h3>

                    {/* Predefined Duration Presets */}
                    {fullSeries.length >= 2 && (
                      <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-0.5 bg-gray-50 dark:bg-gray-850">
                        {(
                          [
                            { key: 'all', label: 'All' },
                            { key: 10, label: 'L10' },
                            { key: 25, label: 'L25' },
                            { key: 50, label: 'L50' },
                          ] as const
                        ).map((presetItem) => (
                          <button
                            key={presetItem.key}
                            type="button"
                            onClick={() => handleApplyPreset(name, presetItem.key)}
                            className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors ${
                              activePreset === presetItem.key
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                            aria-label={`Show ${presetItem.label} samples`}
                          >
                            {presetItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {fullSeries.length < 2 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                      {translateWithFallback(
                        t,
                        'performance.dashboard.chartPlaceholder',
                        'Not enough samples yet. Interact with the app or reload to collect points.',
                      )}
                    </p>
                  ) : (
                    <div
                      className="h-48 w-full select-none cursor-crosshair"
                      role="img"
                      aria-label={`${name} trend chart showing ${displayedData.length} samples. Drag horizontally to zoom.`}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={displayedData}
                          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                          onMouseDown={(e) => handleMouseDown(name, e)}
                          onMouseMove={(e) => handleMouseMove(name, e)}
                          onMouseUp={() => handleMouseUp(name)}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-200 dark:stroke-gray-700"
                          />
                          <XAxis
                            dataKey="i"
                            tick={{ fontSize: 10 }}
                            label={{
                              value: translateWithFallback(
                                t,
                                'performance.dashboard.xAxisLabel',
                                'Sample #',
                              ),
                              position: 'insideBottom',
                              offset: -4,
                              fontSize: 10,
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => formatTick(name, v as number)}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatTick(name, value), name]}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.time ?? ''}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={displayedData.length <= 25 ? { r: 3 } : false}
                            activeDot={{ r: 5 }}
                            isAnimationActive={false}
                          />

                          {/* Interactive Zoom Reference Selection Area */}
                          {refAreas[name] && (
                            <ReferenceArea
                              x1={refAreas[name]?.start}
                              x2={refAreas[name]?.end}
                              strokeOpacity={0.3}
                              fill="#6366f1"
                              fillOpacity={0.3}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
