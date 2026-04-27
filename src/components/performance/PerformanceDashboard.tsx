'use client';

import React, { useMemo } from 'react';
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
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { clearTrendHistory, type PerformanceTrendPoint } from '@/utils/performanceUtils';
import { CoreWebVitals } from './CoreWebVitals';
import { OptimizationSuggestions } from './OptimizationSuggestions';

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
 */
export const PerformanceDashboard: React.FC = () => {
  const { metrics, alerts, suggestions, trend, clearAlerts, refreshTrendFromStorage } =
    usePerformanceMonitoring();

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
    refreshTrendFromStorage();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" role="main">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" aria-hidden />
              Performance dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Core Web Vitals, recent alerts, and session trend samples (stored in sessionStorage).
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearTrends}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Eraser className="w-4 h-4" aria-hidden />
            Clear trend history
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <CoreWebVitals metrics={metrics} />
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-500" aria-hidden />
              Analytics Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isAnalyticsEnabled
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {isAnalyticsEnabled ? <ShieldCheck className="w-3 h-3" /> : null}
                  {isAnalyticsEnabled ? 'Active' : 'Disabled (Dev)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Endpoint</span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                  /api/performance/vitals
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  <Globe className="inline w-3 h-3 mr-1" />
                  Simulated Global Average (7d)
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
              Alerts
            </h2>
            {alerts.length > 0 ? (
              <button
                type="button"
                onClick={clearAlerts}
                className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
                Clear list
              </button>
            ) : null}
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No degradation alerts in this session.
            </p>
          ) : (
            <ul className="space-y-2" aria-live="polite">
              {alerts.map((a) => (
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
                  <span className="ml-2">{a.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <OptimizationSuggestions suggestions={suggestions} />

        <section aria-labelledby="perf-trends-heading">
          <h2 id="perf-trends-heading" className="text-sm font-semibold mb-4">
            Trends (this tab session)
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {VITAL_NAMES.map((name) => {
              const data = seriesByVital[name];
              return (
                <div
                  key={name}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                    {name}
                  </h3>
                  {data.length < 2 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                      Not enough samples yet. Interact with the app or reload to collect points.
                    </p>
                  ) : (
                    <div className="h-48 w-full" role="img" aria-label={`${name} trend chart`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-200 dark:stroke-gray-700"
                          />
                          <XAxis
                            dataKey="i"
                            tick={{ fontSize: 10 }}
                            label={{
                              value: 'Sample #',
                              position: 'insideBottom',
                              offset: -4,
                              fontSize: 10,
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => formatTick(name, v as number)}
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
                            dot={false}
                            isAnimationActive={false}
                          />
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
