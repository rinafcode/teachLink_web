'use client';

import React from 'react';
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

export default function DynamicTheming() {
  // Hook applies theme to root when state changes.
  useThemeCustomization();

  // This component only ensures the hook runs and the theme is applied at runtime.
  return null;
}
