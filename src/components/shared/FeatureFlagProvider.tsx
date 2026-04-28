'use client';

import React, { createContext, useContext, useState } from 'react';
import { getAllFlags, type FeatureFlag } from '@/lib/featureFlags';
import { Settings, X } from 'lucide-react';

type FlagState = Record<FeatureFlag, boolean>;

const FeatureFlagContext = createContext<{
  flags: FlagState;
  toggle: (flag: FeatureFlag) => void;
} | null>(null);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FlagState>(getAllFlags);

  const toggle = (flag: FeatureFlag) => setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));

  return (
    <FeatureFlagContext.Provider value={{ flags, toggle }}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <FeatureFlagAdminPanel flags={flags} toggle={toggle} />
      )}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  return ctx.flags[flag];
}

function FeatureFlagAdminPanel({
  flags,
  toggle,
}: {
  flags: FlagState;
  toggle: (flag: FeatureFlag) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {open ? (
        <div className="w-72 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Feature Flags
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close feature flags panel">
              <X className="h-4 w-4 text-gray-500 hover:text-gray-900 dark:hover:text-white" />
            </button>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(Object.keys(flags) as FeatureFlag[]).map((flag) => (
              <li key={flag} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {flag.replace(/_/g, ' ')}
                </span>
                <button
                  role="switch"
                  aria-checked={flags[flag]}
                  onClick={() => toggle(flag)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    flags[flag] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      flags[flag] ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open feature flags panel"
          className="flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Settings className="h-3.5 w-3.5" />
          Flags
        </button>
      )}
    </div>
  );
}
