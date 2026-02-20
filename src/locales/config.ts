/**
 * Locale configuration for supported languages and regions
 */

import type { LocaleConfig, LanguageCode, RegionCode } from './types';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LocaleConfig> = {
  en: {
    language: 'en',
    region: 'US',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: 'en-US',
    direction: 'ltr',
    name: 'English',
    nativeName: 'English',
  },
  es: {
    language: 'es',
    region: 'ES',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'es-ES',
    direction: 'ltr',
    name: 'Spanish',
    nativeName: 'Español',
  },
  fr: {
    language: 'fr',
    region: 'FR',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'fr-FR',
    direction: 'ltr',
    name: 'French',
    nativeName: 'Français',
  },
  de: {
    language: 'de',
    region: 'DE',
    currency: 'EUR',
    dateFormat: 'dd.MM.yyyy',
    numberFormat: 'de-DE',
    direction: 'ltr',
    name: 'German',
    nativeName: 'Deutsch',
  },
  ar: {
    language: 'ar',
    region: 'SA',
    currency: 'SAR',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'ar-SA',
    direction: 'rtl',
    name: 'Arabic',
    nativeName: 'العربية',
  },
  he: {
    language: 'he',
    region: 'IL',
    currency: 'ILS',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'he-IL',
    direction: 'rtl',
    name: 'Hebrew',
    nativeName: 'עברית',
  },
  ja: {
    language: 'ja',
    region: 'JP',
    currency: 'JPY',
    dateFormat: 'yyyy/MM/dd',
    numberFormat: 'ja-JP',
    direction: 'ltr',
    name: 'Japanese',
    nativeName: '日本語',
  },
  zh: {
    language: 'zh',
    region: 'CN',
    currency: 'CNY',
    dateFormat: 'yyyy-MM-dd',
    numberFormat: 'zh-CN',
    direction: 'ltr',
    name: 'Chinese',
    nativeName: '中文',
  },
  pt: {
    language: 'pt',
    region: 'BR',
    currency: 'BRL',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'pt-BR',
    direction: 'ltr',
    name: 'Portuguese',
    nativeName: 'Português',
  },
  ru: {
    language: 'ru',
    region: 'RU',
    currency: 'RUB',
    dateFormat: 'dd.MM.yyyy',
    numberFormat: 'ru-RU',
    direction: 'ltr',
    name: 'Russian',
    nativeName: 'Русский',
  },
  it: {
    language: 'it',
    region: 'IT',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'it-IT',
    direction: 'ltr',
    name: 'Italian',
    nativeName: 'Italiano',
  },
  ko: {
    language: 'ko',
    region: 'KR',
    currency: 'KRW',
    dateFormat: 'yyyy.MM.dd',
    numberFormat: 'ko-KR',
    direction: 'ltr',
    name: 'Korean',
    nativeName: '한국어',
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const DEFAULT_REGION: RegionCode = 'US';

/**
 * Get locale config for a language code
 */
export function getLocaleConfig(language: LanguageCode): LocaleConfig {
  return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
}

/**
 * Get all available language codes
 */
export function getAvailableLanguages(): LanguageCode[] {
  return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];
}
