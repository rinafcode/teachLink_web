// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useDashboardWidgets } from '../useDashboardWidgets';

// Simple in-memory localStorage mock
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

// Test component to expose hook API
const TestHarness: React.FC<{ onReady: (api: ReturnType<typeof useDashboardWidgets>) => void }>
= ({ onReady }) => {
  const api = useDashboardWidgets();
  useEffect(() => { onReady(api); }, [onReady, api]);
  return null;
};

describe('useDashboardWidgets', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    // @ts-expect-error - LocalStorageMock for testing
    global.localStorage = new LocalStorageMock();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('initializes with defaults and persists layout', async () => {
    let api: any;
    await act(async () => {
      root.render(<TestHarness onReady={(a) => { api = a; }} />);
    });

    // After first mount, default widgets should be set and saved
    expect(api.widgets.length).toBeGreaterThan(0);
    const saved = JSON.parse(localStorage.getItem('dashboard-widgets') || '[]');
    expect(saved.length).toBe(api.widgets.length);
  });

  it('adds, reorders, updates, collapses, resizes, and removes widgets', async () => {
    let api: any;
    await act(async () => {
      root.render(<TestHarness onReady={(a) => { api = a; }} />);
    });

    // Add
    await act(async () => {
      api.addWidget({ type: 'learning-streak', title: 'My Streak', size: 'small', isCollapsed: false, settings: {} });
    });
    expect(api.widgets.some((w: any) => w.title === 'My Streak')).toBe(true);

    const fromIndex = 0;
    const toIndex = api.widgets.length - 1;

    // Reorder
    await act(async () => {
      api.reorderWidgets(fromIndex, toIndex);
    });
    expect(api.widgets[toIndex].position).toBe(toIndex);

    const targetId = api.widgets[0].id;

    // Update settings
    await act(async () => {
      api.updateWidgetSettings(targetId, { refreshInterval: '1m' });
    });
    expect(api.widgets.find((w: any) => w.id === targetId)?.settings.refreshInterval).toBe('1m');

    // Toggle collapse
    await act(async () => {
      api.toggleWidgetCollapse(targetId);
    });
    expect(api.widgets.find((w: any) => w.id === targetId)?.isCollapsed).toBe(true);

    // Change size
    await act(async () => {
      api.changeWidgetSize(targetId, 'large');
    });
    expect(api.widgets.find((w: any) => w.id === targetId)?.size).toBe('large');

    // Remove
    await act(async () => {
      api.removeWidget(targetId);
    });
    expect(api.widgets.find((w: any) => w.id === targetId)).toBeUndefined();
  });
}); 