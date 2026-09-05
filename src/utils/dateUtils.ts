/**
 * Locale-aware date formatting utilities using the built-in Intl.DateTimeFormat API.
 * Pass an explicit locale to override; omit it to use the browser/system locale.
 */

import { getDateTimeFormat, getRelativeTimeFormat } from './intlCache';

export function isValidDate(date: Date | string | number): boolean {
  const parsed = new Date(date);
  return !Number.isNaN(parsed.getTime());
}

export function formatDate(
  date: Date | string | number,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
  fallback = '',
): string {
  if (!isValidDate(date)) return fallback;
  return getDateTimeFormat(locale, options).format(new Date(date));
}

export function formatShortDate(
  date: Date | string | number,
  locale?: string,
  fallback = '',
): string {
  return formatDate(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }, fallback);
}

export function formatTime(date: Date | string | number, locale?: string, fallback = ''): string {
  if (!isValidDate(date)) return fallback;
  return getDateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function formatRelative(
  date: Date | string | number,
  locale?: string,
  fallback = '',
): string {
  if (!isValidDate(date)) return fallback;
  const diff = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const rtf = getRelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diff) < 60) return rtf.format(diff, 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}
