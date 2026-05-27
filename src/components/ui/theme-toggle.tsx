'use client';

import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';
import { useTheme } from '@/lib/theme-provider';
import { useSettingsStore } from '@/lib/settings/store';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

function ThemeToggleFallback() {
  return (
    <button
      type="button"
      disabled
      className="p-2 rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed"
      aria-label="Theme toggle unavailable"
      title="Theme toggle unavailable"
    >
      <Sun size={20} aria-hidden="true" />
    </button>
  );
}

function ThemeToggleControl() {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useTheme();
  const patchSettings = useSettingsStore((s) => s.patchSettings);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun size={20} aria-hidden="true" />
      </button>
    );
  }

  const prefersDark =
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  const handleToggle = () => {
    const next = prefersDark ? 'light' : 'dark';
    setTheme(next);
    patchSettings({ theme: next });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      aria-label={`Switch to ${prefersDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${prefersDark ? 'light' : 'dark'} mode`}
    >
      {prefersDark ? (
        <Sun size={20} className="transition-transform duration-300" aria-hidden="true" />
      ) : (
        <Moon size={20} className="transition-transform duration-300" aria-hidden="true" />
      )}
    </button>
  );
}

export function ThemeToggle() {
  return (
    <ErrorBoundary
      fallback={<ThemeToggleFallback />}
      isolationId="theme-toggle"
      isolationLevel="component"
    >
      <ThemeToggleControl />
    </ErrorBoundary>
  );
}
