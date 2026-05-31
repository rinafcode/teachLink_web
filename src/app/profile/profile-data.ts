export type ProfileTabId = 'profile' | 'settings' | 'achievements';

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
