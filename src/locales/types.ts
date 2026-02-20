/**
 * Type definitions for internationalization system
 */

export type LanguageCode = 
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'ar' // Arabic (RTL)
  | 'he' // Hebrew (RTL)
  | 'ja' // Japanese
  | 'zh' // Chinese
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'it' // Italian
  | 'ko'; // Korean

export type RegionCode = 
  | 'US' | 'GB' | 'CA' | 'AU' // English regions
  | 'ES' | 'MX' | 'AR' | 'CO' // Spanish regions
  | 'FR' | 'BE' | 'CH' // French regions
  | 'DE' | 'AT' | 'CH' // German regions
  | 'SA' | 'AE' | 'EG' // Arabic regions
  | 'IL' // Hebrew region
  | 'JP' // Japanese region
  | 'CN' | 'TW' | 'HK' // Chinese regions
  | 'BR' | 'PT' // Portuguese regions
  | 'RU' // Russian region
  | 'IT' // Italian region
  | 'KR'; // Korean region

export interface LocaleConfig {
  language: LanguageCode;
  region?: RegionCode;
  currency?: string;
  dateFormat?: string;
  numberFormat?: string;
  direction?: 'ltr' | 'rtl';
  name: string;
  nativeName: string;
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface LocaleData {
  config: LocaleConfig;
  translations: Translations;
}

export interface CulturalPreferences {
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
  currencySymbol: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  decimalSeparator: string;
  thousandsSeparator: string;
  direction: 'ltr' | 'rtl';
}
