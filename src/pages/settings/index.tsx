'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/context/ToastContext';
import { buildExportEnvelope, parseExportedSettings } from '@/lib/settings/export-import';
import { useSettingsStore } from '@/lib/settings/store';
import { fetchRemoteSettings, pushRemoteSettings, resolveSyncUserId } from '@/lib/settings/sync';
import type { ThemePreference } from '@/lib/settings/types';
import { useStore } from '@/store/stateManager';

const themeChoices: ThemePreference[] = ['light', 'dark', 'system'];

export default function SettingsPage() {
  const { success, error } = useToast();
  const settings = useSettingsStore((s) => s.settings);
  const updatedAt = useSettingsStore((s) => s.updatedAt);
  const lastSyncedAt = useSettingsStore((s) => s.lastSyncedAt);
  const patchSettings = useSettingsStore((s) => s.patchSettings);
  const replaceSettings = useSettingsStore((s) => s.replaceSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const setLastSyncedAt = useSettingsStore((s) => s.setLastSyncedAt);
  const userId = useStore((s) => s.user.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const env = buildExportEnvelope(settings, updatedAt);
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachlink-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    success('Settings file downloaded.');
  };

  const handleImportFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = parseExportedSettings(parsed);
      if ('error' in result) {
        error(result.error);
        return;
      }
      replaceSettings(result, Date.now(), false);
      success('Imported settings.');
    } catch {
      error('Could not parse that JSON file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleManualSync = async () => {
    try {
      const id = resolveSyncUserId(userId);
      const remote = await fetchRemoteSettings(id);
      const localUt = useSettingsStore.getState().updatedAt;
      const currentSettings = useSettingsStore.getState().settings;

      if (remote && remote.updatedAt > localUt) {
        replaceSettings(remote.settings, remote.updatedAt, true);
        success('Applied newer settings from the server.');
        setLastSyncedAt(Date.now());
        return;
      }

      const ok = await pushRemoteSettings(id, {
        settings: currentSettings,
        updatedAt: localUt,
      });
      if (!ok) {
        error('Could not upload settings.');
        return;
      }
      setLastSyncedAt(Date.now());
      success('Settings saved online for this sync key.');
    } catch {
      error('Could not sync with the server.');
    }
  };

  const syncedLabel =
    lastSyncedAt != null
      ? new Date(lastSyncedAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Not yet synced';

  return (
    <>
      <Head>
        <title>Settings · TeachLink</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8">
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Back home
            </Link>
          </div>

          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Choices are saved locally in your browser and can be synced to the server using your
              account or anonymous sync key per device pair.
            </p>
          </header>

          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Appearance</h2>

              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </span>
                <div className="flex flex-wrap gap-4">
                  {themeChoices.map((t) => (
                    <label
                      key={t}
                      className="inline-flex items-center gap-2 cursor-pointer capitalize"
                    >
                      <input
                        type="radio"
                        name="theme"
                        checked={settings.theme === t}
                        onChange={() => patchSettings({ theme: t })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-800 dark:text-gray-200">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Interface language code
                </label>
                <input
                  id="language"
                  type="text"
                  maxLength={24}
                  value={settings.language}
                  onChange={(e) => patchSettings({ language: e.target.value })}
                  placeholder="en, en-US …"
                  className="block w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={settings.reducedMotion}
                  onChange={(e) => patchSettings({ reducedMotion: e.target.checked })}
                />
                <span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">Reduce motion</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Sets a lightweight motion hint used by TeachLink layouts.
                  </span>
                </span>
              </label>
            </section>

            <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Notifications &amp; performance
              </h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => patchSettings({ notificationsEnabled: e.target.checked })}
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Enable notifications overall
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer ml-8">
                <input
                  type="checkbox"
                  disabled={!settings.notificationsEnabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  checked={settings.emailNotifications}
                  onChange={(e) => patchSettings({ emailNotifications: e.target.checked })}
                />
                <span className="text-gray-800 dark:text-gray-200">Email notifications</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={settings.prefetchingEnabled}
                  onChange={(e) => patchSettings({ prefetchingEnabled: e.target.checked })}
                />
                <span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    Smart prefetching
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Load likely pages ahead of time where network allows.
                  </span>
                </span>
              </label>
            </section>

            <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Sync across devices &amp; backup
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last synced:{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">{syncedLabel}</span>
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                  onClick={() => void handleManualSync()}
                >
                  Push / pull server copy
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Signed-in users sync by account id in the demo store; otherwise a stable anonymous
                id is used for this browser. Production should connect this endpoint to persistent
                storage behind authentication.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Export / import file
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download JSON to move settings between browsers or profiles, or import from a
                backup.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  Export to file…
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  Import from file…
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-hidden="true"
                  onChange={(e) => void handleImportFile(e.target.files)}
                />
              </div>
            </section>

            <div className="flex justify-between items-center pb-16">
              <button
                type="button"
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
                onClick={() => {
                  resetSettings();
                  success('Settings reset locally to defaults.');
                }}
              >
                Reset to defaults…
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
