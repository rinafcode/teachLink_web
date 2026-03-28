'use client';

import React from 'react';
import { useThemeCustomization } from '@/hooks/useThemeCustomization';
import { DEFAULT_THEME } from '@/utils/themeUtils';

export default function ThemeCustomizer() {
  const { theme, setTheme, reset, exportTheme, importTheme } = useThemeCustomization();
  const [local, setLocal] = React.useState(theme);

  React.useEffect(() => setLocal(theme), [theme]);

  function updateColor(key: keyof typeof theme.colors, value: string) {
    setLocal((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }

  function apply() {
    setTheme(local);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    const res = importTheme(txt);
    if (!res.ok) {
      // simple alert for now
      alert('Failed to import theme: ' + (res.error || 'invalid'));
    }
  }

  return (
    <div className="p-4 border rounded-md bg-white">
      <h2 className="text-lg font-semibold mb-2">Theme Customizer</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">
          Primary
          <input
            type="color"
            value={local.colors.primary}
            onChange={(e) => updateColor('primary', e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          Accent
          <input
            type="color"
            value={local.colors.accent}
            onChange={(e) => updateColor('accent', e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          Background
          <input
            type="color"
            value={local.colors.background}
            onChange={(e) => updateColor('background', e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          Foreground
          <input
            type="color"
            value={local.colors.foreground}
            onChange={(e) => updateColor('foreground', e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={apply} className="px-3 py-1 rounded bg-blue-600 text-white">
          Apply
        </button>
        <button onClick={() => setTheme(DEFAULT_THEME as any)} className="px-3 py-1 rounded border">
          Reset
        </button>
        <button
          onClick={() => {
            const json = exportTheme();
            navigator.clipboard?.writeText(json);
            alert('Theme JSON copied to clipboard');
          }}
          className="px-3 py-1 rounded border"
        >
          Copy JSON
        </button>
        <label className="px-3 py-1 rounded border cursor-pointer">
          Import
          <input
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4">
        <div
          className="p-3 rounded"
          style={{
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <strong>Live preview</strong>
          <p className="mt-2">
            Primary color sample:{' '}
            <span style={{ color: 'var(--color-primary)' }}>{local.colors.primary}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
