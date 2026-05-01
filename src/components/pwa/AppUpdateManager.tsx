'use client';

import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { UpdateBanner } from '@/components/UpdateBanner';

export const AppUpdateManager: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA();
  const [show, setShow] = React.useState(true);

  if (!updateAvailable || !show) return null;

  return <UpdateBanner onUpdate={updateApp} onDismiss={() => setShow(false)} />;
};
