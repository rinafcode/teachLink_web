import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nProvider, useInternationalization } from '../useInternationalization';

const STORAGE_KEY = 'i18n:language';

vi.mock('@/lib/i18n/config', () => ({
  __esModule: true,
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
    hasResourceBundle: vi.fn().mockReturnValue(true),
    isInitialized: true,
  },
  loadLocale: vi.fn().mockResolvedValue(undefined),
  getHtmlDir: vi.fn().mockReturnValue('ltr'),
}));

vi.mock('@/locales/translationManager', () => ({
  loadTranslations: vi.fn().mockResolvedValue({ common: { test: 'Test' } }),
  getTranslation: vi.fn((_t: unknown, key: string) => key),
  getMissingTranslations: vi.fn().mockReturnValue([]),
}));

vi.mock('@/utils/i18nUtils', () => ({
  getCulturalPreferences: vi.fn().mockReturnValue({
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
    firstDayOfWeek: 0,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    direction: 'ltr',
  }),
  formatDate: vi.fn(),
  formatRelativeTime: vi.fn(),
  preloadDateFnsLocale: vi.fn(),
  formatNumber: vi.fn(),
  formatCurrency: vi.fn(),
  formatPercentage: vi.fn(),
  parseNumber: vi.fn(),
  getTextDirection: vi
    .fn()
    .mockImplementation((lang: string) => (lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr')),
  isRTL: vi.fn().mockImplementation((lang: string) => lang === 'ar' || lang === 'he'),
  formatFileSize: vi.fn(),
  formatDuration: vi.fn(),
}));

vi.mock('@/lib/logging', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useInternationalization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const setup = (defaultLanguage = 'en') =>
    renderHook(() => useInternationalization(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <I18nProvider defaultLanguage={defaultLanguage as any}>
          {children}
        </I18nProvider>
      ),
    });

  describe('localStorage persistence', () => {
    it('restores saved language from localStorage on mount', async () => {
      localStorage.setItem(STORAGE_KEY, 'es');

      const { result } = setup();

      await waitFor(() => {
        expect(result.current.language).toBe('es');
      });
    });

    it('persists language to localStorage when changeLanguage is called', async () => {
      const { result } = setup('en');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe('es');
    });

    it('uses default language when no saved language exists', async () => {
      const { result } = setup('en');

      await waitFor(() => {
        expect(result.current.language).toBe('en');
      });
    });

    it('ignores invalid saved language and falls back to default', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid_lang');

      const { result } = setup('en');

      await waitFor(() => {
        expect(result.current.language).toBe('en');
      });
    });

    it('survives re-mount simulating page reload', async () => {
      const { result, unmount } = setup('en');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe('es');

      unmount();

      const { result: result2 } = setup('en');

      await waitFor(() => {
        expect(result2.current.language).toBe('es');
      });
    });

    it('updates document.documentElement lang and dir for RTL language', async () => {
      const { result } = setup('en');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('ar');
      });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('sets document.cookie when language changes', async () => {
      const { result } = setup('en');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(document.cookie).toMatch(/i18n:language=es/);
    });

    it('continues functioning when localStorage.setItem throws', async () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('Storage full');
        });

      const { result } = setup('en');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(setItemSpy).toHaveBeenCalled();
      expect(result.current.language).toBe('es');

      setItemSpy.mockRestore();
    });
  });

  describe('fallback when used outside provider', () => {
    it('returns default values', () => {
      const { result } = renderHook(() => useInternationalization());

      expect(result.current.language).toBe('en');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('changeLanguage is a no-op outside provider', async () => {
      const { result } = renderHook(() => useInternationalization());

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
