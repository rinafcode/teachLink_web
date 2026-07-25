// src/components/ui/EnvironmentBanner.tsx
import React from 'react';
import { getEnvironment } from '@/config/environment';

export const EnvironmentBanner: React.FC = () => {
  const env = getEnvironment();
  if (env === 'production') return null; // No banner for production

  const envLabel = env.charAt(0).toUpperCase() + env.slice(1);
  const className = `env-banner env-${env}`;
  return (
    <div className={className} role="alert" aria-live="polite">
      {envLabel} Environment
    </div>
  );
};
