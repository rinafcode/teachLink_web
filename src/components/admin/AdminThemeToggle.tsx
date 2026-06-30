'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeContext, Theme } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';
import { errorReportingService } from '@/services/errorReporting';
import AdminThemeToggleFallback from './AdminThemeToggleFallback';

/**
 * Inner component that uses theme context and performs actions.
 * Can throw if context is missing.
 */
function AdminThemeToggleControl() {
  const { theme, setTheme } = useThemeContext();

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  const handleSelectTheme = (value: Theme) => {
    try {
      setTheme(value);
    } catch (err) {
      if (typeof errorReportingService?.reportError === 'function') {
        errorReportingService.reportError(err instanceof Error ? err : new Error(String(err)), {
          component: 'AdminThemeToggle',
          action: 'handleSelectTheme',
          selectedTheme: value,
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleSelectTheme(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            theme === opt.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label={`Switch to ${opt.label} mode`}
          aria-pressed={theme === opt.value}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Admin-specific dark mode toggle wrapped with ErrorBoundary.
 */
export default function AdminThemeToggle() {
  return (
    <ErrorBoundary
      fallback={<AdminThemeToggleFallback />}
      isolationId="admin-theme-toggle"
      isolationLevel="component"
    >
      <AdminThemeToggleControl />
    </ErrorBoundary>
  );
}
