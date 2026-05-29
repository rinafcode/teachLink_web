'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useConsentStore } from '@/lib/consent/store';
import type { ConsentPreferences } from '@/lib/consent/types';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function CategoryRow({ label, description, checked, disabled, onChange }: CategoryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={`${label} cookies`}
        />
        <div
          className={`h-5 w-9 rounded-full transition-colors ${
            checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          } ${disabled ? 'opacity-60' : ''}`}
        />
        <div
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </label>
    </div>
  );
}

/**
 * Granular cookie preferences modal.
 * Lets users toggle individual cookie categories before saving.
 */
export function CookiePreferencesModal({ isOpen, onClose }: CookiePreferencesModalProps) {
  const preferences = useConsentStore((s) => s.preferences);
  const savePreferences = useConsentStore((s) => s.savePreferences);
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);

  const [local, setLocal] = useState<Omit<ConsentPreferences, 'necessary'>>({
    analytics: preferences.analytics,
    functional: preferences.functional,
    marketing: preferences.marketing,
  });

  const toggle = (key: keyof typeof local) => (value: boolean) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    savePreferences(local);
    onClose();
  };

  const handleAcceptAll = () => {
    acceptAll();
    onClose();
  };

  const handleRejectAll = () => {
    rejectAll();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cookie Preferences">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <CategoryRow
          label="Necessary"
          description="Required for the site to function. Cannot be disabled."
          checked={true}
          disabled={true}
          onChange={() => {}}
        />
        <CategoryRow
          label="Analytics"
          description="Help us understand how visitors interact with the site."
          checked={local.analytics}
          onChange={toggle('analytics')}
        />
        <CategoryRow
          label="Functional"
          description="Enable enhanced features like saved preferences."
          checked={local.functional}
          onChange={toggle('functional')}
        />
        <CategoryRow
          label="Marketing"
          description="Used for personalised advertising and cross-site tracking."
          checked={local.marketing}
          onChange={toggle('marketing')}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleRejectAll}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Reject optional
        </button>
        <button
          onClick={handleAcceptAll}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Accept all
        </button>
        <button
          onClick={handleSave}
          className="ml-auto rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save preferences
        </button>
      </div>
    </Modal>
  );
}
