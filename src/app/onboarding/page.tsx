'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  GraduationCap,
  Calendar,
  Wallet,
  LogOut,
  Globe,
  Bell,
  FileText,
  Loader2,
  BookOpen,
} from 'lucide-react';

import { FormWizardController } from '@/form-management/components';
import { FormStateManager } from '@/form-management/state/form-state-manager';
import { ValidationEngineImpl } from '@/form-management/validation/validation-engine';
import { useNotification } from '@/hooks/use-notification';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { EventProperties } from '@/utils/analytics';
import type { WizardStep, FieldDescriptor, FormState } from '@/form-management/types/core';
import { createLogger } from '@/lib/logging';
const logger = createLogger('OnboardingPage');

// Define field configuration for onboarding
const onboardingFields: FieldDescriptor[] = [
  {
    id: 'username',
    type: 'text',
    label: 'Username',
    placeholder: 'Choose a unique username',
    required: true,
    validation: [
      { type: 'required', message: 'Username is required' },
      {
        type: 'minLength',
        message: 'Username must be at least 3 characters',
        params: { minLength: 3 },
      },
      {
        type: 'pattern',
        message: 'Username can only contain letters, numbers, and underscores',
        params: { pattern: '^[a-zA-Z0-9_]+$' },
      },
    ],
  },
  {
    id: 'role',
    type: 'select',
    label: 'Select Role',
    required: true,
    validation: [{ type: 'required', message: 'Please select a role to continue' }],
  },
  {
    id: 'dob',
    type: 'date',
    label: 'Date of Birth',
    required: true,
    validation: [{ type: 'required', message: 'Date of birth is required' }],
  },
  {
    id: 'bio',
    type: 'textarea',
    label: 'Short Bio',
    placeholder: 'Tell us a bit about yourself, your background, or what you want to achieve...',
    required: false,
    validation: [
      {
        type: 'maxLength',
        message: 'Bio must be under 200 characters',
        params: { maxLength: 200 },
      },
    ],
  },
  {
    id: 'interest',
    type: 'select',
    label: 'Learning / Teaching Interest',
    required: true,
    validation: [{ type: 'required', message: 'Please select your primary area of interest' }],
  },
  {
    id: 'notifications',
    type: 'select',
    label: 'Notification Preference',
    required: true,
    validation: [{ type: 'required', message: 'Please select a notification channel' }],
  },
  {
    id: 'language',
    type: 'select',
    label: 'Preferred Language',
    required: true,
    validation: [{ type: 'required', message: 'Please select your preferred language' }],
  },
  {
    id: 'newsletter',
    type: 'checkbox',
    label: 'Subscribe to newsletter',
    required: false,
    validation: [],
  },
  {
    id: 'walletAddress',
    type: 'text',
    label: 'Starknet Wallet Address',
    required: false,
    validation: [],
  },
];

// Define Wizard steps
const onboardingSteps: WizardStep[] = [
  {
    index: 0,
    id: 'personal-setup',
    title: 'Personal & Role',
    fields: ['username', 'role', 'dob', 'bio'],
    isComplete: false,
    isValid: false,
  },
  {
    index: 1,
    id: 'preferences',
    title: 'Preferences',
    fields: ['interest', 'notifications', 'language', 'newsletter'],
    isComplete: false,
    isValid: false,
  },
  {
    index: 2,
    id: 'wallet-integration',
    title: 'Web3 Wallet',
    fields: ['walletAddress'],
    isComplete: false,
    isValid: false,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { success, error, loading, dismiss } = useNotification();
  const { track } = useAnalytics({ context: { feature: 'onboarding' }, trackPageView: false });
  const [currentStep, setCurrentStep] = useState<WizardStep>(onboardingSteps[0]);
  const [hasFinishedOnboarding, setHasFinishedOnboarding] = useState(false);
  const currentStepRef = React.useRef<WizardStep>(onboardingSteps[0]);

  const safeTrack = useCallback(
    (name: string, properties: EventProperties = {}) => {
      try {
        track(name as string, properties);
      } catch (_err) {
        logger.warn('[Onboarding Analytics] Failed to track event', { error: _err });
      }
    },
    [track],
  );

  // Initialize state manager and validation engine
  const [stateManager] = useState(() => {
    const manager = new FormStateManager('user-onboarding');
    // Pre-populate with default values if empty
    manager.setValues({
      newsletter: false,
      language: 'en',
      notifications: 'email',
      walletAddress: '',
    });
    return manager;
  });

  const [validationEngine] = useState(() => new ValidationEngineImpl(onboardingFields));
  const [formState, setFormState] = useState<FormState>(stateManager.getState());

  // Custom states for interactive elements
  const [connectingWallet, setConnectingWallet] = useState<'argent' | 'braavos' | null>(null);
  const [activeWallet, setActiveWallet] = useState<'argent' | 'braavos' | null>(null);

  // Subscribe to form state updates
  useEffect(() => {
    const subscription = stateManager.subscribeToChanges(() => {
      setFormState(stateManager.getState());
    });
    return () => subscription.unsubscribe();
  }, [stateManager]);

  // Set document title for SEO/A11y
  useEffect(() => {
    document.title = 'User Onboarding - TeachLink';
  }, []);

  useEffect(() => {
    safeTrack('onboarding_started', {
      stepId: currentStep.id,
      stepIndex: currentStep.index,
      stepTitle: currentStep.title,
    });
  }, [safeTrack, currentStep.id, currentStep.index, currentStep.title]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    const handleAbandon = () => {
      if (!hasFinishedOnboarding) {
        safeTrack('onboarding_abandoned', {
          stepId: currentStepRef.current.id,
          stepIndex: currentStepRef.current.index,
          stepTitle: currentStepRef.current.title,
        });
      }
    };

    window.addEventListener('beforeunload', handleAbandon);
    return () => {
      handleAbandon();
      window.removeEventListener('beforeunload', handleAbandon);
    };
  }, [hasFinishedOnboarding, safeTrack]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    stateManager.updateField(fieldId, value);

    // Perform real-time validation
    const result = await validationEngine.validateField(fieldId, value, stateManager.getState());
    stateManager.setValidationState(fieldId, result);
  };

  const handleFieldBlur = async (fieldId: string) => {
    stateManager.markFieldTouched(fieldId);

    const value = stateManager.getFieldValue(fieldId);
    const result = await validationEngine.validateField(fieldId, value, stateManager.getState());
    stateManager.setValidationState(fieldId, result);
  };

  // Mock Starknet wallet connection
  const handleConnectWallet = (walletType: 'argent' | 'braavos') => {
    setConnectingWallet(walletType);

    // Simulate extension pop-up connection delay
    setTimeout(() => {
      let mockAddress = '';
      if (walletType === 'argent') {
        mockAddress = '0x04828f731a54fd38cb6249c589b252df23fcd779fdfb746c0d0246a48b5ffb27';
      } else {
        mockAddress = '0x01b87a8e734c56e3b8a6a69ef8148b3294c65330e791b8a53e6bcf12921a9876';
      }

      handleFieldChange('walletAddress', mockAddress);
      setActiveWallet(walletType);
      setConnectingWallet(null);
      success(`Connected to ${walletType === 'argent' ? 'Argent X' : 'Braavos'} successfully!`);
    }, 1500);
  };

  const handleDisconnectWallet = () => {
    handleFieldChange('walletAddress', '');
    setActiveWallet(null);
    success('Wallet disconnected');
  };

  // Final onboarding submission
  const handleComplete = async (values: Record<string, unknown>) => {
    const loadingToastId = loading('Finalizing your registration profile...');

    try {
      // Simulate API registration request delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      dismiss(loadingToastId);
      success('Onboarding complete! Welcome to TeachLink.');
      setHasFinishedOnboarding(true);
      safeTrack('onboarding_completed', {
        stepId: currentStep.id,
        stepIndex: currentStep.index,
        stepTitle: currentStep.title,
        role: values.role as string,
        walletConnected: !!values.walletAddress,
      });

      // Save onboarding preference state locally so other pages know user is onboarded
      if (typeof window !== 'undefined') {
        localStorage.setItem('teachlink_onboarded', 'true');
        localStorage.setItem('teachlink_user_role', values.role as string);
      }

      // Redirect to main dashboard
      router.push('/dashboard');
    } catch (err) {
      dismiss(loadingToastId);
      error('Failed to complete onboarding. Please try again.');
    }
  };

  // Step 1 UI Renderer
  const renderPersonalStep = () => {
    const usernameError =
      formState.touched.username &&
      formState.validation.username &&
      !formState.validation.username.isValid;
    const roleError =
      formState.touched.role && formState.validation.role && !formState.validation.role.isValid;
    const dobError =
      formState.touched.dob && formState.validation.dob && !formState.validation.dob.isValid;
    const bioError =
      formState.touched.bio && formState.validation.bio && !formState.validation.bio.isValid;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Tell us about yourself
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Establish your basic profile parameters.
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label
            htmlFor="username-input"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <User size={18} />
            </div>
            <input
              id="username-input"
              type="text"
              placeholder="e.g. janesmith_web3"
              value={formState.values.username || ''}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              onBlur={() => handleFieldBlur('username')}
              aria-invalid={!!usernameError}
              aria-describedby={usernameError ? 'username-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border ${
                usernameError
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800/80'
              } rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all dark:text-slate-100`}
            />
          </div>
          {usernameError && (
            <p id="username-error" className="text-xs font-medium text-red-500 mt-1">
              {formState.validation.username.errors[0]?.message}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            I want to use TeachLink as a... <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Card */}
            <button
              id="role-student-card"
              type="button"
              onClick={() => handleFieldChange('role', 'student')}
              className={`flex items-start p-4 rounded-xl border text-left transition-all ${
                formState.values.role === 'student'
                  ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg mr-3 ${
                  formState.values.role === 'student'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Student / Learner</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Explore courses, connect a Starknet wallet to store certificates off-chain, and
                  build your web3 identity.
                </p>
              </div>
            </button>

            {/* Instructor Card */}
            <button
              id="role-instructor-card"
              type="button"
              onClick={() => handleFieldChange('role', 'instructor')}
              className={`flex items-start p-4 rounded-xl border text-left transition-all ${
                formState.values.role === 'instructor'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg mr-3 ${
                  formState.values.role === 'instructor'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Instructor / Teacher
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Share your technical skills, build comprehensive courses, and issue decentralized
                  credentials.
                </p>
              </div>
            </button>
          </div>
          {roleError && (
            <p id="role-error" className="text-xs font-medium text-red-500 mt-1">
              {formState.validation.role.errors[0]?.message}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label
            htmlFor="dob-input"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Calendar size={18} />
            </div>
            <input
              id="dob-input"
              type="date"
              value={formState.values.dob || ''}
              onChange={(e) => handleFieldChange('dob', e.target.value)}
              onBlur={() => handleFieldBlur('dob')}
              aria-invalid={!!dobError}
              aria-describedby={dobError ? 'dob-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border ${
                dobError
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800/80'
              } rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all dark:text-slate-100`}
            />
          </div>
          {dobError && (
            <p id="dob-error" className="text-xs font-medium text-red-500 mt-1">
              {formState.validation.dob.errors[0]?.message}
            </p>
          )}
        </div>

        {/* Short Bio */}
        <div className="space-y-2">
          <label
            htmlFor="bio-input"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Short Bio <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 text-slate-400 dark:text-slate-500">
              <FileText size={18} />
            </div>
            <textarea
              id="bio-input"
              rows={3}
              placeholder="Tell us about yourself..."
              value={formState.values.bio || ''}
              onChange={(e) => handleFieldChange('bio', e.target.value)}
              onBlur={() => handleFieldBlur('bio')}
              aria-invalid={!!bioError}
              aria-describedby={bioError ? 'bio-error' : undefined}
              className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border ${
                bioError
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800/80'
              } rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all dark:text-slate-100 resize-none`}
            />
          </div>
          <div className="flex justify-between mt-1">
            {bioError ? (
              <p id="bio-error" className="text-xs font-medium text-red-500">
                {formState.validation.bio.errors[0]?.message}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formState.values.bio ? formState.values.bio.length : 0}/200
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Step 2 UI Renderer
  const renderPreferencesStep = () => {
    const interestError =
      formState.touched.interest &&
      formState.validation.interest &&
      !formState.validation.interest.isValid;
    const notificationsError =
      formState.touched.notifications &&
      formState.validation.notifications &&
      !formState.validation.notifications.isValid;
    const languageError =
      formState.touched.language &&
      formState.validation.language &&
      !formState.validation.language.isValid;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Set your preferences
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure how you would like to interact with the platform.
          </p>
        </div>

        {/* Learning Interest */}
        <div className="space-y-2">
          <label
            htmlFor="interest-select"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Primary Interest <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="interest-select"
              value={formState.values.interest || ''}
              onChange={(e) => handleFieldChange('interest', e.target.value)}
              onBlur={() => handleFieldBlur('interest')}
              aria-invalid={!!interestError}
              aria-describedby={interestError ? 'interest-error' : undefined}
              className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border ${
                interestError
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800/80'
              } rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all dark:text-slate-100`}
            >
              <option value="" disabled>
                Select your primary area
              </option>
              <option value="web3">Web3 & Starknet Smart Contracts</option>
              <option value="frontend">Frontend Engineering (React / Next.js)</option>
              <option value="devops">DevOps, CI/CD & Cloud Infrastructure</option>
            </select>
          </div>
          {interestError && (
            <p id="interest-error" className="text-xs font-medium text-red-500 mt-1">
              {formState.validation.interest.errors[0]?.message}
            </p>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          <label
            htmlFor="notifications-select"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Preferred Notification Channel <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Bell size={18} />
            </div>
            <select
              id="notifications-select"
              value={formState.values.notifications || 'email'}
              onChange={(e) => handleFieldChange('notifications', e.target.value)}
              onBlur={() => handleFieldBlur('notifications')}
              aria-invalid={!!notificationsError}
              aria-describedby={notificationsError ? 'notifications-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border ${
                notificationsError
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800/80'
              } rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all dark:text-slate-100`}
            >
              <option value="email">Email Notifications Only</option>
              <option value="in-app">In-App Notifications Only</option>
              <option value="both">Both Email and In-App</option>
            </select>
          </div>
          {notificationsError && (
            <p id="notifications-error" className="text-xs font-medium text-red-500 mt-1">
              {formState.validation.notifications.errors[0]?.message}
            </p>
          )}
        </div>

        {/* Language Preference */}
        <div className="space-y-2">
          <label
            htmlFor="language-select"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Interface Language <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Globe size={18} />
            </div>
            <select
              id="language-select"
              value={formState.values.language || 'en'}
              onChange={(e) => handleFieldChange('language', e.target.value)}
              onBlur={() => handleFieldBlur('language')}
              aria-invalid={!!languageError}
              aria-describedby={languageError ? 'language-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border ${
                languageError
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800/80'
              } rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all dark:text-slate-100`}
            >
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fr">Français (French)</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>
          {languageError && (
            <p id="language-error" className="text-xs font-medium text-red-500 mt-1">
              {formState.validation.language.errors[0]?.message}
            </p>
          )}
        </div>

        {/* Newsletter Subscription */}
        <div className="flex items-start p-1 pt-3">
          <div className="flex items-center h-5">
            <input
              id="newsletter-checkbox"
              type="checkbox"
              checked={!!formState.values.newsletter}
              onChange={(e) => handleFieldChange('newsletter', e.target.checked)}
              className="w-5 h-5 text-cyan-600 bg-white border-slate-300 rounded focus:ring-cyan-500 focus:ring-2 dark:bg-slate-900 dark:border-slate-800"
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor="newsletter-checkbox"
              className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Subscribe to newsletter updates
            </label>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Receive notifications about hot courses, Starknet ecosystem rewards, and technical
              tutorials once a week.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Step 3 UI Renderer
  const renderWalletStep = () => {
    const isConnected = !!formState.values.walletAddress;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Decentralized Web3 Connection
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Connect your Starknet wallet to access offline capability storage hashes and
            verification tokens.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl flex items-start">
          <div className="p-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg mr-3 shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Why Starknet Wallet Integration?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              TeachLink utilizes Starknet to store offline learning progress cryptographic
              commitments. Connecting your wallet enables you to record accomplishments securely and
              claim verified course certificates on-chain.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="disconnected-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Choose a Starknet wallet to connect:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Argent X Button */}
                <button
                  id="argent-connect-button"
                  type="button"
                  disabled={connectingWallet !== null}
                  onClick={() => handleConnectWallet('argent')}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl hover:border-cyan-500/50 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all text-left"
                >
                  <div className="flex items-center">
                    {/* Argent X Mock Icon */}
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-lg mr-3 shadow-inner">
                      A
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Argent X
                      </h4>
                      <p className="text-xxs text-slate-400 dark:text-slate-500">
                        Starknet&apos;s premier smart wallet
                      </p>
                    </div>
                  </div>
                  {connectingWallet === 'argent' ? (
                    <Loader2 className="animate-spin text-cyan-500" size={18} />
                  ) : (
                    <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-full">
                      Connect
                    </span>
                  )}
                </button>

                {/* Braavos Button */}
                <button
                  id="braavos-connect-button"
                  type="button"
                  disabled={connectingWallet !== null}
                  onClick={() => handleConnectWallet('braavos')}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl hover:border-blue-500/50 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all text-left"
                >
                  <div className="flex items-center">
                    {/* Braavos Mock Icon */}
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg mr-3 shadow-inner">
                      B
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Braavos
                      </h4>
                      <p className="text-xxs text-slate-400 dark:text-slate-500">
                        Fast, secure, and user-friendly wallet
                      </p>
                    </div>
                  </div>
                  {connectingWallet === 'braavos' ? (
                    <Loader2 className="animate-spin text-blue-500" size={18} />
                  ) : (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                      Connect
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="connected-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-5 border border-green-200 dark:border-green-800/50 bg-green-50/20 dark:bg-green-950/10 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      activeWallet === 'argent' ? 'bg-orange-500' : 'bg-blue-600'
                    } flex items-center justify-center font-bold text-white text-xs mr-3`}
                  >
                    {activeWallet === 'argent' ? 'A' : 'B'}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Connected Wallet
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {activeWallet === 'argent' ? 'Argent X' : 'Braavos'} (Starknet Mainnet)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center text-green-600 dark:text-green-400 text-xs font-semibold">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Active
                </div>
              </div>

              {/* Connected Address display */}
              <div className="bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3 flex justify-between items-center">
                <code className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all pr-2">
                  {formState.values.walletAddress}
                </code>
                <button
                  id="disconnect-wallet-button"
                  type="button"
                  onClick={handleDisconnectWallet}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 hover:dark:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Disconnect wallet"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-4 md:p-8">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Main content container */}
      <div className="w-full max-w-3xl z-10 space-y-6">
        {/* Logo and header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-400/10">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              TeachLink
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white sm:text-4xl">
            Welcome to Onboarding
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Set up your identity and technical preferences to get started with TeachLink&apos;s
            decentralized platform.
          </p>
        </div>

        {/* Wizard Card Container */}
        <FormWizardController
          steps={onboardingSteps}
          formState={formState}
          stateManager={stateManager}
          fields={onboardingFields}
          onStepChange={setCurrentStep}
          onStepComplete={(step) =>
            safeTrack('onboarding_step_completed', {
              stepId: step.id,
              stepIndex: step.index,
              stepTitle: step.title,
            })
          }
          onComplete={handleComplete}
          allowNonLinearNavigation={false}
          validateBeforeNext={true}
        >
          {(currentStep) => {
            switch (currentStep.id) {
              case 'personal-setup':
                return renderPersonalStep();
              case 'preferences':
                return renderPreferencesStep();
              case 'wallet-integration':
                return renderWalletStep();
              default:
                return null;
            }
          }}
        </FormWizardController>
      </div>
    </div>
  );
}
