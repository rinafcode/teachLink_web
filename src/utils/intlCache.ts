/**
 * Intl Formatter Cache - Caches Intl.NumberFormat and Intl.DateTimeFormat instances
 */

function serializeCacheKey(
  locale: string,
  options: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions,
): string {
  return `${locale}|${JSON.stringify(options)}`;
}

const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function getNumberFormat(
  locale: string | undefined,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const resolvedLocale = locale ?? 'en-US';
  const key = serializeCacheKey(resolvedLocale, options ?? {});
  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(resolvedLocale, options);
    numberFormatterCache.set(key, formatter);
  }
  return formatter;
}

export function getDateTimeFormat(
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const resolvedLocale = locale ?? 'en-US';
  const key = serializeCacheKey(resolvedLocale, options ?? {});
  let formatter = dateTimeFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(resolvedLocale, options);
    dateTimeFormatterCache.set(key, formatter);
  }
  return formatter;
}

export function clearIntlCache(): void {
  numberFormatterCache.clear();
  dateTimeFormatterCache.clear();
}

export function getNumberFormatCacheSize(): number {
  return numberFormatterCache.size;
}

export function getDateTimeFormatCacheSize(): number {
  return dateTimeFormatterCache.size;
}
