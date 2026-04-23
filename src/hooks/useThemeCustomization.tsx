'use client';

import React from 'react';
import {
  DEFAULT_THEME,
  PRESET_THEMES,
  themeToCSSVars,
  validateTheme,
  type ThemeShape,
} from '@/utils/themeUtils';

const STORAGE_KEY = 'teachlink:theme';
const BROADCAST_CHANNEL = 'teachlink-theme';

function applyThemeToRoot(theme: ThemeShape) {
  const vars = themeToCSSVars(theme);
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function useThemeCustomization() {
  const [theme, setThemeState] = React.useState<ThemeShape>(DEFAULT_THEME);

  // BroadcastChannel for cross-tab sync
  const bcRef = React.useRef<BroadcastChannel | null>(null);

  React.useEffect(() => {
    // load persisted theme
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (validateTheme(parsed)) {
          setThemeState(parsed);
          applyThemeToRoot(parsed);
        }
      } else {
        // apply default
        applyThemeToRoot(DEFAULT_THEME);
      }
    } catch (e) {
      // ignore parse errors and fallback
      applyThemeToRoot(DEFAULT_THEME);
    }

    if ('BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel(BROADCAST_CHANNEL);
      bcRef.current.onmessage = (ev) => {
        try {
          const data = ev.data;
          if (validateTheme(data)) {
            setThemeState(data);
            applyThemeToRoot(data);
          }
        } catch (e) {
          // ignore
        }
      };
    }

    return () => {
      if (bcRef.current) bcRef.current.close();
    };
  }, []);

  const setTheme = React.useCallback((next: ThemeShape) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
    applyThemeToRoot(next);
    if (bcRef.current) {
      try {
        bcRef.current.postMessage(next);
      } catch (e) {}
    }
  }, []);

  const reset = React.useCallback(() => setTheme(DEFAULT_THEME), [setTheme]);

  const applyPreset = React.useCallback(
    (name: string) => {
      const p = PRESET_THEMES.find((t) => t.name === name);
      if (p) setTheme(p);
    },
    [setTheme],
  );

  const exportTheme = React.useCallback(() => {
    return JSON.stringify(theme, null, 2);
  }, [theme]);

  const importTheme = React.useCallback(
    (payload: string) => {
      try {
        const parsed = JSON.parse(payload);
        if (validateTheme(parsed)) {
          setTheme(parsed);
          return { ok: true };
        }
        return { ok: false, error: 'Invalid theme shape' };
      } catch (e: any) {
        return { ok: false, error: e?.message || String(e) };
      }
    },
    [setTheme],
  );

  return {
    theme,
    setTheme,
    reset,
    presets: PRESET_THEMES,
    applyPreset,
    exportTheme,
    importTheme,
  } as const;
}
