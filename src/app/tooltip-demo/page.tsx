'use client';

/**
 * Tooltip System Demo Page
 * Route: /tooltip-demo
 *
 * Demonstrates the Tooltip component with all placements and the
 * useTooltipAnomalyDetection hook in action.
 */

import React, { useState } from 'react';
import { Tooltip, TooltipPlacement } from '@/components/ui/Tooltip';
import { useTooltipAnomalyDetection } from '@/hooks/useTooltipAnomalyDetection';

const PLACEMENTS: TooltipPlacement[] = ['top', 'bottom', 'left', 'right'];

export default function TooltipDemoPage() {
  const [zoomScale, setZoomScale] = useState(1);
  const { onOpen, onClose, anomalies, clearAnomalies } = useTooltipAnomalyDetection({
    rapidToggleThreshold: 5,
    rapidToggleWindowMs: 3000,
    longHoverThresholdMs: 10000,
    multiOpenThreshold: 3,
    onAnomaly: (e) => console.warn('[TooltipAnomaly]', e),
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-10">
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
        Tooltip System Demo
      </h1>
      <p className="mb-10 text-gray-500 dark:text-gray-400">
        Hover or focus the buttons below to see tooltips. Anomaly detection is active — rapidly
        toggling a tooltip or keeping it open for &gt;10 s will log an anomaly.
      </p>

      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tooltip Zoom</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Change the tooltip zoom scale to verify positioning and accessibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 1.25, 1.5, 2].map((scale) => (
              <button
                key={scale}
                type="button"
                className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${
                  zoomScale === scale
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:text-indigo-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                }`}
                onClick={() => setZoomScale(scale)}
              >
                {Math.round(scale * 100)}%
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Placement showcase */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Placements
        </h2>
        <div className="flex flex-wrap items-center gap-10">
          {PLACEMENTS.map((placement) => (
            <Tooltip
              key={placement}
              content={`Placement: ${placement}`}
              placement={placement}
              zoomScale={zoomScale}
              onAnomaly={(type) => onOpen(`placement-${placement}-${type}`)}
            >
              <button
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onFocus={() => onOpen(`placement-${placement}`)}
                onBlur={() => onClose(`placement-${placement}`)}
                onMouseEnter={() => onOpen(`placement-${placement}`)}
                onMouseLeave={() => onClose(`placement-${placement}`)}
              >
                {placement}
              </button>
            </Tooltip>
          ))}
        </div>
      </section>

      {/* Rich content tooltip */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Rich Content
        </h2>
        <Tooltip
          content={
            <span>
              <strong>Tip:</strong> This tooltip supports{' '}
              <em>rich React content</em>.
            </span>
          }
          placement="right"
          delayMs={100}
          zoomScale={zoomScale}
          onAnomaly={(type) => onOpen(`rich-${type}`)}
        >
          <button
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onFocus={() => onOpen('rich')}
            onBlur={() => onClose('rich')}
            onMouseEnter={() => onOpen('rich')}
            onMouseLeave={() => onClose('rich')}
          >
            Hover for rich tooltip
          </button>
        </Tooltip>
      </section>

      {/* Disabled tooltip */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Disabled State
        </h2>
        <Tooltip content="You should never see this" disabled zoomScale={zoomScale}>
          <button className="rounded-lg bg-gray-400 px-5 py-2 text-sm font-medium text-white shadow cursor-not-allowed">
            Disabled tooltip
          </button>
        </Tooltip>
      </section>

      {/* Anomaly log */}
      <section>
        <div className="mb-3 flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Anomaly Log
          </h2>
          {anomalies.length > 0 && (
            <button
              onClick={clearAnomalies}
              className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
            >
              Clear
            </button>
          )}
        </div>

        {anomalies.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No anomalies detected yet. Try rapidly toggling a tooltip!
          </p>
        ) : (
          <ul className="space-y-2">
            {anomalies.map((a, i) => (
              <li
                key={i}
                className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm dark:border-yellow-700 dark:bg-yellow-900/20"
              >
                <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                  [{a.type}]
                </span>{' '}
                <span className="text-gray-700 dark:text-gray-300">
                  tooltip: <code>{a.tooltipId}</code>
                </span>
                {a.detail && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400">— {a.detail}</span>
                )}
                <span className="ml-2 text-xs text-gray-400">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
