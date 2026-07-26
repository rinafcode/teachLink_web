'use client';

import { useState, useEffect, useCallback } from 'react';
import { Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import {
  authenticateWithBiometric,
  isPlatformAuthenticatorAvailable,
} from '@/lib/auth/biometric';
import { useRouter } from 'next/navigation';

interface BiometricLoginButtonProps {
  email: string;
  onSuccess?: () => void;
  onRequireReEnroll?: () => void;
  className?: string;
}

type BiometricState = 'idle' | 'loading' | 'error' | 'no_credentials';

export function BiometricLoginButton({
  email,
  onSuccess,
  onRequireReEnroll,
  className = '',
}: BiometricLoginButtonProps) {
  const [state, setState] = useState<BiometricState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [available, setAvailable] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    isPlatformAuthenticatorAvailable().then((avail) => {
      if (!cancelled) setAvailable(avail);
    });
    return () => { cancelled = true; };
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    if (!email) {
      setErrorMessage('Please enter your email first');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      // Step 1: Get authentication options from server
      const startResponse = await apiClient.post(
        '/api/auth/biometric/authenticate',
        { email },
      );

      const result = startResponse as any;

      // If no credentials found, notify parent
      if (startResponse.status === 404) {
        setState('no_credentials');
        return;
      }

      const { options } = result;

      // Step 2: Authenticate with biometric (browser prompt)
      const credential = await authenticateWithBiometric(options);

      // Step 3: Verify credential with server and get JWT
      const completeResponse = await apiClient.put(
        '/api/auth/biometric/authenticate',
        { email, credential },
      );

      const authResult = completeResponse as any;

      // Store token and redirect
      if (authResult.token) {
        localStorage.setItem('auth_token', authResult.token);
        onSuccess?.();
        router.push('/dashboard');
      }
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;

      if (status === 404) {
        setState('no_credentials');
        return;
      }

      // Check if credential was not found (device fingerprint changed)
      if (
        error?.message?.includes('not found') ||
        error?.message?.includes('deactivated')
      ) {
        setState('no_credentials');
        onRequireReEnroll?.();
        return;
      }

      const message =
        error?.message ??
        (typeof error === 'string' ? error : 'Biometric login failed. Please try again.');
      setErrorMessage(message);
      setState('error');
    }
  }, [email, onSuccess, onRequireReEnroll, router]);

  if (!available) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleBiometricLogin}
        disabled={state === 'loading'}
        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {state === 'loading' ? (
          <>
            <div className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
            Verifying biometric…
          </>
        ) : (
          <>
            <Fingerprint className="w-5 h-5" />
            Sign in with biometric
          </>
        )}
      </button>

      {state === 'error' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 mt-2 text-center"
        >
          {errorMessage}
        </motion.p>
      )}

      {state === 'no_credentials' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-amber-500 mt-2 text-center"
        >
          No biometric credentials found. Sign in with password and enroll first.
        </motion.p>
      )}
    </div>
  );
}