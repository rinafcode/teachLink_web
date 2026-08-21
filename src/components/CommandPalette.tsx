'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PollCreationModal, type PollDraft } from '@/components/polls/PollCreationModal';
import { useSettingsStore } from '@/lib/settings/store';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/lib/theme-provider';
import { wsManager } from '@/lib/websocketManager';
import {
  type ShortcutActionId,
  type ShortcutCommand,
  useKeyboardShortcuts,
} from '@/hooks/useKeyboardShortcuts';
import { createLogger } from '@/lib/logging';
import { useFocusTrap } from '@/hooks/useFocusTrap';
const logger = createLogger('CommandPalette');

function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;
  window.location.assign(path);
}

function findSearchInput(): HTMLInputElement | null {
  if (typeof document === 'undefined') return null;
  return (
    document.querySelector<HTMLInputElement>('input[type="search"]') ??
    document.querySelector<HTMLInputElement>('input[placeholder*="Search" i]') ??
    document.querySelector<HTMLInputElement>('[aria-label*="search" i]')
  );
}

interface ShortcutRowProps {
  actionId: ShortcutActionId;
  label: string;
  description: string;
  binding: string;
  defaultBinding: string;
  onSave: (id: ShortcutActionId, binding: string) => void;
  onReset: (id: ShortcutActionId) => void;
}

function ShortcutRow({
  actionId,
  label,
  description,
  binding,
  defaultBinding,
  onSave,
  onReset,
}: ShortcutRowProps) {
  const [draft, setDraft] = useState(binding);

  return (
    <div className="grid gap-2 border-b border-gray-100 pb-3 dark:border-gray-800 md:grid-cols-[1fr_220px]">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          aria-label={`${label} shortcut`}
        />
        <button
          type="button"
          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          onClick={() => onSave(actionId, draft)}
        >
          Save
        </button>
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={() => {
            setDraft(defaultBinding);
            onReset(actionId);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [query, setQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const commandPaletteRef = useFocusTrap<HTMLDivElement>(open && !showHelp, {
    initialFocusRef: commandInputRef,
  });
  const shortcutHelpRef = useFocusTrap<HTMLDivElement>(showHelp);
  const commandPaletteTitleId = useId();
  const shortcutHelpTitleId = useId();

  const settings = useSettingsStore((s) => s.settings);
  const { info: toastInfo } = useToast();

  const commands = useMemo<ShortcutCommand[]>(() => {
    return [
      {
        id: 'openCommandPalette',
        title: 'Open command palette',
        description: 'Show all available commands',
        run: () => setOpen(true),
      },
      {
        id: 'goHome',
        title: 'Go to Home',
        description: 'Navigate to the homepage',
        run: () => navigateTo('/'),
      },
      {
        id: 'goCourses',
        title: 'Go to Courses',
        description: 'Navigate to courses',
        run: () => navigateTo('/courses'),
      },
      {
        id: 'goDashboard',
        title: 'Go to Dashboard',
        description: 'Navigate to your dashboard',
        run: () => navigateTo('/dashboard'),
      },
      {
        id: 'goSettings',
        title: 'Go to Settings',
        description: 'Navigate to settings page',
        run: () => navigateTo('/settings'),
      },
      {
        id: 'toggleTheme',
        title: 'Toggle theme',
        description: 'Switch between light and dark mode',
        run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'focusSearch',
        title: 'Focus search',
        description: 'Focus first available search input',
        run: () => findSearchInput()?.focus(),
      },
      {
        id: 'openPollCreation',
        title: 'Create poll',
        description: 'Open poll creation dialog',
        run: () => {
          if (!settings.pollCreationEnabled) {
            toastInfo('Poll creation is disabled in your settings.');
            return;
          }
          setPollModalOpen(true);
        },
      },
      {
        id: 'openShortcutHelp',
        title: 'Show keyboard shortcuts',
        description: 'Open shortcuts help and customization panel',
        run: () => setShowHelp(true),
      },
    ];
  }, [setTheme, theme, settings.pollCreationEnabled, toastInfo]);

  const {
    shortcuts,
    setShortcutBinding,
    resetShortcutBinding,
    resetAllShortcutBindings,
    runShortcutAction,
  } = useKeyboardShortcuts(commands, true);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands.filter(
      (command) =>
        command.title.toLowerCase().includes(value) ||
        command.description.toLowerCase().includes(value),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open && !showHelp) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (showHelp) setShowHelp(false);
      else setOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, showHelp]);

  return (
    <>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-[12000] bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={commandPaletteRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={commandPaletteTitleId}
            aria-hidden={showHelp || undefined}
            className="fixed left-1/2 top-20 z-[12001] w-[min(100vw-2rem,44rem)] -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            <input
              ref={commandInputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="Type a command..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <h2 id={commandPaletteTitleId} className="sr-only">
              Command palette
            </h2>

            <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
              {filtered.map((command) => {
                const shortcut = shortcuts.find((item) => item.id === command.id);
                return (
                  <button
                    type="button"
                    key={command.id}
                    className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    onClick={() => {
                      command.run();
                      setOpen(false);
                    }}
                  >
                    <span>
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                        {command.title}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {command.description}
                      </span>
                    </span>
                    {shortcut ? (
                      <kbd className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {shortcut.binding}
                      </kbd>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Press Esc to close</span>
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setShowHelp(true)}
              >
                Keyboard shortcuts help
              </button>
            </div>
          </div>
        </>
      ) : null}

      {showHelp ? (
        <>
          <div
            className="fixed inset-0 z-[12010] bg-black/50"
            onClick={() => setShowHelp(false)}
            aria-hidden="true"
          />
          <div
            ref={shortcutHelpRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={shortcutHelpTitleId}
            className="fixed left-1/2 top-1/2 z-[12011] max-h-[80vh] w-[min(100vw-2rem,54rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id={shortcutHelpTitleId}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Keyboard shortcuts
              </h2>
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setShowHelp(false)}
              >
                Close
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Customize bindings for major actions. Use format like <code>mod+k</code>,{' '}
              <code>ctrl+shift+s</code>, or <code>meta+/</code>.
            </p>

            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.id}
                  actionId={shortcut.id}
                  label={shortcut.label}
                  description={shortcut.description}
                  binding={shortcut.binding}
                  defaultBinding={shortcut.defaultBinding}
                  onSave={setShortcutBinding}
                  onReset={resetShortcutBinding}
                />
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                onClick={resetAllShortcutBindings}
              >
                Reset all to defaults
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                onClick={() => {
                  setShowHelp(false);
                  runShortcutAction('openCommandPalette');
                }}
              >
                Open command palette
              </button>
            </div>
          </div>
        </>
      ) : null}

      <PollCreationModal
        isOpen={pollModalOpen}
        onClose={() => setPollModalOpen(false)}
        onCreate={async (draft: PollDraft) => {
          if (isSubmittingPoll) return;
          setIsSubmittingPoll(true);

          try {
            const res = await fetch('/api/polls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question: draft.question,
                options: draft.options.filter((option) => option.trim()),
                durationDays: draft.durationDays,
                allowAnonymous: draft.allowAnonymous,
                resultsVisibility: draft.resultsVisibility,
              }),
            });

            if (res.ok) {
              const { data } = await res.json();
              const statuses = wsManager.getAllStatuses();
              const activeKey = Object.keys(statuses).find((key) => statuses[key].isConnected);

              if (activeKey) {
                const socket = wsManager.getSocket(activeKey);
                socket?.emit('collaboration:message', {
                  type: 'poll:created',
                  roomId: 'global',
                  poll: data,
                });
              }
            }
          } catch {
            toastInfo('Failed to submit poll.');
          } finally {
            setIsSubmittingPoll(false);
          }
        }}
      />
    </>
  );
}
