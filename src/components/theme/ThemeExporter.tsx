'use client';

import React from 'react';
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

export default function ThemeExporter() {
  const { exportTheme, importTheme } = useThemeCustomization();

  function downloadTheme() {
    const json = exportTheme();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachlink-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    const res = importTheme(txt);
    if (!res.ok) alert('Import failed: ' + (res.error || 'invalid'));
  }

  return (
    <div className="space-y-2">
      <button onClick={downloadTheme} className="px-3 py-1 rounded bg-green-600 text-white">
        Export Theme
      </button>
      <label className="px-3 py-1 rounded border cursor-pointer inline-block">
        Import Theme
        <input type="file" accept="application/json" onChange={handleFile} className="hidden" />
      </label>
    </div>
  );
}
