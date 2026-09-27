import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationSocketService } from '../socket';

type WebSocketListener = ((event?: Event | MessageEvent | CloseEvent) => void) | null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: WebSocketListener = null;
  onmessage: WebSocketListener = null;
  onclose: WebSocketListener = null;
  onerror: WebSocketListener = null;
  readonly sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({} as Event);
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }

  simulateError(): void {
    this.onerror?.({} as Event);
  }
}

describe('NotificationSocketService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connects and delivers incoming notifications', () => {
    const service = new NotificationSocketService('wss://example.com/notifications');
    const received: Array<{ id: string }> = [];

    service.subscribe((notification) => received.push(notification));
    service.connect();

    const socket = MockWebSocket.instances[0];
    socket.simulateOpen();
    socket.simulateMessage({
      event: 'notification',
      payload: {
        id: 'n-1',
        type: 'info',
        title: 'Hello',
        timestamp: '2026-06-24T10:00:00.000Z',
        read: false,
      },
    });

    expect(received).toHaveLength(1);
    expect(received[0].id).toBe('n-1');
    expect(service.getConnectionState().status).toBe('connected');
  });

  it('reconnects with exponential backoff after an unexpected close', () => {
    const service = new NotificationSocketService('wss://example.com/notifications', {
      initialReconnectDelay: 1_000,
      reconnectJitter: 0,
    });

    service.connect();
    MockWebSocket.instances[0].simulateOpen();
    MockWebSocket.instances[0].close();

    expect(service.getConnectionState().status).toBe('reconnecting');
    expect(MockWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(1_000);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(service.getConnectionState().reconnectAttempts).toBe(1);
  });

  it('resets reconnect delay after a successful connection', () => {
    const service = new NotificationSocketService('wss://example.com/notifications', {
      initialReconnectDelay: 1_000,
      reconnectJitter: 0,
    });

    service.connect();
    MockWebSocket.instances[0].simulateOpen();
    MockWebSocket.instances[0].close();

    vi.advanceTimersByTime(1_000);
    MockWebSocket.instances[1].simulateOpen();
    MockWebSocket.instances[1].close();

    vi.advanceTimersByTime(999);
    expect(MockWebSocket.instances).toHaveLength(2);

    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3);
    expect(service.getConnectionState().reconnectAttempts).toBe(1);
  });

  it('queues outbound messages while disconnected and flushes on reconnect', () => {
    const service = new NotificationSocketService('wss://example.com/notifications');

    service.connect();
    service.send('notification_read', { id: 'queued-1' });

    const socket = MockWebSocket.instances[0];
    socket.simulateOpen();

    expect(socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.sent[0])).toEqual({
      event: 'notification_read',
      payload: { id: 'queued-1' },
    });
  });

  it('stops reconnecting after reaching max attempts', () => {
    const service = new NotificationSocketService('wss://example.com/notifications', {
      initialReconnectDelay: 100,
      maxReconnectAttempts: 2,
      reconnectJitter: 0,
    });

    service.connect();
    MockWebSocket.instances[0].close();

    vi.advanceTimersByTime(100);
    MockWebSocket.instances[1].close();

    vi.advanceTimersByTime(200);
    expect(MockWebSocket.instances).toHaveLength(2);

    vi.advanceTimersByTime(400);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(service.getConnectionState().lastError).toContain('Max reconnection attempts');
  });

  it('does not reconnect after an intentional disconnect', () => {
    const service = new NotificationSocketService('wss://example.com/notifications', {
      initialReconnectDelay: 100,
      reconnectJitter: 0,
    });

    service.connect();
    MockWebSocket.instances[0].simulateOpen();
    service.disconnect();

    vi.advanceTimersByTime(500);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(service.getConnectionState().status).toBe('disconnected');
  });

  it('reconnects immediately when the browser comes back online', () => {
    const service = new NotificationSocketService('wss://example.com/notifications', {
      initialReconnectDelay: 5_000,
      reconnectJitter: 0,
    });

    service.connect();
    const initialCount = MockWebSocket.instances.length;
    MockWebSocket.instances[0].close();

    window.dispatchEvent(new Event('online'));

    expect(MockWebSocket.instances.length).toBeGreaterThan(initialCount);
  });

  it('notifies connection state subscribers', () => {
    const service = new NotificationSocketService('wss://example.com/notifications');
    const states: string[] = [];

    service.onConnectionStateChange((state) => states.push(state.status));
    service.connect();
    MockWebSocket.instances[0].simulateOpen();

    expect(states).toEqual(['idle', 'connecting', 'connected']);
  });
});
