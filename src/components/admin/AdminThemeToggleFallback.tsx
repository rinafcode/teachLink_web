'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

/**
 * Fallback component for AdminThemeToggle in case of theme context/state failure.
 * Renders disabled but visually aligned buttons to prevent layout shifting.
 */
export default function AdminThemeToggleFallback() {
  const options = [
    { key: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { key: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { key: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed"
      aria-label="Admin theme toggle temporarily unavailable"
      title="Theme toggle unavailable"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed pointer-events-none"
          aria-label={`${opt.label} mode toggle unavailable`}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
