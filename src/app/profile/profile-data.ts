export type ProfileTabId = 'profile' | 'settings' | 'achievements' | 'support' | 'certificates';

export interface ProfileUser {
  initials: string;
  name: string;
  email: string;
  bio: string;
  learningGoal: string;
  dailyLearningTime: string;
  /** Optional URL used for Open Graph / social sharing images. */
  avatarUrl?: string;
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

/**
 * Fallback profile shown when there is no authenticated session (or the
 * session could not be resolved). Intentionally generic — it must never look
 * like a specific person's real data.
 */
export const guestProfileUser: ProfileUser = {
  initials: 'GU',
  name: 'Guest',
  email: '',
  bio: 'Sign in to personalize your profile.',
  learningGoal: 'Complete 1 course per month',
  dailyLearningTime: '30 minutes',
  avatarUrl: '/avatars/default.png',
};

/** @deprecated Use {@link buildProfileUser} with the current session instead of this static placeholder. */
export const profileUser: ProfileUser = guestProfileUser;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GU';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const words = local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1));
  return words.length ? words.join(' ') : 'Member';
}

/** Minimal identity fields available from a verified session/JWT. */
export interface SessionIdentity {
  id: string;
  email?: string;
}

/**
 * Builds the `ProfileUser` shown on the profile page from the current
 * session. Falls back to {@link guestProfileUser} when there is no session,
 * rather than ever rendering placeholder data as if it belonged to a real
 * signed-in user.
 */
export function buildProfileUser(session: SessionIdentity | null): ProfileUser {
  if (!session) return guestProfileUser;

  const name = session.email ? nameFromEmail(session.email) : `Member ${session.id.slice(0, 8)}`;

  return {
    ...guestProfileUser,
    initials: initialsFromName(name),
    name,
    email: session.email ?? '',
    bio: 'Welcome back! Tell the community a bit about yourself.',
  };
}

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
