'use client';

import { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTheme } from '@/lib/theme-provider';
import type { Theme } from '@/lib/theme-provider';

function PreferencesSection() {
  const { register, watch, setValue } = useFormContext();
  const { theme, setTheme } = useTheme();

  // Sync the form field with the live theme context on mount
  useEffect(() => {
    setValue('theme', theme);
  }, [theme, setValue]);

  // When the form radio changes, propagate to ThemeContext
  const watchedTheme = watch('theme') as Theme;
  useEffect(() => {
    if (watchedTheme && watchedTheme !== theme) {
      setTheme(watchedTheme);
    }
  }, [watchedTheme, theme, setTheme]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
          Notifications
        </h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('notifications.email')}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('notifications.push')}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
          Display Settings
        </h3>
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme Preference
            </span>
            <div className="flex items-center space-x-6">
              {(['light', 'dark', 'system'] as const).map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value={option}
                    {...register('theme')}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Performance
            </span>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('prefetching')}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <span className="text-gray-700 dark:text-gray-300">Enable Smart Prefetching</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically load pages before you click. Disabled on slow connections.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PreferencesSection);
