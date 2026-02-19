/**
 * CulturalAdaptationManager - Manages cultural adaptations for dates, numbers, currencies
 */

'use client';

import { useEffect } from 'react';
import { useInternationalization } from '@/hooks/useInternationalization';

interface CulturalAdaptationManagerProps {
  /**
   * Whether to apply cultural adaptations automatically
   */
  autoApply?: boolean;
  
  /**
   * Custom date format override
   */
  dateFormat?: string;
  
  /**
   * Custom currency override
   */
  currency?: string;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
}

export function CulturalAdaptationManager({
  autoApply = true,
  dateFormat,
  currency,
  children,
}: CulturalAdaptationManagerProps) {
  const { preferences, language, direction, isRTL } = useInternationalization();

  // Apply RTL/LTR direction to document
  useEffect(() => {
    if (autoApply) {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
    }
  }, [direction, language, autoApply]);

  // Apply cultural CSS variables
  useEffect(() => {
    if (autoApply && typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Set CSS custom properties for cultural preferences
      root.style.setProperty('--i18n-direction', direction);
      root.style.setProperty('--i18n-decimal-separator', `"${preferences.decimalSeparator}"`);
      root.style.setProperty('--i18n-thousands-separator', `"${preferences.thousandsSeparator}"`);
      root.style.setProperty('--i18n-currency-symbol', `"${preferences.currencySymbol}"`);
      root.style.setProperty('--i18n-first-day-of-week', preferences.firstDayOfWeek.toString());
    }
  }, [preferences, direction, autoApply]);

  return (
    <div 
      dir={direction}
      lang={language}
      className={isRTL ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  );
}

/**
 * Hook to access cultural preferences
 */
export function useCulturalPreferences() {
  const { preferences, formatDate, formatNumber, formatCurrency, direction, isRTL } = 
    useInternationalization();

  return {
    preferences,
    formatDate,
    formatNumber,
    formatCurrency,
    direction,
    isRTL,
  };
}
