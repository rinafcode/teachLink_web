/**
 * Example Usage - Demonstration of i18n system usage
 * This file shows how to use the internationalization system in components
 */

'use client';

import { useInternationalization } from '@/hooks/useInternationalization';
import { DynamicLanguageSwitcher } from './DynamicLanguageSwitcher';

export function I18nExample() {
  const {
    t,
    formatDate,
    formatCurrency,
    formatNumber,
    formatRelativeTime,
    language,
    isRTL,
    direction,
  } = useInternationalization();

  const sampleDate = new Date();
  const sampleAmount = 1234.56;
  const sampleNumber = 9876543.21;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('common.welcome')}</h1>
        <DynamicLanguageSwitcher mode="dropdown" showNativeNames />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="font-semibold mb-2">{t('common.loading')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Language: {language}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Direction: {direction} {isRTL ? '(RTL)' : '(LTR)'}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="font-semibold mb-2">{t('common.edit')}</h2>
          <p className="text-sm">
            Date: {formatDate(sampleDate)}
          </p>
          <p className="text-sm">
            Relative: {formatRelativeTime(sampleDate)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="font-semibold mb-2">{t('common.save')}</h2>
          <p className="text-sm">
            Currency: {formatCurrency(sampleAmount)}
          </p>
          <p className="text-sm">
            Number: {formatNumber(sampleNumber)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="font-semibold mb-2">{t('navigation.home')}</h2>
          <p className="text-sm">
            {t('validation.minLength', { min: 8 })}
          </p>
        </div>
      </div>
    </div>
  );
}
