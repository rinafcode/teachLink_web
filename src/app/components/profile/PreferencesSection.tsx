'use client';

import { memo, useCallback, useState } from 'react';

interface PreferenceOption {
  id: string;
  label: string;
  description: string;
}

const notificationPreferences: PreferenceOption[] = [
  {
    id: 'email_notifications',
    label: 'Email Notifications',
    description: 'Receive email notifications for course updates and messages',
  },
  {
    id: 'marketing_emails',
    label: 'Marketing Emails',
    description: 'Receive emails about new courses and promotions',
  },
  {
    id: 'course_updates',
    label: 'Course Updates',
    description: 'Get notified when your enrolled courses are updated',
  },
];

const privacyPreferences: PreferenceOption[] = [
  {
    id: 'profile_visibility',
    label: 'Public Profile',
    description: 'Allow other users to view your profile',
  },
  {
    id: 'show_progress',
    label: 'Show Progress',
    description: 'Display your course progress on your profile',
  },
  {
    id: 'show_achievements',
    label: 'Show Achievements',
    description: 'Display your achievements and certificates',
  },
];

const defaultNotificationSettings = {
  email_notifications: true,
  marketing_emails: false,
  course_updates: true,
};

const defaultPrivacySettings = {
  profile_visibility: true,
  show_progress: true,
  show_achievements: true,
};

interface PreferenceCheckboxProps {
  preference: PreferenceOption;
  checked: boolean;
  onToggle: (id: string) => void;
}

const PreferenceCheckbox = memo(function PreferenceCheckbox({
  preference,
  checked,
  onToggle,
}: PreferenceCheckboxProps) {
  const handleChange = useCallback(() => {
    onToggle(preference.id);
  }, [onToggle, preference.id]);

  return (
    <div className="flex items-start">
      <div className="flex h-5 items-center">
        <input
          id={preference.id}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
      <div className="ml-3">
        <label htmlFor={preference.id} className="text-sm font-medium text-gray-700">
          {preference.label}
        </label>
        <p className="text-sm text-gray-500">{preference.description}</p>
      </div>
    </div>
  );
});

interface PreferenceGroupProps {
  title: string;
  preferences: PreferenceOption[];
  settings: Record<string, boolean>;
  onToggle: (id: string) => void;
}

const PreferenceGroup = memo(function PreferenceGroup({
  title,
  preferences,
  settings,
  onToggle,
}: PreferenceGroupProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">{title}</h2>
      <div className="space-y-4">
        {preferences.map((preference) => (
          <PreferenceCheckbox
            key={preference.id}
            preference={preference}
            checked={settings[preference.id]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
});

function PreferencesSection() {
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>(
    defaultNotificationSettings,
  );

  const [privacySettings, setPrivacySettings] =
    useState<Record<string, boolean>>(defaultPrivacySettings);

  const handleNotificationChange = useCallback((id: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handlePrivacyChange = useCallback((id: string) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  return (
    <div className="space-y-8">
      <PreferenceGroup
        title="Notification Preferences"
        preferences={notificationPreferences}
        settings={notificationSettings}
        onToggle={handleNotificationChange}
      />

      <PreferenceGroup
        title="Privacy Settings"
        preferences={privacyPreferences}
        settings={privacySettings}
        onToggle={handlePrivacyChange}
      />
    </div>
  );
}

export default memo(PreferencesSection);
