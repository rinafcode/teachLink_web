import { useState, useEffect, useCallback } from 'react';

interface MobileOptimizationState {
  isMobile: boolean;
  isOnline: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
}

export function useMobileOptimization() {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isOnline: true,
    deviceType: 'desktop',
    orientation: 'portrait',
    touchSupported: false,
  });

  const checkDevice = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
    const isMobile = deviceType === 'mobile';
    const orientation = height > width ? 'portrait' : 'landscape';
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    setState(prev => ({
      ...prev,
      isMobile,
      deviceType,
      orientation,
      touchSupported
    }));
  }, []);

  const updateOnlineStatus = useCallback(() => {
    setState(prev => ({ ...prev, isOnline: navigator.onLine }));
  }, []);

  useEffect(() => {
    checkDevice();
    updateOnlineStatus();

    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [checkDevice, updateOnlineStatus]);

  return state;
}