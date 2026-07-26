'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, X, AlertTriangle, Lock } from 'lucide-react';
import { BiometricEnrollment } from './BiometricEnrollment';

interface BiometricReEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onComplete: () => void;
}

type Step = 'verify_password' | 'enrolling' | 'done';

export function BiometricReEnrollModal({
  isOpen,
  onClose,
  email,
  onComplete,
}: BiometricReEnrollModalProps) {
  const [step, setStep] = useState<Step>('verify_password');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState('');

  const handlePasswordVerify = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsVerifying(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/auth/biometric/re-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.message || 'Verification failed');
        setIsVerifying(false);
        return;
      }

      // Store user info and token from the response
      setUserId(data.userId);
      setUserName(email.split('@')[0]);

      // Sign in the user temporarily for re-enrollment
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (loginData.token) {
        setToken(loginData.token);
        localStorage.setItem('auth_token', loginData.token);
      }

      setStep('enrolling');
    } catch {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnrollmentComplete = () => {
    setStep('done');
  };

  const handleDone = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const resetState = () => {
    setStep('verify_password');
    setPassword('');
    setPasswordError('');
    setUserId('');
    setUserName('');
    setToken('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => { resetState(); onClose(); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step: Verify Password */}
            {step === 'verify_password' && (
              <div className="py-4">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                  Biometric Re-enrollment Required
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                  Your device fingerprint appears to have changed. To continue using biometric
                  login, please verify your password and re-enroll.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePasswordVerify();
                        }}
                        placeholder="Enter your password to verify identity"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handlePasswordVerify}
                    disabled={isVerifying}
                    className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Verify & Re-enroll
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Skip — use password only
                  </button>
                </div>
              </div>
            )}

            {/* Step: Enrolling */}
            {step === 'enrolling' && userId && token && (
              <div className="py-4">
                <BiometricEnrollment
                  userId={userId}
                  userName={userName}
                  token={token}
                  mode="re-enroll"
                  onComplete={handleEnrollmentComplete}
                  onSkip={handleSkip}
                />
              </div>
            )}

            {/* Step: Done */}
            {step === 'done' && (
              <div className="py-4 text-center">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Fingerprint className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Re-enrollment Complete
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Your new biometric credential has been saved. You can now sign in with your
                  fingerprint or face.
                </p>

                <button
                  type="button"
                  onClick={handleDone}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}