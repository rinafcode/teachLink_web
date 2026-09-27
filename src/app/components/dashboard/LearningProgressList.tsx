'use client';

import React from 'react';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { useInternationalization } from '@/hooks/useInternationalization';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';

const ACCENT_COLORS = ['blue', 'green', 'purple', 'amber', 'rose', 'teal'] as const;

const ACCENT_BORDER = {
  blue: 'border-blue-500',
  green: 'border-green-500',
  purple: 'border-purple-500',
  amber: 'border-amber-500',
  rose: 'border-rose-500',
  teal: 'border-teal-500',
} as const;

const ACCENT_TEXT_HOVER = {
  blue: 'group-hover:text-blue-600',
  green: 'group-hover:text-green-600',
  purple: 'group-hover:text-purple-600',
  amber: 'group-hover:text-amber-600',
  rose: 'group-hover:text-rose-600',
  teal: 'group-hover:text-teal-600',
} as const;

const ACCENT_BAR = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
} as const;

export const LearningProgressList: React.FC = () => {
  const { items, isLoading, error, refetch } = useLearningProgress();
  const { t } = useInternationalization();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        {t('dashboard.learningProgress')}
      </h2>

      {isLoading && <ListSkeleton count={3} />}

      {!isLoading && error && (
        <div role="alert">
          <p className="text-sm text-red-600 dark:text-red-400">{t('errors.network')}</p>
          <button
            onClick={refetch}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.noCoursesInProgress')}
        </p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-8">
          {items.map((item, index) => {
            const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
            return (
              <div key={item.courseId} className={`border-s-4 ${ACCENT_BORDER[color]} ps-6 group`}>
                <h3
                  className={`text-lg font-bold text-gray-900 dark:text-white ${ACCENT_TEXT_HOVER[color]} transition-colors`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.progressStatus', {
                    percent: item.progress,
                    remaining: item.timeRemaining,
                  })}
                </p>
                <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                  <div
                    className={`${ACCENT_BAR[color]} h-3 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
