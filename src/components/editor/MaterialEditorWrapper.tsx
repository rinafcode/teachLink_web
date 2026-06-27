'use client';

/**
 * Post Editor: Material Design (#418).
 *
 * Provides a focused, Material-style wrapper for the existing post editor
 * without pulling in the full MUI dependency footprint. The component is
 * purpose-built for our current Tailwind setup so the "Material" look —
 * elevated surfaces, rounded corners, ripple-ready hit targets, motion —
 * is achieved with composable primitives.
 */

import { forwardRef, useCallback, useState } from 'react';

export interface MaterialEditorWrapperProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
}

type Ripple = { x: number; y: number; size: number; k: string };

export const MaterialEditorWrapper = forwardRef<HTMLDivElement, MaterialEditorWrapperProps>(
  function MaterialEditorWrapper(
    {
      title,
      children,
      onSubmit,
      submitLabel = 'Publish',
      cancelLabel = 'Cancel',
      onCancel,
      className = '',
    },
    ref,
  ) {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const spawnRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const k = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ripple = {
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2,
        size,
        k,
      };
      setRipples((r) => [...r, ripple]);
      window.setTimeout(() => {
        setRipples((r) => r.filter((rp) => rp.k !== k));
      }, 600);
    }, []);

    const handleSubmit = useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        spawnRipple(e);
        if (!onSubmit) return;
        setSubmitting(true);
        try {
          await onSubmit();
        } finally {
          setSubmitting(false);
        }
      },
      [onSubmit, spawnRipple],
    );

    return (
      <div
        ref={ref}
        role="region"
        aria-label={title}
        className={
          'mde-surface relative overflow-hidden rounded-2xl bg-white text-gray-900 ' +
          'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] ' +
          'dark:bg-gray-900 dark:text-gray-50 ' +
          className
        }
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-xl font-medium tracking-wide">{title}</h2>
        </header>
        <div className="px-6 py-5">{children}</div>
        <footer className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="mde-button mde-button--text rounded-full px-4 py-2 text-sm font-medium uppercase tracking-wider text-blue-600 hover:bg-blue-50"
            >
              {cancelLabel}
            </button>
          ) : null}
          {onSubmit ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="mde-button mde-button--filled relative overflow-hidden rounded-full bg-blue-600 px-5 py-2 text-sm font-medium uppercase tracking-wider text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
            >
              {ripples.map((r) => (
                <span
                  key={r.k}
                  aria-hidden="true"
                  className="mde-ripple pointer-events-none absolute rounded-full bg-white/40"
                  style={{
                    left: `${r.x}px`,
                    top: `${r.y}px`,
                    width: `${r.size}px`,
                    height: `${r.size}px`,
                    animation: 'mde-ripple 600ms ease-out forwards',
                  }}
                />
              ))}
              {submitLabel}
            </button>
          ) : null}
        </footer>
      </div>
    );
  },
);

export default MaterialEditorWrapper;
