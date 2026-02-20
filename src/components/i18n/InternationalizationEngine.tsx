/**
 * InternationalizationEngine - Core component for managing i18n with dynamic loading
 */

'use client';

import { useEffect, useState } from 'react';
import { useInternationalization } from '@/hooks/useInternationalization';
import { preloadTranslations } from '@/locales/translationManager';
import { getAvailableLanguages } from '@/locales/config';
import type { LanguageCode } from '@/locales/types';

interface InternationalizationEngineProps {
  /**
   * Languages to preload on mount
   */
  preloadLanguages?: LanguageCode[];
  
  /**
   * Whether to preload all available languages
   */
  preloadAll?: boolean;
  
  /**
   * Callback when language changes
   */
  onLanguageChange?: (language: LanguageCode) => void;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
}

export function InternationalizationEngine({
  preloadLanguages = [],
  preloadAll = false,
  onLanguageChange,
  children,
}: InternationalizationEngineProps) {
  const { language, isLoading, error, changeLanguage } = useInternationalization();
  const [preloadStatus, setPreloadStatus] = useState<Record<LanguageCode, boolean>>({});

  // Preload translations on mount
  useEffect(() => {
    let cancelled = false;

    async function preload() {
      const languagesToPreload = preloadAll 
        ? getAvailableLanguages()
        : preloadLanguages;

      if (languagesToPreload.length === 0) return;

      try {
        await preloadTranslations(languagesToPreload);
        
        if (!cancelled) {
          const status: Record<LanguageCode, boolean> = {};
          languagesToPreload.forEach(lang => {
            status[lang] = true;
          });
          setPreloadStatus(status);
        }
      } catch (err) {
        console.warn('Failed to preload some translations:', err);
      }
    }

    preload();

    return () => {
      cancelled = true;
    };
  }, [preloadLanguages, preloadAll]);

  // Handle language change callback
  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  }, [language, onLanguageChange]);

  // Handle language change with callback
  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    await changeLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  // Show loading state if needed
  if (isLoading && Object.keys(preloadStatus).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading translations...</p>
        </div>
      </div>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
            Translation Error
          </p>
          <p className="text-red-500 dark:text-red-500 text-sm">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to programmatically change language
 */
export function useLanguageSwitcher() {
  const { changeLanguage, language } = useInternationalization();

  return {
    currentLanguage: language,
    changeLanguage,
  };
}
