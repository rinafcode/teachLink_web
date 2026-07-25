import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationProvider, useNotifications } from '../Notificationprovider';

type WebSocketListener = ((event?: Event | MessageEvent | CloseEvent) => void) | null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;

  readyState = MockWebSocket.CONNECTING;
  onopen: WebSocketListener = null;
  onmessage: WebSocketListener = null;
  onclose: WebSocketListener = null;
  onerror: WebSocketListener = null;

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  send(): void {}

  close(): void {
    this.onclose?.({} as CloseEvent);
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({} as Event);
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider wsUrl="wss://example.com/notifications">{children}</NotificationProvider>
  );
}

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('exposes connection state through context', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.connectionState.status).toBe('connecting');

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });

    expect(result.current.connectionState.status).toBe('connected');
  });

  it('adds notifications received from the websocket', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage({
        event: 'notification',
        payload: {
          id: 'provider-1',
          type: 'success',
          title: 'Course published',
          timestamp: '2026-06-24T10:00:00.000Z',
          read: false,
        },
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Course published');
    expect(result.current.unreadCount).toBe(1);
  });

  it('reports reconnecting state after an unexpected disconnect', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].close();
    });

    expect(result.current.connectionState.status).toBe('reconnecting');

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.connectionState.status).toBe('reconnecting');
    expect(MockWebSocket.instances).toHaveLength(2);
  });
});
