export type ThemeColors = {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
};

export type ThemeShape = {
  name?: string;
  colors: ThemeColors;
  fonts?: {
    sans?: string;
    mono?: string;
  };
};

export const DEFAULT_THEME: ThemeShape = {
  name: 'default',
  colors: {
    primary: '#2563eb', // blue-600
    accent: '#06b6d4', // teal-400
    background: '#ffffff',
    foreground: '#0f172a',
  },
  fonts: {
    sans: 'var(--font-geist-sans, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial)',
    mono: 'var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono")',
  },
};

export const PRESET_THEMES: ThemeShape[] = [
  DEFAULT_THEME,
  {
    name: 'midnight',
    colors: {
      primary: '#7c3aed', // purple
      accent: '#f97316', // orange
      background: '#0f172a',
      foreground: '#e6eef8',
    },
  },
  {
    name: 'sunrise',
    colors: {
      primary: '#ef4444', // red-500
      accent: '#f59e0b', // amber
      background: '#fff7ed',
      foreground: '#1f2937',
    },
  },
  {
    name: 'forest',
    colors: {
      primary: '#059669', // green-600
      accent: '#10b981',
      background: '#f0fdf4',
      foreground: '#042014',
    },
  },
];

export function themeToCSSVars(theme: ThemeShape): Record<string, string> {
  const { colors, fonts } = theme;
  const vars: Record<string, string> = {
    '--color-primary': colors.primary,
    '--color-accent': colors.accent,
    '--background': colors.background,
    '--foreground': colors.foreground,
  };

  if (fonts) {
    if (fonts.sans) vars['--font-sans'] = fonts.sans;
    if (fonts.mono) vars['--font-mono'] = fonts.mono;
  }

  return vars;
}

export function validateTheme(obj: unknown): obj is ThemeShape {
  if (!obj || typeof obj !== 'object') return false;
  const t = obj as any;
  if (!t.colors) return false;
  const c = t.colors;
  return (
    typeof c.primary === 'string' &&
    typeof c.accent === 'string' &&
    typeof c.background === 'string' &&
    typeof c.foreground === 'string'
  );
}
