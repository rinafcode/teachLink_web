export type ProfileTabId = 'profile' | 'settings' | 'achievements' | 'support' | 'certificates';

export interface ProfileUser {
  initials: string;
  name: string;
  email: string;
  bio: string;
  learningGoal: string;
  dailyLearningTime: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface PreferenceOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  earnedAt: string;
}

export const profileUser: ProfileUser = {
  initials: 'JD',
  name: 'John Doe',
  email: 'john.doe@example.com',
  bio: 'Passionate about Web3 technologies and decentralized learning platforms.',
  learningGoal: 'Complete 1 course per month',
  dailyLearningTime: '30 minutes',
};

export const profileTabs: Array<{ id: ProfileTabId; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'support', label: 'Customer Support' },
  { id: 'certificates', label: 'Certification Program' },
];

// ── Customer Support ──────────────────────────────────────────────────────────

export interface SupportFaq {
  id: string;
  question: string;
  answer: string;
}

export interface SupportContactOption {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  ariaLabel: string;
}

export const supportFaqs: SupportFaq[] = [
  {
    id: 'reset-password',
    question: 'How do I reset my password?',
    answer:
      'Go to the login page and click "Forgot password". Enter your registered email address and we will send you a reset link within a few minutes. Check your spam folder if you do not see it.',
  },
  {
    id: 'offline-access',
    question: 'How does offline learning work?',
    answer:
      'Enable Offline Mode in your Settings tab, then open any course and click the download icon. Downloaded content is available in the app even without an internet connection. Your progress syncs automatically when you reconnect.',
  },
  {
    id: 'certificate',
    question: 'How do I get my course certificate?',
    answer:
      'Certificates are issued automatically once you complete all lessons and pass the final assessment with a score of 70% or higher. You can download your certificate from the Achievements tab.',
  },
  {
    id: 'billing',
    question: 'How do I update my billing information?',
    answer:
      'Navigate to Settings → Billing (available for paid plans). You can update your payment method, view invoices, and manage your subscription from there.',
  },
  {
    id: 'progress-sync',
    question: 'My learning progress is not syncing. What should I do?',
    answer:
      'First, ensure you have a stable internet connection. Then try refreshing the page. If the issue persists, sign out and sign back in. Your progress is saved locally and will sync once connectivity is restored.',
  },
];

export const supportContactOptions: SupportContactOption[] = [
  {
    id: 'email',
    label: 'Email Support',
    description: 'Response within 24 hours',
    href: 'mailto:support@teachlink.com',
    icon: 'email',
    ariaLabel: 'Email our support team at support@teachlink.com',
  },
  {
    id: 'chat',
    label: 'Live Chat',
    description: 'Mon–Fri, 9 am–6 pm UTC',
    href: 'https://teachlink.com/chat',
    icon: 'chat',
    ariaLabel: 'Open live chat with support',
  },
  {
    id: 'phone',
    label: 'Phone Support',
    description: '+1 (800) 123-4567',
    href: 'tel:+18001234567',
    icon: 'phone',
    ariaLabel: 'Call our support line at +1 800 123 4567',
  },
];

export const learningGoalOptions: SelectOption[] = [
  { label: 'Complete 1 course per month', value: 'monthly-course' },
  { label: 'Learn Web3 development', value: 'web3-development' },
  { label: 'Master smart contracts', value: 'smart-contracts' },
  { label: 'Build decentralized applications', value: 'dapps' },
];

export const dailyLearningTimeOptions: SelectOption[] = [
  { label: '30 minutes', value: '30-minutes' },
  { label: '1 hour', value: '1-hour' },
  { label: '2 hours', value: '2-hours' },
  { label: '3+ hours', value: '3-plus-hours' },
];

export const settingsPreferences: PreferenceOption[] = [
  {
    id: 'dark-mode',
    label: 'Dark Mode',
    description: 'Switch between light and dark themes',
    enabled: false,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Receive learning reminders and updates',
    enabled: true,
  },
  {
    id: 'offline-mode',
    label: 'Offline Mode',
    description: 'Enable offline learning capabilities',
    enabled: true,
  },
  {
    id: 'poll-creation',
    label: 'Poll Creation',
    description: 'Allow creating interactive polls in study groups and courses',
    enabled: true,
  },
];

export const achievements: Achievement[] = [
  {
    id: 'first-course',
    icon: '🎓',
    title: 'First Course',
    description: 'Completed your first course',
    earnedAt: 'Earned Jan 15, 2024',
  },
  {
    id: 'seven-day-streak',
    icon: '🔥',
    title: '7-Day Streak',
    description: 'Learned for 7 consecutive days',
    earnedAt: 'Earned Feb 3, 2024',
  },
  {
    id: 'web3-master',
    icon: '🏆',
    title: 'Web3 Master',
    description: 'Completed 5 Web3 courses',
    earnedAt: 'Earned Mar 12, 2024',
  },
];
