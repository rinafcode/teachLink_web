'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { getWCAGLevel, type AccessibilityIssue } from '@/utils/accessibilityUtils';
import { AlertCircle, CheckCircle2, ClipboardList, X } from 'lucide-react';

/**
 * Development helper: heuristic WCAG-oriented checks over the document.
 * Does not replace manual testing with assistive technology.
 */
export function AccessibilityAudit() {
  const { runPageAudit, announce } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [busy, setBusy] = useState(false);

  const run = useCallback(() => {
    setBusy(true);
    window.requestAnimationFrame(() => {
      const found = runPageAudit();
      setIssues(found);
      setBusy(false);
      const level = getWCAGLevel(found);
      announce(
        `Audit complete. ${found.length} findings. WCAG estimate ${level}.`,
        found.length ? 'assertive' : 'polite',
      );
    });
  }, [runPageAudit, announce]);

  useEffect(() => {
    if (!open) return;
    run();
  }, [open, run]);

  const level = getWCAGLevel(issues);

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 left-4 z-[9998] flex h-12 w-12 items-center justify-center rounded-full border border-amber-300 bg-amber-500 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:border-amber-600 dark:bg-amber-600 dark:focus:ring-offset-gray-950"
        aria-label="Open accessibility audit (development only)"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <ClipboardList size={22} aria-hidden />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[9997] bg-black/30"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-audit-title"
            className="fixed bottom-20 left-4 z-[9998] flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),22rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
              <h2 id="a11y-audit-title" className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                A11y audit
              </h2>
              <button
                type="button"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label="Close audit panel"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Heuristic WCAG mapping</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    level === 'Fail'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                      : level === 'AAA'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
                  }`}
                >
                  {level}
                </span>
              </div>

              <button
                type="button"
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                onClick={run}
                disabled={busy}
              >
                {busy ? 'Scanning…' : 'Run again'}
              </button>

              <div className="min-h-0 flex-1 overflow-y-auto text-sm">
                {busy ? (
                  <p className="text-gray-500 dark:text-gray-400">Scanning DOM…</p>
                ) : issues.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="text-green-600" size={36} aria-hidden />
                    <p>No issues flagged by automated checks.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {issues.map((issue) => (
                      <li
                        key={issue.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950"
                      >
                        <div className="flex gap-2">
                          <AlertCircle
                            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                            size={16}
                            aria-hidden
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {issue.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {issue.suggestion}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              WCAG: {issue.wcagCriteria.join(', ')}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
