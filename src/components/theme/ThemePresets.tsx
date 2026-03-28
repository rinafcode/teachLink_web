'use client';

import React from 'react';
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

export default function ThemePresets() {
  const { presets, applyPreset } = useThemeCustomization();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Presets</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p.name || '')}
            className="flex items-center gap-2 px-3 py-1 rounded-md border hover:shadow-sm"
            aria-label={`Apply preset ${p.name}`}
          >
            <span
              className="w-6 h-6 rounded-sm"
              style={{
                background: p.colors.primary,
                boxShadow: `inset 0 0 0 2px ${p.colors.accent}`,
              }}
            />
            <span className="text-sm">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
