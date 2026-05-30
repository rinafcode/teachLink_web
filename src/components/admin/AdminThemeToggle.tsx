'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeContext, Theme } from '@/contexts/ThemeContext';

/**
 * Admin-specific dark mode toggle for the admin panel header.
 * Provides light/dark/system mode switching with visual feedback.
 */
export default function AdminThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useThemeContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {options.map((opt) => {
        const isActive = mounted ? theme === opt.value : opt.value === 'system';
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            aria-label={`Switch to ${opt.label} mode`}
            aria-pressed={isActive}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
