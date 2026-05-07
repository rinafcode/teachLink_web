import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PWA Service Worker configuration
  headers: async () => [
    {
      source: '/service-worker.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],
  // Workbox configuration for PWA
  workbox: {
    // Caching strategies
    runtimeCaching: [
      // API requests - NetworkFirst
      {
        urlPattern: /^https?.*\/api\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
      // Static assets - StaleWhileRevalidate
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'static-resources' },
      },
      // Images - CacheFirst
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // Fonts - CacheFirst
      {
        urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
};

export default nextConfig;
