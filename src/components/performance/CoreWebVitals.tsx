'use client';

import React from 'react';
import type { PerformanceMetric } from '@/utils/performanceUtils';
import { formatMetricValue } from '@/utils/performanceUtils';

export interface CoreWebVitalsProps {
  metrics: Record<string, PerformanceMetric>;
  className?: string;
}

const RATING_STYLES: Record<NonNullable<PerformanceMetric['rating']>, string> = {
  good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  'needs-improvement': 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  poor: 'border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100',
};

const ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;

/**
 * Read-only grid of latest Core Web Vitals with rating-colored cards.
 */
export const CoreWebVitals: React.FC<CoreWebVitalsProps> = ({ metrics, className = '' }) => {
  return (
    <section className={className} aria-label="Core Web Vitals">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Core Web Vitals
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ORDER.map((name) => {
          const m = metrics[name];
          const style = m?.rating
            ? RATING_STYLES[m.rating]
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40';
          return (
            <li key={name} className={`rounded-lg border px-3 py-2.5 ${style}`}>
              <div className="text-xs font-medium uppercase tracking-wide opacity-80">{name}</div>
              <div className="text-lg font-mono font-semibold mt-1" aria-live="polite">
                {m ? formatMetricValue(m) : '—'}
              </div>
              {m?.rating ? (
                <div className="text-xs mt-1 capitalize opacity-90">
                  {m.rating.replace(/-/g, ' ')}
                </div>
              ) : (
                <div className="text-xs mt-1 opacity-70">Waiting…</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
