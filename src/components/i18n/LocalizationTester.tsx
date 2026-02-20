/**
 * LocalizationTester - Component for testing and validating translations
 */

'use client';

import { useState, useMemo } from 'react';
import { useInternationalization } from '@/hooks/useInternationalization';
import { getAvailableLanguages } from '@/locales/config';
import { getMissingTranslations, hasTranslation } from '@/locales/translationManager';
import { AlertCircle, CheckCircle2, XCircle, Search, Download } from 'lucide-react';
import type { LanguageCode, Translations } from '@/locales/types';

interface LocalizationTesterProps {
  /**
   * Whether to show the tester UI
   */
  show?: boolean;
  
  /**
   * Reference language for comparison
   */
  referenceLanguage?: LanguageCode;
  
  /**
   * Custom className
   */
  className?: string;
}

interface TranslationIssue {
  language: LanguageCode;
  type: 'missing' | 'empty' | 'unused';
  keys: string[];
}

export function LocalizationTester({
  show = false,
  referenceLanguage = 'en',
  className = '',
}: LocalizationTesterProps) {
  const { language, translations, t } = useInternationalization();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [issues, setIssues] = useState<TranslationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Get all translation keys recursively
  const getAllKeys = (obj: Translations, prefix = ''): string[] => {
    const keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'string') {
        keys.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        keys.push(...getAllKeys(value, fullKey));
      }
    }
    
    return keys;
  };

  // Validate translations
  const validateTranslations = async () => {
    setIsValidating(true);
    
    try {
      // Load reference translations
      const { loadTranslations } = await import('@/locales/translationManager');
      const referenceTranslations = await loadTranslations(referenceLanguage);
      const referenceKeys = getAllKeys(referenceTranslations);
      
      const newIssues: TranslationIssue[] = [];
      
      // Check each language
      for (const lang of getAvailableLanguages()) {
        if (lang === referenceLanguage) continue;
        
        try {
          const langTranslations = await loadTranslations(lang);
          const langKeys = getAllKeys(langTranslations);
          
          // Find missing keys
          const missingKeys = referenceKeys.filter(key => !hasTranslation(langTranslations, key));
          
          // Find empty translations
          const emptyKeys = langKeys.filter(key => {
            const translation = t(key);
            return !translation || translation.trim() === '';
          });
          
          if (missingKeys.length > 0) {
            newIssues.push({
              language: lang,
              type: 'missing',
              keys: missingKeys,
            });
          }
          
          if (emptyKeys.length > 0) {
            newIssues.push({
              language: lang,
              type: 'empty',
              keys: emptyKeys,
            });
          }
        } catch (error) {
          console.error(`Failed to validate ${lang}:`, error);
        }
      }
      
      setIssues(newIssues);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Get translation keys for current language
  const translationKeys = useMemo(() => {
    return getAllKeys(translations);
  }, [translations]);

  // Filter keys by search term
  const filteredKeys = useMemo(() => {
    if (!searchTerm) return translationKeys;
    return translationKeys.filter(key => 
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(key).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [translationKeys, searchTerm, t]);

  // Export translations to JSON
  const exportTranslations = () => {
    const dataStr = JSON.stringify(translations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translations-${language}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!show) return null;

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Localization Tester</h2>
        <div className="flex gap-2">
          <button
            onClick={validateTranslations}
            disabled={isValidating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isValidating ? 'Validating...' : 'Validate All'}
          </button>
          <button
            onClick={exportTranslations}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search translations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
      </div>

      {/* Issues Summary */}
      {issues.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="font-semibold">Translation Issues</h3>
          {issues.map((issue) => (
            <div
              key={`${issue.language}-${issue.type}`}
              className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              {issue.type === 'missing' ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {issue.language.toUpperCase()} - {issue.type === 'missing' ? 'Missing' : 'Empty'} Translations
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {issue.keys.length} {issue.keys.length === 1 ? 'key' : 'keys'}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {issue.keys.slice(0, 10).map((key) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono"
                    >
                      {key}
                    </span>
                  ))}
                  {issue.keys.length > 10 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{issue.keys.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Translation Keys List */}
      <div>
        <h3 className="font-semibold mb-3">
          Translation Keys ({filteredKeys.length})
        </h3>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No translations found
            </div>
          ) : (
            filteredKeys.map((key) => {
              const translation = t(key);
              const isEmpty = !translation || translation.trim() === '';
              
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${
                    isEmpty
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-mono text-sm font-semibold mb-1">
                        {key}
                      </div>
                      <div className={`text-sm ${isEmpty ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {isEmpty ? '(Empty)' : translation}
                      </div>
                    </div>
                    {isEmpty ? (
                      <XCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
