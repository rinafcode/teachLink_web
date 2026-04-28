'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (next: Theme) => void;
}

const STORAGE_KEY = 'teachlink-theme-preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function sanitizeTheme(value: string | null | undefined): Theme {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

function applyThemeClass(resolved: 'light' | 'dark'): void {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);
}

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage access failures (private mode / disabled storage).
  }
  document.cookie = `theme=${theme}; path=/; max-age=31536000`;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(sanitizeTheme(defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    sanitizeTheme(defaultTheme) === 'system'
      ? 'light'
      : (sanitizeTheme(defaultTheme) as 'light' | 'dark'),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sanitizeTheme(window.localStorage.getItem(STORAGE_KEY));
    setThemeState(stored);
  }, []);

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
    if (typeof window !== 'undefined') persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme !== 'system') return;
      const next = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      applyThemeClass(next);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next) => setThemeState(sanitizeTheme(next)),
    }),
    [theme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
