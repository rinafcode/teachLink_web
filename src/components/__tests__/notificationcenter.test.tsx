import React, { Profiler } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenter } from '../notificationcenter';
import * as NotificationProviderModule from '@/providers/Notificationprovider';
import type { Notification } from '@/providers/Notificationprovider';
import { makeProfilerRecorder } from '@/testing/utils/renderProfiler';

vi.mock('@/providers/Notificationprovider', async () => {
  const actual = await vi.importActual<typeof NotificationProviderModule>(
    '@/providers/Notificationprovider',
  );
  return { ...actual, useNotifications: vi.fn() };
});

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? `n-${Math.random()}`,
    type: 'info',
    title: 'Test notification',
    timestamp: new Date(),
    read: false,
    ...overrides,
  };
}

// Stable callback identities across renders, mirroring the real provider
// (which wraps them in useCallback) — required for row memoization to work.
const markAsRead = vi.fn();
const markAllAsRead = vi.fn();
const clearNotification = vi.fn();
const clearAll = vi.fn();

function mockNotifications(notifications: Notification[]) {
  vi.mocked(NotificationProviderModule.useNotifications).mockReturnValue({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    connectionState: { status: 'connected', reconnectAttempts: 0 },
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  });
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the fallback type icon when a notification has no avatarUrl (regression: TYPE_ICON JSX bug)', () => {
    mockNotifications([makeNotification({ id: 'a', title: 'No avatar here' })]);
    render(<NotificationCenter />);

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByText('No avatar here')).toBeInTheDocument();
  });

  it('only shows "Load more" once notifications exceed a single page', () => {
    const many = Array.from({ length: 25 }, (_, i) => makeNotification({ id: `n-${i}` }));
    mockNotifications(many);
    render(<NotificationCenter />);

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // First page (20) is visible; the rest only appear after "Load more".
    expect(screen.getAllByRole('button', { name: 'Dismiss notification' })).toHaveLength(20);
    fireEvent.click(screen.getByText('Load more'));
    expect(screen.getAllByRole('button', { name: 'Dismiss notification' })).toHaveLength(25);
  });

  it('does not show "Load more" when everything fits on one page', () => {
    mockNotifications([makeNotification()]);
    render(<NotificationCenter />);

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  it('[bench] re-rendering with one changed notification stays cheap for a 50-item list', () => {
    const notifications = Array.from({ length: 50 }, (_, i) => makeNotification({ id: `n-${i}` }));
    mockNotifications(notifications);

    const recorder = makeProfilerRecorder();
    const { rerender } = render(
      <Profiler id="notification-list" onRender={recorder.onRender}>
        <NotificationCenter />
      </Profiler>,
    );
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    recorder.reset();

    // Only notification 0's `read` flag changes; the other 49 object
    // references are preserved, the same pattern the real provider's
    // `markAsRead` uses (`prev.map(n => n.id === id ? {...n, read: true} : n)`).
    mockNotifications(notifications.map((n, i) => (i === 0 ? { ...n, read: true } : n)));
    rerender(
      <Profiler id="notification-list" onRender={recorder.onRender}>
        <NotificationCenter />
      </Profiler>,
    );

    // eslint-disable-next-line no-console
    console.info(
      `[bench:NotificationCenter] update after 1/50 changed -> ${recorder.renderCount()} commit(s), ${recorder
        .totalDuration()
        .toFixed(3)}ms total actualDuration`,
    );
    // Guards against a catastrophic (e.g. O(n^2)) regression; memoized rows
    // keep a single-item update well under this bound.
    expect(recorder.totalDuration()).toBeLessThan(200);
  });
});
