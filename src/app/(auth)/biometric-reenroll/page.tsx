'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BiometricEnrollment } from '@/app/components/auth/BiometricEnrollment';

type Step = 'verify' | 'enrolling' | 'done';

export default function BiometricReEnrollPage() {
  const [step, setStep] = useState<Step>('verify');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Step 1: Initiate re-enrollment (verifies password + deactivates old credentials)
      const reEnrollResponse = await fetch('/api/auth/biometric/re-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const reEnrollData = await reEnrollResponse.json();

      if (!reEnrollResponse.ok) {
        setError(reEnrollData.message || 'Verification failed');
        setIsVerifying(false);
        return;
      }

      setUserId(reEnrollData.userId);
      setUserName(email.split('@')[0]);

      // Step 2: Sign in to get a token for the enrollment API
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setError('Failed to authenticate. Please try again.');
        setIsVerifying(false);
        return;
      }

      if (loginData.token) {
        setToken(loginData.token);
        localStorage.setItem('auth_token', loginData.token);
      }

      setStep('enrolling');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnrollmentComplete = () => {
    setStep('done');
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Step: Verify Identity */}
          {step === 'verify' && (
            <div>
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                Biometric Re-enrollment
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-8">
                Your device fingerprint has changed. To restore biometric login, verify your
                identity with your password and re-enroll.
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
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
                      Verify & Continue
                    </>
                  )}
                </button>

                <Link
                  href="/login"
                  className="block text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Skip — use password only
                </Link>
              </form>
            </div>
          )}

          {/* Step: Enrolling */}
          {step === 'enrolling' && userId && token && (
            <div>
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
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Fingerprint className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Re-enrollment Complete
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                Your new biometric credential has been saved. You can now sign in with your
                fingerprint or face.
              </p>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}