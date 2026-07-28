'use client';

import { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Shield, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import {
  createBiometricCredential,
  isPlatformAuthenticatorAvailable,
} from '@/lib/auth/biometric';

interface BiometricEnrollmentProps {
  userId: string;
  userName: string;
  token: string;
  onComplete?: () => void;
  onSkip?: () => void;
  mode?: 'enroll' | 're-enroll';
}

type EnrollmentState = 'checking' | 'ready' | 'prompting' | 'success' | 'error' | 'unsupported';

export function BiometricEnrollment({
  userId,
  userName,
  token,
  onComplete,
  onSkip,
  mode = 'enroll',
}: BiometricEnrollmentProps) {
  const [state, setState] = useState<EnrollmentState>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');

  const isReEnroll = mode === 're-enroll';

  // Check platform authenticator availability on mount
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const available = await isPlatformAuthenticatorAvailable();
        if (cancelled) return;
        setState(available ? 'ready' : 'unsupported');
      } catch {
        if (cancelled) return;
        setState('unsupported');
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  const handleEnroll = useCallback(async () => {
    setState('prompting');
    setErrorMessage('');

    try {
      // Step 1: Get enrollment options from server
      const startResponse = await apiClient.post(
        '/api/auth/biometric/enroll',
        { userId, userName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { options } = startResponse as any;

      // Step 2: Create credential via WebAuthn (browser prompt)
      const credential = await createBiometricCredential(options);

      // Step 3: Send credential to server for verification
      const completeResponse = await apiClient.put(
        '/api/auth/biometric/enroll',
        { userId, credential },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const result = completeResponse as any;
      setDeviceLabel(result.credential?.deviceLabel ?? '');
      setState('success');
    } catch (error: any) {
      const message =
        error?.message ??
        (typeof error === 'string' ? error : 'Biometric enrollment failed. Please try again.');
      setErrorMessage(message);
      setState('error');
    }
  }, [userId, userName, token]);

  const handleReEnroll = useCallback(async () => {
    setState('prompting');
    setErrorMessage('');

    try {
      // Step 1: Get re-enrollment options from server (password already verified)
      const startResponse = await apiClient.post(
        '/api/auth/biometric/re-enroll',
        { userId, userName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { options } = startResponse as any;

      // Step 2: Create credential via WebAuthn (browser prompt)
      const credential = await createBiometricCredential(options);

      // Step 3: Send credential to server for verification
      const completeResponse = await apiClient.put(
        '/api/auth/biometric/re-enroll',
        { userId, credential },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const result = completeResponse as any;
      setDeviceLabel(result.credential?.deviceLabel ?? '');
      setState('success');
    } catch (error: any) {
      const message =
        error?.message ??
        (typeof error === 'string' ? error : 'Biometric re-enrollment failed. Please try again.');
      setErrorMessage(message);
      setState('error');
    }
  }, [userId, userName, token]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {state === 'checking' && (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500">Checking device compatibility…</p>
          </motion.div>
        )}

        {state === 'unsupported' && (
          <motion.div
            key="unsupported"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
          >
            <Smartphone className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Biometric not available
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Your device does not support platform biometric authentication (Touch ID, Face ID,
              Windows Hello, or fingerprint reader). You can continue using password-based login.
            </p>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors"
              >
                Continue with password
              </button>
            )}
          </motion.div>
        )}

        {state === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center"
          >
            <Fingerprint className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {isReEnroll ? 'Re-enroll Biometric' : 'Set up Biometric Login'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {isReEnroll
                ? 'Your device fingerprint appears to have changed. Please re-enroll your biometric to continue using fingerprint/face login.'
                : "Use your device's fingerprint, face, or iris scanner to sign in quickly and securely."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={isReEnroll ? handleReEnroll : handleEnroll}
                className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                {isReEnroll ? 'Re-enroll Now' : 'Enroll Biometric'}
              </button>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
        )}

        {state === 'prompting' && (
          <motion.div
            key="prompting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Fingerprint className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Verify your identity
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
              Please use your device's biometric sensor to complete the enrollment.
            </p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              {isReEnroll ? 'Re-enrollment Successful' : 'Biometric Enrolled'}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Your biometric credential has been saved successfully.
            </p>
            {deviceLabel && (
              <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                Device: {deviceLabel}
              </p>
            )}
            {onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                Continue
              </button>
            )}
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
          >
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Enrollment Failed
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={isReEnroll ? handleReEnroll : handleEnroll}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}