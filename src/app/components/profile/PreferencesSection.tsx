'use client';

import { useState } from 'react';

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

export default function PreferencesSection() {
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    email_notifications: true,
    marketing_emails: false,
    course_updates: true,
  });

  const [privacySettings, setPrivacySettings] = useState<Record<string, boolean>>({
    profile_visibility: true,
    show_progress: true,
    show_achievements: true,
  });

  const handleNotificationChange = (id: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrivacyChange = (id: string) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
        <div className="space-y-4">
          {notificationPreferences.map((preference) => (
            <div key={preference.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={preference.id}
                  type="checkbox"
                  checked={notificationSettings[preference.id]}
                  onChange={() => handleNotificationChange(preference.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor={preference.id}
                  className="text-sm font-medium text-gray-700"
                >
                  {preference.label}
                </label>
                <p className="text-sm text-gray-500">{preference.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
        <div className="space-y-4">
          {privacyPreferences.map((preference) => (
            <div key={preference.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={preference.id}
                  type="checkbox"
                  checked={privacySettings[preference.id]}
                  onChange={() => handlePrivacyChange(preference.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor={preference.id}
                  className="text-sm font-medium text-gray-700"
                >
                  {preference.label}
                </label>
                <p className="text-sm text-gray-500">{preference.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 