import { useCallback, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { createLogger } from '@/lib/logging';
const logger = createLogger('useProfileUpdate');

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
}

interface ProfileUpdateResponse {
  success: boolean;
  data: ProfileData & { updatedAt: string };
  message?: string;
  errors?: { field: string; message: string }[];
}

export function useProfileUpdate() {
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = useCallback(async (data: ProfileData) => {
    setIsLoading(true);
    try {
      const res = await apiClient.put<ProfileUpdateResponse>('/api/user/profile', data);

      if (!res.success) {
        throw res;
      }

      return res.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const apiErr = error as ProfileUpdateResponse;
        logger.error('Validation error updating profile', { errors: apiErr.errors });
        throw apiErr;
      }
      logger.error('Error updating profile', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(() => ({ updateProfile, isLoading }), [updateProfile, isLoading]);
}
