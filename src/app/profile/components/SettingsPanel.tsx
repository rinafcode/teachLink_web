'use client';

import { memo, useCallback, useState } from 'react';
import type { PreferenceOption } from '../profile-data';
import { settingsPreferences } from '../profile-data';

const defaultSettings = Object.fromEntries(
  settingsPreferences.map((preference) => [preference.id, preference.enabled]),
) as Record<string, boolean>;

interface PreferenceSwitchProps {
  preference: PreferenceOption;
  checked: boolean;
  onToggle: (id: string) => void;
}

const PreferenceSwitch = memo(function PreferenceSwitch({
  preference,
  checked,
  onToggle,
}: PreferenceSwitchProps) {
  const handleChange = useCallback(() => {
    onToggle(preference.id);
  }, [onToggle, preference.id]);

  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <h3 className="font-medium text-gray-900">{preference.label}</h3>
        <p id={`${preference.id}-description`} className="text-sm text-gray-500">
          {preference.description}
        </p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <span className="sr-only">{preference.label}</span>
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={handleChange}
          aria-describedby={`${preference.id}-description`}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
      </label>
    </div>
  );
});

function SettingsPanel() {
  const [settings, setSettings] = useState<Record<string, boolean>>(defaultSettings);

  const handleToggle = useCallback((id: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [id]: !currentSettings[id],
    }));
  }, []);

  return (
    <section
      id="settings-panel"
      role="tabpanel"
      aria-labelledby="settings-tab"
      className="rounded-lg bg-white p-6 shadow"
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Settings</h2>

      <div className="space-y-6">
        {settingsPreferences.map((preference) => (
          <PreferenceSwitch
            key={preference.id}
            preference={preference}
            checked={settings[preference.id]}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(SettingsPanel);
