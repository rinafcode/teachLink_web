'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'teachlink-keyboard-shortcuts-v1';

export type ShortcutActionId =
  | 'openCommandPalette'
  | 'goHome'
  | 'goCourses'
  | 'goDashboard'
  | 'goSettings'
  | 'toggleTheme'
  | 'focusSearch'
  | 'openShortcutHelp';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  label: string;
  description: string;
  category: 'Navigation' | 'Interface';
  defaultBinding: string;
  binding: string;
}

export interface ShortcutCommand {
  id: ShortcutActionId;
  title: string;
  description: string;
  run: () => void;
}

const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'openCommandPalette',
    label: 'Open command palette',
    description: 'Open command palette for quick actions',
    category: 'Interface',
    defaultBinding: 'mod+k',
    binding: 'mod+k',
  },
  {
    id: 'goHome',
    label: 'Go to Home',
    description: 'Navigate to home page',
    category: 'Navigation',
    defaultBinding: 'mod+shift+h',
    binding: 'mod+shift+h',
  },
  {
    id: 'goCourses',
    label: 'Go to Courses',
    description: 'Navigate to courses page',
    category: 'Navigation',
    defaultBinding: 'mod+shift+c',
    binding: 'mod+shift+c',
  },
  {
    id: 'goDashboard',
    label: 'Go to Dashboard',
    description: 'Navigate to dashboard page',
    category: 'Navigation',
    defaultBinding: 'mod+shift+d',
    binding: 'mod+shift+d',
  },
  {
    id: 'goSettings',
    label: 'Go to Settings',
    description: 'Navigate to settings page',
    category: 'Navigation',
    defaultBinding: 'mod+shift+s',
    binding: 'mod+shift+s',
  },
  {
    id: 'toggleTheme',
    label: 'Toggle theme',
    description: 'Switch between light and dark theme',
    category: 'Interface',
    defaultBinding: 'mod+shift+t',
    binding: 'mod+shift+t',
  },
  {
    id: 'focusSearch',
    label: 'Focus search',
    description: 'Focus search field when available',
    category: 'Interface',
    defaultBinding: 'mod+/',
    binding: 'mod+/',
  },
  {
    id: 'openShortcutHelp',
    label: 'Show shortcuts help',
    description: 'Open keyboard shortcuts help overlay',
    category: 'Interface',
    defaultBinding: 'mod+shift+/',
    binding: 'mod+shift+/',
  },
];

function normalizeBinding(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('cmd', 'meta')
    .replace('command', 'meta')
    .replace('control', 'ctrl')
    .replace('option', 'alt');
}

function eventToBinding(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  const key = event.key.toLowerCase() === ' ' ? 'space' : event.key.toLowerCase();
  parts.push(key);
  return normalizeBinding(parts.join('+'));
}

function isInputLike(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function resolveModBinding(binding: string): string[] {
  const normalized = normalizeBinding(binding);
  if (!normalized.includes('mod+')) return [normalized];
  return [normalized.replace('mod+', 'ctrl+'), normalized.replace('mod+', 'meta+')];
}

function loadCustomBindings(): Partial<Record<ShortcutActionId, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<ShortcutActionId, string>>;
    return parsed;
  } catch {
    return {};
  }
}

export interface UseKeyboardShortcutsResult {
  shortcuts: ShortcutDefinition[];
  setShortcutBinding: (id: ShortcutActionId, binding: string) => void;
  resetShortcutBinding: (id: ShortcutActionId) => void;
  resetAllShortcutBindings: () => void;
  runShortcutAction: (id: ShortcutActionId) => void;
}

export function useKeyboardShortcuts(
  commands: ShortcutCommand[],
  enabled: boolean = true,
): UseKeyboardShortcutsResult {
  const [customBindings, setCustomBindings] = useState<Partial<Record<ShortcutActionId, string>>>(
    {},
  );

  useEffect(() => {
    setCustomBindings(loadCustomBindings());
  }, []);

  const commandMap = useMemo(() => {
    return new Map(commands.map((command) => [command.id, command.run]));
  }, [commands]);

  const shortcuts = useMemo<ShortcutDefinition[]>(() => {
    return DEFAULT_SHORTCUTS.map((item) => ({
      ...item,
      binding: customBindings[item.id] ?? item.defaultBinding,
    }));
  }, [customBindings]);

  const runShortcutAction = useCallback(
    (id: ShortcutActionId) => {
      const handler = commandMap.get(id);
      if (handler) handler();
    },
    [commandMap],
  );

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: KeyboardEvent) => {
      if (isInputLike(event.target)) return;
      const pressed = eventToBinding(event);

      const targetShortcut = shortcuts.find((shortcut) => {
        const candidates = resolveModBinding(shortcut.binding);
        return candidates.includes(pressed);
      });

      if (!targetShortcut) return;

      event.preventDefault();
      runShortcutAction(targetShortcut.id);
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [enabled, runShortcutAction, shortcuts]);

  const setShortcutBinding = useCallback((id: ShortcutActionId, binding: string) => {
    const normalized = normalizeBinding(binding);
    if (!normalized) return;
    setCustomBindings((prev) => {
      const next = { ...prev, [id]: normalized };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const resetShortcutBinding = useCallback((id: ShortcutActionId) => {
    setCustomBindings((prev) => {
      const next = { ...prev };
      delete next[id];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const resetAllShortcutBindings = useCallback(() => {
    setCustomBindings({});
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    shortcuts,
    setShortcutBinding,
    resetShortcutBinding,
    resetAllShortcutBindings,
    runShortcutAction,
  };
}
