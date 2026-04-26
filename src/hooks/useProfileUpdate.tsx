import { useErrorHandling } from './useErrorHandling';
import { useToast } from '@/context/ToastContext';

interface ProfileData {
  name?: string;
  email: string;
  bio?: string;
  avatar?: File | null;
  notifications?: {
    email: boolean;
    push: boolean;
  };
  theme?: 'light' | 'dark';
  [key: string]: unknown;
}

export function useProfileUpdate() {
  const { execute, isLoading } = useErrorHandling();
  const { success } = useToast();

  const updateProfile = async (data: ProfileData) => {
    const result = await execute(async () => {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // You could conditionally reject here to test error path
          resolve(true);
        }, 1500);
      });
      return true;
    });

    if (result) {
      success('Profile updated successfully!');
      return true;
    }
    return false;
  };

  return { updateProfile, isLoading };
}
