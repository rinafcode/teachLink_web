'use client';

import { DEFAULT_TOAST_DURATION } from '@/constants/app.constants';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from 'react';
import { Toast, ToastType } from '@/components/ui/Toast';
import {
  createToastCircuitBreaker,
  type CircuitBreakerConfig,
  type CircuitBreakerMetrics,
} from '@/utils/circuitBreaker';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  error: (message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  getCircuitBreakerMetrics: () => CircuitBreakerMetrics;
  resetCircuitBreaker: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({
  children,
  circuitBreakerConfig,
}: {
  children: ReactNode;
  circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const circuitBreaker = useRef(
    createToastCircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitoringPeriod: 10000,
      maxConcurrentRequests: 10,
      ...circuitBreakerConfig,
    }),
  ).current;

  const removeToast = useCallback((id: string) => {
    setToasts((prev: ToastMessage[]) => prev.filter((toast: ToastMessage) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = DEFAULT_TOAST_DURATION) => {
      circuitBreaker
        .execute(
          () => {
            const id = Math.random().toString(36).substring(2, 11);
            setToasts((prev: ToastMessage[]) => [...prev, { id, type, message, duration }]);

            if (duration > 0) {
              setTimeout(() => {
                removeToast(id);
              }, duration);
            }
            return Promise.resolve();
          },
          () => {
            // Fallback: Log to console when circuit is open
            console.warn('[Toast Circuit Breaker] Toast notification suppressed:', {
              type,
              message,
            });
            // Optionally show a simplified fallback toast
            const id = Math.random().toString(36).substring(2, 11);
            setToasts((prev: ToastMessage[]) => [
              ...prev.slice(-2),
              {
                id,
                type: 'info',
                message: 'Notifications temporarily limited',
                duration: 3000,
              },
            ]);
            if (duration > 0) {
              setTimeout(() => {
                removeToast(id);
              }, duration);
            }
          },
        )
        .catch((error: unknown) => {
          console.error('[Toast Circuit Breaker] Error:', error);
        });
    },
    [removeToast, circuitBreaker],
  );

  const error = useCallback(
    (message: string, duration?: number) => addToast(message, 'error', duration),
    [addToast],
  );
  const success = useCallback(
    (message: string, duration?: number) => addToast(message, 'success', duration),
    [addToast],
  );
  const info = useCallback(
    (message: string, duration?: number) => addToast(message, 'info', duration),
    [addToast],
  );

  const getCircuitBreakerMetrics = useCallback(() => {
    return circuitBreaker.getMetrics();
  }, [circuitBreaker]);

  const resetCircuitBreaker = useCallback(() => {
    circuitBreaker.reset();
  }, [circuitBreaker]);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      error,
      success,
      info,
      getCircuitBreakerMetrics,
      resetCircuitBreaker,
    }),
    [
      toasts,
      addToast,
      removeToast,
      error,
      success,
      info,
      getCircuitBreakerMetrics,
      resetCircuitBreaker,
    ],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast: ToastMessage) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
