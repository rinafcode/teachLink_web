'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileUser } from '@/app/profile/profile-data';
import { profileUser as defaultProfileUser } from '@/app/profile/profile-data';
import { useToast } from '@/context/ToastContext';

export function useUserProfile(initialUser?: ProfileUser) {
  const [user, setUser] = useState<ProfileUser>(initialUser ?? defaultProfileUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser);
  const [error, setError] = useState<Error | null>(null);

  let successFn: ((msg: string) => void) | undefined;
  let toastErrorFn: ((msg: string) => void) | undefined;

  try {
    const toastContext = useToast();
    successFn = toastContext.success;
    toastErrorFn = toastContext.error;
  } catch {
    // Fallback if ToastProvider is not present in test environment
  }

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.statusText}`);
      }
      const result = await res.json();
      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) {
      fetchProfile();
    }
  }, [initialUser, fetchProfile]);

  const updateProfile = useCallback(
    async (updatedData: Partial<ProfileUser>): Promise<boolean> => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });

        if (!res.ok) {
          throw new Error('Failed to update profile');
        }

        const result = await res.json();
        if (result.success && result.data) {
          setUser(result.data);
          if (successFn) successFn('Profile updated successfully!');
          return true;
        } else {
          throw new Error(result.message || 'Failed to update profile');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error updating profile';
        if (toastErrorFn) toastErrorFn(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [successFn, toastErrorFn],
  );

  return {
    user,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
