import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NotificationBell from '../NotificationBell';
import { useNotificationStore } from '@/app/store/notificationStore';
import { Bell } from 'lucide-react';

// Mock lucide-react to spy on Bell rendering
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal<typeof import('lucide-react')>();
  return {
    ...original,
    Bell: vi.fn((props) => <original.Bell {...props} />),
  };
});

describe('NotificationBell', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] });
    vi.clearAllMocks();
  });

  it('renders correctly and has 0 unread initially', () => {
    const { queryByText } = render(<NotificationBell />);
    expect(queryByText('1')).toBeNull();
  });

  it('renders only once (no extra re-render) when a read notification is added', () => {
    const { queryByText } = render(<NotificationBell />);

    // Check initial render count of Bell
    expect(Bell).toHaveBeenCalledTimes(1);

    // Add a read notification to the store
    act(() => {
      useNotificationStore.getState().addNotification({
        id: '1',
        message: 'Read notification',
        type: 'info',
        read: true,
        title: 'Info',
      });
    });

    // The unread count badge should not be present
    expect(queryByText('1')).toBeNull();

    // Since the notification was already read, the unread count did not change
    // Therefore, the NotificationBell should NOT have re-rendered
    expect(Bell).toHaveBeenCalledTimes(1);
  });

  it('re-renders when an unread notification is added (unread count changes)', () => {
    const { getByText } = render(<NotificationBell />);
    expect(Bell).toHaveBeenCalledTimes(1);

    // Add an unread notification to the store
    act(() => {
      useNotificationStore.getState().addNotification({
        id: '2',
        message: 'Unread notification',
        type: 'info',
        read: false,
        title: 'Info',
      });
    });

    // The unread count badge should display '1'
    expect(getByText('1')).toBeInTheDocument();

    // Since the unread count changed, the component should re-render
    expect(Bell).toHaveBeenCalledTimes(2);
  });
});
