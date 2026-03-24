'use client';

import React from 'react';
import { AccessibilityNavigator } from './AccessibilityNavigator';
import { ScreenReaderOptimizer } from './ScreenReaderOptimizer';
import { ColorContrastChecker } from './ColorContrastChecker';
import { AccessibilityTester } from './AccessibilityTester';

interface AccessibilityProviderProps {
  children: React.ReactNode;
  enableNavigator?: boolean;
  enableScreenReader?: boolean;
  enableContrastChecker?: boolean;
  enableTester?: boolean;
  autoCheckContrast?: boolean;
  autoCheckAccessibility?: boolean;
}

/**
 * Comprehensive accessibility provider that wraps the application
 * with all accessibility features enabled
 */
export function AccessibilityProvider({
  children,
  enableNavigator = true,
  enableScreenReader = true,
  enableContrastChecker = true,
  enableTester = true,
  autoCheckContrast = false,
  autoCheckAccessibility = false,
}: AccessibilityProviderProps) {
  return (
    <>
      {/* Screen Reader Optimization */}
      {enableScreenReader ? (
        <ScreenReaderOptimizer enableAnnouncements={true}>
          {children}
        </ScreenReaderOptimizer>
      ) : (
        children
      )}

      {/* Keyboard Navigation */}
      {enableNavigator && <AccessibilityNavigator showLandmarks={true} />}

      {/* Color Contrast Checker */}
      {enableContrastChecker && (
        <ColorContrastChecker autoCheck={autoCheckContrast} showWidget={true} />
      )}

      {/* Accessibility Tester */}
      {enableTester && (
        <AccessibilityTester autoCheck={autoCheckAccessibility} showWidget={true} />
      )}
    </>
  );
}

/**
 * Hook to access accessibility features programmatically
 */
export { useAccessibilityCheck, useScreenReaderAnnouncement, useFocusTrap, useKeyboardNavigation } from '@/hooks/useAccessibility';

/**
 * Utility components for specific use cases
 */
export {
  AccessibleDescription,
  AccessibleLoading,
  AccessibleError,
  AccessibleSuccess,
  AccessibleProgress,
} from './ScreenReaderOptimizer';
