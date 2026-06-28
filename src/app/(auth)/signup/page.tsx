'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupSchema, SignupFormData } from '../../lib/validationSchemas';
import { FormError, FieldError } from '../../../components/forms/FormError';
import { SubmitButton } from '../../../components/forms/SubmitButton';
import { useMutation } from '../../../hooks/useMutation';
import { apiClient } from '@/lib/api';
import { DiscordButton } from '@/app/components/auth/DiscordButton';
import { GoogleButton } from '@/app/components/auth/GoogleButton';
import { GitHubButton } from '@/app/components/auth/GitHubButton';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleDiscordSignup = () => {
    window.location.href = '/api/auth/discord';
  };

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  const handleGitHubSignup = () => {
    window.location.href = '/api/auth/github';
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const signupMutation = useMutation(
    async (data: SignupFormData) => {
      return apiClient.post<{ verification?: { required: boolean } }>('/api/auth/signup', data);
    },
    {
      onSuccess: (data, variables) => {
        if (data.verification?.required) {
          setSuccessMessage(
            'Account created successfully! Check your email to verify your account.',
          );
          setTimeout(
            () => router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`),
            1500,
          );
          return;
        }

        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/onboarding'), 1500);
      },
    },
  );

  const onSubmit = async (data: SignupFormData) => {
    await signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900">TeachLink</span>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Create an account</h1>
            <p className="text-gray-600 text-center">Start your journey with TeachLink today</p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={`w-full px-4 py-3 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all`}
                aria-invalid={!!errors.name}
                aria-describedby="name-error"
                {...register('name')}
              />
              <FieldError error={errors.name?.message} id="name-error" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                className={`w-full px-4 py-3 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all`}
                aria-invalid={!!errors.email}
                aria-describedby="email-error"
                {...register('email')}
              />
              <FieldError error={errors.email?.message} id="email-error" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all pr-12`}
                  aria-invalid={!!errors.password}
                  aria-describedby="password-error"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <FieldError error={errors.password?.message} id="password-error" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all pr-12`}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby="confirmPassword-error"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <FieldError error={errors.confirmPassword?.message} id="confirmPassword-error" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter referral code"
                className={`w-full px-4 py-3 border ${
                  errors.referralCode ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all uppercase`}
                aria-invalid={!!errors.referralCode}
                aria-describedby="referralCode-error"
                {...register('referralCode')}
              />
              <FieldError error={errors.referralCode?.message} id="referralCode-error" />
              <p className="text-xs text-gray-500 mt-1">
                Have a referral code? Enter it here for benefits.
              </p>
            </div>

            <FormError error={signupMutation.error?.message} id="signup-api-error" />

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-600">{successMessage}</p>
              </motion.div>
            )}

            <SubmitButton
              isLoading={signupMutation.isLoading}
              loadingText="Creating account…"
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create account
            </SubmitButton>
          </motion.form>

          {/* Sign in link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-gray-600"
          >
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </motion.p>
          <p className="mt-3 text-center text-sm text-gray-600">
            Need to verify email or restore access?{' '}
            <Link href="/verify-email" className="text-blue-600 hover:text-blue-700 font-medium">
              Open recovery
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-3 gap-4">
            <DiscordButton onClick={handleDiscordSignup} />
            <GoogleButton onClick={handleGoogleSignup} />

            <GitHubButton onClick={handleGitHubSignup} />
          </div>
        </div>
      </motion.div>

      {/* Right side - Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop)',
          }}
        />

        {/* Dark overlay - only on content area */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center px-8 py-12 bg-black/40 backdrop-blur-sm rounded-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
          >
            Join the knowledge economy
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg text-white leading-relaxed mb-8"
          >
            Share your expertise, learn from others, and earn rewards on TeachLink.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all"
            >
              Already have an account? Sign in
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
