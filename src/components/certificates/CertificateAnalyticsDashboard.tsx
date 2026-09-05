/**
 * CertificateAnalyticsDashboard
 *
 * Data visualisation panel for the Certificate Generation feature (issue #472).
 * Fetches analytics from GET /api/certificates/analytics and renders:
 *   - Summary stat cards (total issued, active, revoked, avg latency)
 *   - 30-day issuance trend — AreaChart (recharts)
 *   - Per-course breakdown    — BarChart  (recharts)
 *   - Issued vs Revoked split — PieChart  (recharts)
 *
 * Accessibility: all interactive elements have aria-labels; charts carry
 * aria-hidden="true" with adjacent visually-hidden data tables for screen readers.
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { CHART_COLOR_PALETTE, formatNumberCompact } from '@/utils/visualizationUtils';
import type {
  CertificateAnalytics,
  CertificateIssuedByDay,
  CertificateIssuedByCourse,
} from '@/services/certificate-service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CertificateAnalyticsDashboardProps {
  /** Optional pre-fetched analytics (e.g. from a Server Component). When
   *  provided the component skips the client-side fetch on mount. */
  initialData?: CertificateAnalytics;
  /** Additional Tailwind classes for the outer wrapper. */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sublabel, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    role="region"
    aria-label={label}
  >
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}1a` }}
      aria-hidden="true"
    >
      <span style={{ color }}>{icon}</span>
    </span>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? formatNumberCompact(value) : value}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>
      )}
    </div>
  </motion.div>
);

// Visually-hidden data table for screen readers so charts are accessible
const VisuallyHiddenTable: React.FC<{
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}> = ({ caption, headers, rows }) => (
  <table className="sr-only">
    <caption>{caption}</caption>
    <thead>
      <tr>
        {headers.map((h) => (
          <th key={h} scope="col">
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>
          {row.map((cell, j) => (
            <td key={j}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const CertificateAnalyticsDashboard: React.FC<CertificateAnalyticsDashboardProps> = ({
  initialData,
  className = '',
}) => {
  const [analytics, setAnalytics] = useState<CertificateAnalytics | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(initialData ? new Date() : null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/certificates/analytics', { credentials: 'include' });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as CertificateAnalytics;
      setAnalytics(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      void fetchAnalytics();
    }
  }, [initialData, fetchAnalytics]);

  // ── Derived chart data ───────────────────────────────────────────────────

  const trendData: CertificateIssuedByDay[] = analytics?.issuedByDay ?? [];

  const courseData: CertificateIssuedByCourse[] = analytics?.issuedByCourse ?? [];

  const pieData = analytics
    ? [
        { name: 'Active', value: analytics.totalActive },
        { name: 'Revoked', value: analytics.totalRevoked },
      ]
    : [];

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );

  const renderError = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950"
      role="alert"
    >
      <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
      <button
        onClick={() => void fetchAnalytics()}
        className="mt-1 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
        aria-label="Retry loading analytics"
      >
        Retry
      </button>
    </motion.div>
  );

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <section
      className={`space-y-6 ${className}`}
      aria-labelledby="cert-analytics-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="cert-analytics-heading"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Certificate Analytics
          </h2>
          {lastRefreshed && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Last updated {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => void fetchAnalytics()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Refresh analytics"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && !analytics ? (
          <motion.div key="skeleton" exit={{ opacity: 0 }}>
            {renderSkeleton()}
          </motion.div>
        ) : error && !analytics ? (
          <motion.div key="error" exit={{ opacity: 0 }}>
            {renderError()}
          </motion.div>
        ) : analytics ? (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<Award className="h-5 w-5" />}
                label="Total Issued"
                value={analytics.totalIssued}
                sublabel="All time"
                color={CHART_COLOR_PALETTE[0]}
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                label="Active"
                value={analytics.totalActive}
                sublabel="Currently valid"
                color={CHART_COLOR_PALETTE[2]}
              />
              <StatCard
                icon={<XCircle className="h-5 w-5" />}
                label="Revoked"
                value={analytics.totalRevoked}
                sublabel={
                  analytics.totalIssued > 0
                    ? `${((analytics.totalRevoked / analytics.totalIssued) * 100).toFixed(1)}% of total`
                    : '0% of total'
                }
                color={CHART_COLOR_PALETTE[4]}
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                label="Avg. Issuance Lag"
                value={
                  analytics.avgCompletionToIssuanceDays === 0
                    ? '< 1 day'
                    : `${analytics.avgCompletionToIssuanceDays}d`
                }
                sublabel="Completion → certificate"
                color={CHART_COLOR_PALETTE[3]}
              />
            </div>

            {/* ── Charts row ──────────────────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* 30-day trend */}
              <div
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                role="region"
                aria-label="30-day certificate issuance trend"
              >
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    30-Day Issuance Trend
                  </h3>
                </div>
                <div aria-hidden="true">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="certTrendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLOR_PALETTE[0]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={CHART_COLOR_PALETTE[0]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => v.slice(5)} /* MM-DD */
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number) => [value, 'Certificates']}
                        labelFormatter={(label: string) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Issued"
                        stroke={CHART_COLOR_PALETTE[0]}
                        strokeWidth={2}
                        fill="url(#certTrendGradient)"
                        isAnimationActive
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Accessible table mirror */}
                <VisuallyHiddenTable
                  caption="30-day certificate issuance trend"
                  headers={['Date', 'Certificates Issued']}
                  rows={trendData.map((d) => [d.date, d.count])}
                />
              </div>

              {/* Per-course bar chart */}
              <div
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                role="region"
                aria-label="Certificates issued by course"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Certificates by Course
                  </h3>
                </div>
                {courseData.length === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-400">No data yet</p>
                ) : (
                  <>
                    <div aria-hidden="true">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={courseData}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="courseName"
                            tick={{ fontSize: 11 }}
                            width={120}
                          />
                          <Tooltip formatter={(value: number) => [value, 'Certificates']} />
                          <Bar dataKey="count" name="Certificates" radius={[0, 4, 4, 0]} isAnimationActive>
                            {courseData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <VisuallyHiddenTable
                      caption="Certificates issued by course"
                      headers={['Course', 'Certificates Issued']}
                      rows={courseData.map((d) => [d.courseName, d.count])}
                    />
                  </>
                )}
              </div>

              {/* Active vs Revoked pie */}
              <div
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2"
                role="region"
                aria-label="Active versus revoked certificate breakdown"
              >
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Active vs. Revoked
                  </h3>
                </div>
                {analytics.totalIssued === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-400">No certificates issued yet</p>
                ) : (
                  <>
                    <div aria-hidden="true">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, percent }: { name: string; percent: number }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            isAnimationActive
                          >
                            <Cell fill={CHART_COLOR_PALETTE[2]} />
                            <Cell fill={CHART_COLOR_PALETTE[4]} />
                          </Pie>
                          <Tooltip formatter={(value: number) => [value, 'Certificates']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <VisuallyHiddenTable
                      caption="Active versus revoked certificate breakdown"
                      headers={['Status', 'Count']}
                      rows={pieData.map((d) => [d.name, d.value])}
                    />
                  </>
                )}
              </div>
            </div>

          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};
