import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { OptimizationSuggestion } from '@/utils/performanceUtils';
import { useInternationalization } from '@/hooks/useInternationalization';
import { translateWithFallback } from '@/components/dashboard/dashboardI18n';

export interface OptimizationSuggestionsProps {
  suggestions: OptimizationSuggestion[];
  className?: string;
}

const IMPACT_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * Lists heuristic optimization suggestions derived from current metrics and environment.
 */
export const OptimizationSuggestions: React.FC<OptimizationSuggestionsProps> = ({
  suggestions,
  className = '',
}) => {
  const { t } = useInternationalization();
  const sorted = [...suggestions].sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]);

  const sectionAriaLabel = translateWithFallback(
    t,
    'performance.telemetry.suggestions.heading',
    'Optimization suggestions',
  );

  if (sorted.length === 0) {
    return (
      <section className={className} aria-label={sectionAriaLabel}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" aria-hidden />
          {translateWithFallback(
            t,
            'performance.telemetry.suggestions.headingFallback',
            'Suggestions',
          )}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {translateWithFallback(
            t,
            'performance.telemetry.suggestions.empty',
            'No issues detected from current Core Web Vitals. Keep monitoring as users interact with the app.',
          )}
        </p>
      </section>
    );
  }

  return (
    <section className={className} aria-label={sectionAriaLabel}>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" aria-hidden />
        {translateWithFallback(
          t,
          'performance.telemetry.suggestions.heading',
          'Optimization suggestions',
        )}
      </h2>
      <ul className="space-y-3">
        {sorted.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950/60 p-3"
          >
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {translateWithFallback(
                  t,
                  `performance.telemetry.suggestions.${s.id}.title`,
                  s.title,
                )}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {translateWithFallback(
                  t,
                  'performance.telemetry.suggestions.impact',
                  `${s.impact} impact`,
                  {
                    impact: translateWithFallback(
                      t,
                      `performance.telemetry.suggestions.impactLevels.${s.impact}`,
                      s.impact,
                    ),
                  },
                )}
              </span>
              {s.metric ? (
                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                  {s.metric}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {translateWithFallback(
                t,
                `performance.telemetry.suggestions.${s.id}.detail`,
                s.detail,
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};
