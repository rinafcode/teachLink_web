/**
 * DynamicLanguageSwitcher - Component for switching languages dynamically
 */

'use client';

import { useState, useTransition } from 'react';
import { useInternationalization } from '@/hooks/useInternationalization';
import { getAvailableLanguages, getLocaleConfig } from '@/locales/config';
import { Languages, Check, ChevronDown } from 'lucide-react';
import type { LanguageCode } from '@/locales/types';

interface DynamicLanguageSwitcherProps {
  /**
   * Display mode: 'dropdown' | 'select' | 'buttons'
   */
  mode?: 'dropdown' | 'select' | 'buttons';
  
  /**
   * Show native language names
   */
  showNativeNames?: boolean;
  
  /**
   * Show flags/icons
   */
  showFlags?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Callback when language changes
   */
  onLanguageChange?: (language: LanguageCode) => void;
}

export function DynamicLanguageSwitcher({
  mode = 'dropdown',
  showNativeNames = false,
  showFlags = false,
  className = '',
  onLanguageChange,
}: DynamicLanguageSwitcherProps) {
  const { language, changeLanguage, isLoading, t } = useInternationalization();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const availableLanguages = getAvailableLanguages();
  const currentConfig = getLocaleConfig(language);

  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    if (newLanguage === language || isLoading) return;

    startTransition(async () => {
      await changeLanguage(newLanguage);
      setIsOpen(false);
      
      if (onLanguageChange) {
        onLanguageChange(newLanguage);
      }
    });
  };

  // Dropdown mode
  if (mode === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || isPending}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('i18n.selectLanguage')}
        >
          <Languages className="w-4 h-4" />
          <span className="font-medium">
            {showNativeNames ? currentConfig.nativeName : currentConfig.name}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
              {availableLanguages.map((lang) => {
                const config = getLocaleConfig(lang);
                const isSelected = lang === language;
                
                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {showFlags && (
                      <span className="text-2xl" role="img" aria-label={config.name}>
                        {getLanguageFlag(lang)}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{config.name}</div>
                      {showNativeNames && config.nativeName !== config.name && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {config.nativeName}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Select mode
  if (mode === 'select') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
          disabled={isLoading || isPending}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-10"
        >
          {availableLanguages.map((lang) => {
            const config = getLocaleConfig(lang);
            return (
              <option key={lang} value={lang}>
                {showNativeNames ? `${config.name} (${config.nativeName})` : config.name}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
      </div>
    );
  }

  // Buttons mode
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {availableLanguages.map((lang) => {
        const config = getLocaleConfig(lang);
        const isSelected = lang === language;
        
        return (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            disabled={isLoading || isPending}
            className={`px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {showFlags && (
              <span className="mr-2" role="img" aria-label={config.name}>
                {getLanguageFlag(lang)}
              </span>
            )}
            {showNativeNames ? config.nativeName : config.name}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get emoji flag for language (simplified - in production, use a proper flag library)
 */
function getLanguageFlag(language: LanguageCode): string {
  const flagMap: Record<LanguageCode, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    ar: '🇸🇦',
    he: '🇮🇱',
    ja: '🇯🇵',
    zh: '🇨🇳',
    pt: '🇧🇷',
    ru: '🇷🇺',
    it: '🇮🇹',
    ko: '🇰🇷',
  };
  
  return flagMap[language] || '🌐';
}
