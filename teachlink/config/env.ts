export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'Actual api link',
    timeout: 30000,
    retryAttempts: 3,
    cacheTime: 5 * 60 * 1000, 
  },

  // Offline Configuration
  offline: {
    maxStorage: 5000 * 1024 * 1024,  
    cleanupThreshold: 0.9,
    cacheDuration: 7 * 24 * 60 * 60 * 1000, 
    syncInterval: 5 * 60 * 1000, 
  },

  // Video Configuration
  video: {
    defaultQuality: '720p',
    bufferSize: 10 * 1024 * 1024,  
    preloadDuration: 30,  
    maxBitrate: 2500000,  
  },

  // Mobile Optimization
  mobile: {
    swipeThreshold: 50, 
    tapThreshold: 10,  
    longPressDuration: 500,  
    vibrationEnabled: true,
  },

  // Feature Flags
  features: {
    offlineMode: true,
    backgroundSync: true,
    pushNotifications: true,
    analytics: true,
  },
};

export type Config = typeof config;