'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  Save,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useNotifications } from '@/app/hooks/useNotifications';
import {
  UserNotificationPreferences,
  NotificationChannel,
  NotificationCategory,
  validatePreferences,
} from '@/utils/notificationUtils';

interface UserPreferencesProps {
  userId?: string;
  onSave?: (preferences: UserNotificationPreferences) => void;
}

const categoryLabels: Record<NotificationCategory, { label: string; description: string }> = {
  course_update: {
    label: 'Course Updates',
    description: 'New lessons, assignments, and course announcements',
  },
  message: {
    label: 'Messages',
    description: 'Direct messages from instructors and students',
  },
  achievement: {
    label: 'Achievements',
    description: 'Badges, certificates, and milestones',
  },
  reminder: {
    label: 'Reminders',
    description: 'Upcoming deadlines and scheduled events',
  },
  system: {
    label: 'System',
    description: 'Platform updates and maintenance notices',
  },
  social: {
    label: 'Social',
    description: 'Study group activities and discussions',
  },
  payment: {
    label: 'Payment',
    description: 'Billing, receipts, and subscription updates',
  },
};

const channelIcons: Record<NotificationChannel, React.ReactNode> = {
  'in-app': <Bell size={16} />,
  push: <Smartphone size={16} />,
  email: <Mail size={16} />,
  sms: <MessageSquare size={16} />,
};

export default function UserPreferences({ userId, onSave }: UserPreferencesProps) {
  const { preferences, updatePreferences, isLoading } = useNotifications({ userId });

  const [localPreferences, setLocalPreferences] = useState<UserNotificationPreferences | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize local preferences when loaded
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({ ...preferences });
    }
  }, [preferences]);

  // Track changes
  useEffect(() => {
    if (preferences && localPreferences) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(localPreferences);
      setHasChanges(changed);
    }
  }, [preferences, localPreferences]);

  // Update local preferences
  const updateLocalPref = (path: string, value: any) => {
    if (!localPreferences) return;

    const keys = path.split('.');
    const newPrefs = { ...localPreferences };
    let current: any = newPrefs;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setLocalPreferences(newPrefs);
  };

  // Toggle channel globally
  const toggleChannel = (channel: NotificationChannel) => {
    const channelKey = channel === 'in-app' ? 'inApp' : channel;
    updateLocalPref(`channels.${channelKey}`, !localPreferences?.channels[channelKey]);
  };

  // Toggle category enabled
  const toggleCategory = (category: NotificationCategory) => {
    updateLocalPref(
      `categories.${category}.enabled`,
      !localPreferences?.categories[category]?.enabled,
    );
  };

  // Toggle channel for category
  const toggleCategoryChannel = (category: NotificationCategory, channel: NotificationChannel) => {
    if (!localPreferences) return;

    const currentChannels = localPreferences.categories[category]?.channels || [];
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel];

    updateLocalPref(`categories.${category}.channels`, newChannels);
  };

  // Save preferences
  const handleSave = async () => {
    if (!localPreferences) return;

    const validation = validatePreferences(localPreferences);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    setErrors([]);

    try {
      await updatePreferences(localPreferences);
      setSaveStatus('success');
      onSave?.(localPreferences);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setErrors(['Failed to save preferences']);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (preferences) {
      setLocalPreferences({ ...preferences });
      setErrors([]);
      setSaveStatus('idle');
    }
  };

  if (isLoading || !localPreferences) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Global Channel Settings */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Global Channels</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['in-app', 'push', 'email', 'sms'] as NotificationChannel[]).map((channel) => {
            const channelKey = channel === 'in-app' ? 'inApp' : channel;
            const isEnabled = localPreferences.channels[channelKey];

            return (
              <button
                key={channel}
                onClick={() => toggleChannel(channel)}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${
                    isEnabled
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className={isEnabled ? 'text-blue-600' : 'text-gray-400'}>
                    {channelIcons[channel]}
                  </span>
                  <span
                    className={`font-medium capitalize ${
                      isEnabled ? 'text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    {channel === 'in-app' ? 'In-App' : channel}
                  </span>
                  <div
                    className={`ml-auto w-10 h-6 rounded-full relative transition-colors ${
                      isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isEnabled ? 'left-5' : 'left-1'
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Quiet Hours</h3>
          </div>
          <button
            onClick={() =>
              updateLocalPref('quietHours.enabled', !localPreferences.quietHours.enabled)
            }
            className={`w-10 h-6 rounded-full relative transition-colors ${
              localPreferences.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                localPreferences.quietHours.enabled ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {localPreferences.quietHours.enabled && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Notifications will be silenced during these hours (except urgent alerts)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                <input
                  type="time"
                  value={localPreferences.quietHours.start}
                  onChange={(e) => updateLocalPref('quietHours.start', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                <input
                  type="time"
                  value={localPreferences.quietHours.end}
                  onChange={(e) => updateLocalPref('quietHours.end', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Timezone</label>
              <select
                value={localPreferences.quietHours.timezone}
                onChange={(e) => updateLocalPref('quietHours.timezone', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Category Settings */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Categories</h3>
        <div className="space-y-3">
          {(
            Object.entries(categoryLabels) as [
              NotificationCategory,
              (typeof categoryLabels)['system'],
            ][]
          ).map(([category, { label, description }]) => {
            const categoryPrefs = localPreferences.categories[category];
            const isEnabled = categoryPrefs?.enabled ?? true;

            return (
              <div
                key={category}
                className={`border rounded-lg overflow-hidden transition-colors ${
                  isEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{label}</div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </div>
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-10 h-6 rounded-full relative transition-colors ${
                        isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isEnabled ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {isEnabled && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs text-gray-500 mb-2">Channels for this category:</div>
                      <div className="flex flex-wrap gap-2">
                        {(['in-app', 'push', 'email', 'sms'] as NotificationChannel[]).map(
                          (channel) => {
                            const isChannelEnabled = categoryPrefs?.channels?.includes(channel);
                            const isGlobalEnabled =
                              localPreferences.channels[channel === 'in-app' ? 'inApp' : channel];

                            return (
                              <button
                                key={channel}
                                onClick={() => toggleCategoryChannel(category, channel)}
                                disabled={!isGlobalEnabled}
                                className={`
                                  inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                                  transition-colors
                                  ${
                                    isChannelEnabled
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-gray-600 border border-gray-300'
                                  }
                                  ${!isGlobalEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                              >
                                {channelIcons[channel]}
                                <span className="capitalize">
                                  {channel === 'in-app' ? 'In-App' : channel}
                                </span>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequency Settings */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Delivery Frequency</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Digest Mode</label>
            <select
              value={localPreferences.frequency.digest}
              onChange={(e) => updateLocalPref('frequency.digest', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="realtime">Real-time (immediate)</option>
              <option value="hourly">Hourly digest</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Max notifications per day: {localPreferences.frequency.maxPerDay}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localPreferences.frequency.maxPerDay}
              onChange={(e) => updateLocalPref('frequency.maxPerDay', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertCircle size={16} />
            <span className="font-medium text-sm">Validation Errors</span>
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-gray-50 flex items-center justify-between">
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveStatus === 'saving'}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${
              hasChanges && saveStatus !== 'saving'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
