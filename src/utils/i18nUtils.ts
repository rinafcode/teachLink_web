/**
 * i18n Utilities - Helper functions for formatting dates, numbers, currencies, etc.
 */

import type { LanguageCode, CulturalPreferences } from '@/locales/types';
import { getLocaleConfig } from '@/locales/config';
import { format, formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, es, fr, de, ar, he, ja, zhCN, ptBR, ru, it, ko } from 'date-fns/locale';

// Date-fns locale mapping
const dateFnsLocales: Record<LanguageCode, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  ar: ar,
  he: he,
  ja: ja,
  zh: zhCN,
  pt: ptBR,
  ru: ru,
  it: it,
  ko: ko,
};

/**
 * Get cultural preferences for a locale
 */
export function getCulturalPreferences(language: LanguageCode, region?: string): CulturalPreferences {
  const config = getLocaleConfig(language);
  
  // Create Intl formatters to detect cultural preferences
  const numberFormatter = new Intl.NumberFormat(config.numberFormat);
  const parts = numberFormatter.formatToParts(1234.56);
  
  const decimalSeparator = parts.find(p => p.type === 'decimal')?.value || '.';
  const thousandsSeparator = parts.find(p => p.type === 'group')?.value || ',';
  
  const currencyFormatter = new Intl.NumberFormat(config.numberFormat, {
    style: 'currency',
    currency: config.currency || 'USD',
  });
  
  const currencySymbol = currencyFormatter.formatToParts(0).find(p => 
    p.type === 'currency'
  )?.value || '$';
  
  // Determine first day of week (0 = Sunday, 1 = Monday)
  // Most European countries use Monday, US/Canada use Sunday
  const firstDayOfWeek = ['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK'].includes(region || config.region || '') 
    ? 0 
    : 1;
  
  return {
    dateFormat: config.dateFormat || 'MM/dd/yyyy',
    timeFormat: 'HH:mm', // 24-hour format
    numberFormat: config.numberFormat || 'en-US',
    currency: config.currency || 'USD',
    currencySymbol,
    firstDayOfWeek,
    decimalSeparator,
    thousandsSeparator,
    direction: config.direction || 'ltr',
  };
}

/**
 * Format a date according to locale preferences
 */
export function formatDate(
  date: Date | string | number,
  language: LanguageCode,
  formatStr?: string
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const config = getLocaleConfig(language);
  const locale = dateFnsLocales[language] || dateFnsLocales.en;
  const formatPattern = formatStr || config.dateFormat || 'PP';
  
  try {
    return format(dateObj, formatPattern, { locale });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return format(dateObj, 'PP', { locale: enUS });
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  language: LanguageCode
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const locale = dateFnsLocales[language] || dateFnsLocales.en;
  
  try {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale });
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: enUS });
  }
}

/**
 * Format a number according to locale preferences
 */
export function formatNumber(
  value: number,
  language: LanguageCode,
  options?: Intl.NumberFormatOptions
): string {
  const config = getLocaleConfig(language);
  
  try {
    return new Intl.NumberFormat(config.numberFormat, options).format(value);
  } catch (error) {
    console.warn('Number formatting error:', error);
    return value.toString();
  }
}

/**
 * Format a currency amount according to locale preferences
 */
export function formatCurrency(
  amount: number,
  language: LanguageCode,
  currency?: string
): string {
  const config = getLocaleConfig(language);
  const currencyCode = currency || config.currency || 'USD';
  
  try {
    return new Intl.NumberFormat(config.numberFormat, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting error:', error);
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a percentage according to locale preferences
 */
export function formatPercentage(
  value: number,
  language: LanguageCode,
  decimals = 0
): string {
  const config = getLocaleConfig(language);
  
  try {
    return new Intl.NumberFormat(config.numberFormat, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  } catch (error) {
    console.warn('Percentage formatting error:', error);
    return `${value.toFixed(decimals)}%`;
  }
}

/**
 * Parse a localized number string back to a number
 */
export function parseNumber(
  value: string,
  language: LanguageCode
): number {
  const prefs = getCulturalPreferences(language);
  
  // Replace localized separators with standard ones
  const normalized = value
    .replace(new RegExp(`\\${prefs.thousandsSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${prefs.decimalSeparator}`, 'g'), '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get the text direction for a language
 */
export function getTextDirection(language: LanguageCode): 'ltr' | 'rtl' {
  const config = getLocaleConfig(language);
  return config.direction || 'ltr';
}

/**
 * Check if a language is RTL
 */
export function isRTL(language: LanguageCode): boolean {
  return getTextDirection(language) === 'rtl';
}

/**
 * Format file size according to locale
 */
export function formatFileSize(
  bytes: number,
  language: LanguageCode
): string {
  const config = getLocaleConfig(language);
  const formatter = new Intl.NumberFormat(config.numberFormat, {
    maximumFractionDigits: 2,
  });
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${formatter.format(size)} ${units[unitIndex]}`;
}

/**
 * Format duration in a human-readable format
 */
export function formatDuration(
  seconds: number,
  language: LanguageCode
): string {
  getLocaleConfig(language);
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }
  
  return parts.join(' ');
}
