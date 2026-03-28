'use client';

import ThemeCustomizer from '@/components/theme/ThemeCustomizer';
import ThemePresets from '@/components/theme/ThemePresets';
import ThemeExporter from '@/components/theme/ThemeExporter';

export default function ThemeDemoPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Theme Demo</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <ThemeCustomizer />
        </div>
        <div>
          <ThemePresets />
        </div>
        <div>
          <ThemeExporter />
        </div>
      </div>
    </main>
  );
}
