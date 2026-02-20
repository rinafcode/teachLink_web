/**
 * useInternationalization Hook - Main hook for accessing i18n functionality
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LanguageCode, Translations, CulturalPreferences } from '@/locales/types';
import { loadTranslations, getTranslation } from '@/locales/translationManager';
import { DEFAULT_LANGUAGE } from '@/locales/config';
import {
  getCulturalPreferences,
  formatDate as formatDateUtil,
  formatRelativeTime,
  formatNumber as formatNumberUtil,
  formatCurrency as formatCurrencyUtil,
  formatPercentage,
  parseNumber,
  getTextDirection,
  isRTL as isRTLUtil,
  formatFileSize,
  formatDuration,
} from '@/utils/i18nUtils';

interface I18nContextValue {
  language: LanguageCode;
  translations: Translations;
  preferences: CulturalPreferences;
  isLoading: boolean;
  error: Error | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  changeLanguage: (language: LanguageCode) => Promise<void>;
  formatDate: (date: Date | string | number, formatStr?: string) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatPercentage: (value: number, decimals?: number) => string;
  parseNumber: (value: string) => number;
  formatFileSize: (bytes: number) => string;
  formatDuration: (seconds: number) => string;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Provider component for i18n context
 */
export function I18nProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
}: {
  children: React.ReactNode;
  defaultLanguage?: LanguageCode;
}) {
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load translations when language changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedTranslations = await loadTranslations(language);
        
        if (!cancelled) {
          setTranslations(loadedTranslations);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load translations'));
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  // Load initial language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18n:language') as LanguageCode | null;
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const changeLanguage = useCallback(async (newLanguage: LanguageCode) => {
    setLanguage(newLanguage);
    localStorage.setItem('i18n:language', newLanguage);
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage;
    }
  }, []);

  // Get cultural preferences
  const preferences = useMemo(
    () => getCulturalPreferences(language),
    [language]
  );

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(translations, key, params);
    },
    [translations]
  );

  // Formatting functions
  const formatDate = useCallback(
    (date: Date | string | number, formatStr?: string) => {
      return formatDateUtil(date, language, formatStr);
    },
    [language]
  );

  const formatRelativeTimeFn = useCallback(
    (date: Date | string | number) => {
      return formatRelativeTime(date, language);
    },
    [language]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatNumberUtil(value, language, options);
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number, currency?: string) => {
      return formatCurrencyUtil(amount, language, currency);
    },
    [language]
  );

  const formatPercentageFn = useCallback(
    (value: number, decimals = 0) => {
      return formatPercentage(value, language, decimals);
    },
    [language]
  );

  const parseNumberFn = useCallback(
    (value: string) => {
      return parseNumber(value, language);
    },
    [language]
  );

  const formatFileSizeFn = useCallback(
    (bytes: number) => {
      return formatFileSize(bytes, language);
    },
    [language]
  );

  const formatDurationFn = useCallback(
    (seconds: number) => {
      return formatDuration(seconds, language);
    },
    [language]
  );

  const direction = useMemo(() => getTextDirection(language), [language]);
  const isRTL = useMemo(() => isRTLUtil(language), [language]);

  const value: I18nContextValue = {
    language,
    translations,
    preferences,
    isLoading,
    error,
    t,
    changeLanguage,
    formatDate,
    formatRelativeTime: formatRelativeTimeFn,
    formatNumber,
    formatCurrency,
    formatPercentage: formatPercentageFn,
    parseNumber: parseNumberFn,
    formatFileSize: formatFileSizeFn,
    formatDuration: formatDurationFn,
    direction,
    isRTL,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n functionality
 */
export function useInternationalization(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useInternationalization must be used within I18nProvider');
  }

  return context;
}
