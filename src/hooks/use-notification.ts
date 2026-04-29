import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useNotification = () => {
  const success = useCallback((message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'bottom-right',
    });
  }, []);

  const error = useCallback((message: string | string[] | Error) => {
    const finalMessage = Array.isArray(message)
      ? message[0]
      : message instanceof Error
      ? message.message
      : message;

    toast.error(finalMessage || 'Something went wrong. Please try again.', {
      duration: 5000,
      position: 'bottom-right',
    });
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message, {
      position: 'bottom-right',
    });
  }, []);

  const dismiss = useCallback((id?: string) => {
    toast.dismiss(id);
  }, []);

  return { success, error, loading, dismiss, toast };
};
