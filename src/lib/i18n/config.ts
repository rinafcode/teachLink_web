import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import { DEFAULT_LANGUAGE, getAvailableLanguages } from '@/locales/config';
import type { LanguageCode } from '@/locales/types';

const RTL_LANGUAGES = new Set<LanguageCode>(['ar', 'he']);
const SUPPORTED_LANGUAGES = new Set<LanguageCode>(getAvailableLanguages());

function normalizeLanguage(language: string): LanguageCode {
  if (SUPPORTED_LANGUAGES.has(language as LanguageCode)) {
    return language as LanguageCode;
  }
  return DEFAULT_LANGUAGE;
}

export function getHtmlDir(language: string): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.has(normalizeLanguage(language)) ? 'rtl' : 'ltr';
}

export async function loadLocale(language: LanguageCode): Promise<void> {
  const normalized = normalizeLanguage(language);

  if (i18n.hasResourceBundle(normalized, 'translation')) {
    return;
  }

  try {
    const localeModule = await import(`@/locales/${normalized}.json`);
    i18n.addResourceBundle(
      normalized,
      'translation',
      localeModule.default ?? localeModule,
      true,
      true,
    );
  } catch {
    // Fallback keeps runtime stable when a locale file is missing.
    i18n.addResourceBundle(normalized, 'translation', en, true, true);
  }
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    resources: {
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
