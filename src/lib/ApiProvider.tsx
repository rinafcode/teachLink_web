'use client';

import React, { useEffect } from 'react';
import { setupApiInterceptors } from '@/lib/apiInterceptors';

/**
 * ApiProvider - Sets up API interceptors on client-side initialization
 * This component should wrap your app to ensure interceptors are configured
 */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Setup interceptors once on client mount
    setupApiInterceptors();
  }, []);

  return <>{children}</>;
};
