'use client';

import React from 'react';
import { Bell, Camera } from 'lucide-react';

export const NativeIntegrationLayer: React.FC = () => {
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('TeachLink', {
          body: 'You will now receive updates and reminders!',
          icon: '/icons/icon-192x192.png',
        });
      }
    }
  };

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // In a real app, this would open a camera modal or start a scan
      // Stop stream immediately for demo
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {}
  };

  return (
    <div className="hidden">
      {/* 
        This component can provide utility functions to other components 
        via a context or simply by being present to handle global native events.
        For now, it's a placeholder for native feature logic.
      */}
    </div>
  );
};

// Hook for using native features
export const useNativeFeatures = () => {
  const showNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  };

  const openCamera = async () => {
    return await navigator.mediaDevices.getUserMedia({ video: true });
  };

  return { showNotification, openCamera };
};
