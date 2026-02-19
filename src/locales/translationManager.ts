/**
 * Translation Manager - Handles loading, caching, and managing translations
 */

import type { LanguageCode, Translations, LocaleData } from './types';
import { getLocaleConfig } from './config';

// Cache for loaded translations
const translationCache = new Map<LanguageCode, Translations>();

// In-memory fallback translations
const fallbackTranslations: Translations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
};

/**
 * Load translations for a language dynamically
 */
export async function loadTranslations(language: LanguageCode): Promise<Translations> {
  // Check cache first
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    // Dynamic import of translation file
    const translations = await import(`./${language}.json`);
    const loadedTranslations = translations.default || translations;
    
    // Cache the loaded translations
    translationCache.set(language, loadedTranslations);
    
    return loadedTranslations;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}:`, error);
    
    // Try to load English as fallback
    if (language !== 'en') {
      try {
        const fallback = await loadTranslations('en');
        return fallback;
      } catch {
        // If even English fails, return in-memory fallback
        return fallbackTranslations;
      }
    }
    
    return fallbackTranslations;
  }
}

/**
 * Preload translations for multiple languages
 */
export async function preloadTranslations(languages: LanguageCode[]): Promise<void> {
  await Promise.all(languages.map(lang => loadTranslations(lang)));
}

/**
 * Get translation value by key path (e.g., "common.loading")
 */
export function getTranslation(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters in translation string
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(translations: Translations, key: string): boolean {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return false;
    }
  }

  return typeof value === 'string';
}

/**
 * Get all missing translation keys by comparing with reference language
 */
export function getMissingTranslations(
  reference: Translations,
  target: Translations,
  prefix = ''
): string[] {
  const missing: string[] = [];

  for (const key in reference) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const refValue = reference[key];
    const targetValue = target[key];

    if (typeof refValue === 'string') {
      if (!targetValue || typeof targetValue !== 'string') {
        missing.push(fullKey);
      }
    } else if (typeof refValue === 'object') {
      if (!targetValue || typeof targetValue !== 'object') {
        missing.push(fullKey);
      } else {
        missing.push(...getMissingTranslations(refValue, targetValue, fullKey));
      }
    }
  }

  return missing;
}

/**
 * Clear translation cache (useful for development)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cached translations count
 */
export function getCachedLanguages(): LanguageCode[] {
  return Array.from(translationCache.keys());
}
