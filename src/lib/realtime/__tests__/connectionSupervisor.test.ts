import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConnectionSupervisor,
  type RealtimeTransport,
  getSupervisor,
  onAnyReconnect,
  onSupervisorRegistered,
  registerSupervisor,
} from '../connectionSupervisor';
import { getRecordedMetrics } from '@/lib/logging/performance';

type Handler = (...args: any[]) => void;

class FakeTransport implements RealtimeTransport {
  readonly name = 'fake';
  sent: unknown[] = [];
  pingCount = 0;
  connectCount = 0;
  private opened = false;
  private openHandlers = new Set<Handler>();
  private closeHandlers = new Set<Handler>();
  private errorHandlers = new Set<Handler>();
  private messageHandlers = new Set<Handler>();
  private pongHandlers = new Set<Handler>();

  connect(): void {
    this.connectCount += 1;
    this.opened = false;
  }

  disconnect(): void {
    this.opened = false;
  }

  close(): void {
    this.opened = false;
    this.closeHandlers.forEach((handler) => handler());
  }

  isOpen(): boolean {
    return this.opened;
  }

  send(payload: unknown): void {
    this.sent.push(payload);
  }

  sendPing(): void {
    this.pingCount += 1;
  }

  simulateOpen(): void {
    this.opened = true;
    this.openHandlers.forEach((handler) => handler());
  }

  simulateClose(): void {
    this.opened = false;
    this.closeHandlers.forEach((handler) => handler());
  }

  simulateMessage(payload: unknown): void {
    this.messageHandlers.forEach((handler) => handler(payload));
  }

  simulatePong(): void {
    this.pongHandlers.forEach((handler) => handler());
  }

  onOpen(handler: Handler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: Handler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  onError(handler: Handler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onMessage(handler: Handler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onPong(handler: Handler): () => void {
    this.pongHandlers.add(handler);
    return () => this.pongHandlers.delete(handler);
  }
}

const hasMetric = (name: string): boolean =>
  getRecordedMetrics(200).some((metric) => metric.name === name);

describe('ConnectionSupervisor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // Reset the global metric store so assertions don't leak across tests.
    delete (globalThis as { __TEACHLINK_METRICS__?: unknown }).__TEACHLINK_METRICS__;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('connectivity lifecycle', () => {
    it('connects and reports a unified connected status', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });

      supervisor.connect();
      expect(supervisor.getStatus().phase).toBe('connecting');

      transport.simulateOpen();
      const status = supervisor.getStatus();
      expect(status.phase).toBe('connected');
      expect(status.isConnected).toBe(true);
      expect(status.isReconnecting).toBe(false);
      expect(status.reconnectAttempts).toBe(0);
      expect(status.lastConnectedAt).toBeInstanceOf(Date);
    });

    it('notifies status listeners of every change', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });
      const phases: string[] = [];
      supervisor.onStatusChange((status) => phases.push(status.phase));

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateClose();

      expect(phases).toEqual(['connecting', 'connected', 'disconnected', 'reconnecting']);
    });

    it('is idempotent while connecting or connected', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });

      supervisor.connect();
      supervisor.connect();
      expect(transport.connectCount).toBe(1);

      transport.simulateOpen();
      supervisor.connect();
      expect(transport.connectCount).toBe(1);
    });

    it('disconnect is intentional and never reconnects', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        initialReconnectDelayMs: 100,
      });

      supervisor.connect();
      transport.simulateOpen();
      supervisor.disconnect();

      expect(supervisor.getStatus().phase).toBe('disconnected');
      expect(supervisor.getStatus().queuedCount).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(transport.connectCount).toBe(1);
    });
  });

  describe('exponential backoff with jitter', () => {
    it('reconnects with deterministic exponential backoff when jitter is 0', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: 100,
        reconnectJitter: 0,
        maxReconnectDelayMs: 10_000,
        maxReconnectAttempts: 0,
      });

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateClose();

      expect(supervisor.getStatus().phase).toBe('reconnecting');
      expect(supervisor.getStatus().reconnectAttempts).toBe(1);

      // First backoff: 100ms
      vi.advanceTimersByTime(99);
      expect(transport.connectCount).toBe(1);
      vi.advanceTimersByTime(1);
      expect(transport.connectCount).toBe(2);

      transport.simulateClose();
      // Second backoff: 200ms
      vi.advanceTimersByTime(199);
      expect(transport.connectCount).toBe(2);
      vi.advanceTimersByTime(1);
      expect(transport.connectCount).toBe(3);
      expect(supervisor.getStatus().reconnectAttempts).toBe(2);
    });

    it('applies full jitter range to the backoff delay', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: 100,
        reconnectJitter: 1,
        maxReconnectDelayMs: 10_000,
        maxReconnectAttempts: 0,
      });

      supervisor.connect();
      transport.simulateOpen();

      // Full jitter → delay ∈ [0, 2*base]. With Math.random() = 0.5, delay = 100.
      transport.simulateClose();
      vi.advanceTimersByTime(100);
      expect(transport.connectCount).toBe(2);

      transport.simulateOpen();
      // Math.random() = 1 → delay = 2*100 = 200 (full jitter upper bound)
      vi.mocked(Math.random).mockReturnValue(1);
      transport.simulateClose();
      vi.advanceTimersByTime(199);
      expect(transport.connectCount).toBe(2);
      vi.advanceTimersByTime(1);
      expect(transport.connectCount).toBe(3);
    });

    it('caps the backoff delay at maxReconnectDelayMs', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: 100,
        reconnectJitter: 0,
        maxReconnectDelayMs: 250,
        maxReconnectAttempts: 0,
      });

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateClose();
      vi.advanceTimersByTime(100);
      transport.simulateClose();
      vi.advanceTimersByTime(200);
      transport.simulateClose();
      // 4th attempt would be 800ms raw → capped at 250ms
      vi.advanceTimersByTime(250);
      expect(transport.connectCount).toBe(4);
    });

    it('emits reconnect_attempt and reconnect_success metrics', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: 100,
        reconnectJitter: 0,
      });

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateClose();
      expect(hasMetric('reconnect_attempt')).toBe(true);

      vi.advanceTimersByTime(100);
      transport.simulateOpen();
      expect(hasMetric('reconnect_success')).toBe(true);
    });
  });

  describe('heartbeat with ping-timeout detection', () => {
    it('sends pings on the heartbeat interval and treats a pong as alive', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        heartbeatIntervalMs: 100,
        heartbeatTimeoutMs: 50,
      });

      supervisor.connect();
      transport.simulateOpen();

      vi.advanceTimersByTime(100);
      expect(transport.pingCount).toBe(1);

      transport.simulatePong();
      // Pong received for the first ping → still alive at the next check.
      vi.advanceTimersByTime(49);
      expect(transport.connectCount).toBe(1);
      expect(supervisor.getStatus().phase).toBe('connected');

      // Answer the second ping as well → still no timeout.
      vi.advanceTimersByTime(51);
      expect(transport.pingCount).toBe(2);
      transport.simulatePong();
      vi.advanceTimersByTime(49);
      expect(supervisor.getStatus().phase).toBe('connected');
    });

    it('forces a reconnect when the peer stops answering pings', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        initialReconnectDelayMs: 100,
        heartbeatIntervalMs: 100,
        heartbeatTimeoutMs: 50,
      });

      supervisor.connect();
      transport.simulateOpen();

      vi.advanceTimersByTime(100); // ping sent
      expect(transport.pingCount).toBe(1);

      vi.advanceTimersByTime(50); // no pong within timeout → close → reconnect scheduled
      expect(supervisor.getStatus().phase).toBe('reconnecting');

      vi.advanceTimersByTime(100);
      expect(transport.connectCount).toBe(2);
      expect(hasMetric('heartbeat_timeout')).toBe(true);
    });
  });

  describe('bounded outbound queue with backpressure', () => {
    it('queues messages while disconnected and flushes them in order on connect', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        queueLimit: 100,
      });

      supervisor.send('first');
      supervisor.send('second');
      expect(supervisor.getStatus().queuedCount).toBe(2);

      supervisor.connect();
      transport.simulateOpen();

      expect(transport.sent).toEqual(['first', 'second']);
      expect(supervisor.getStatus().queuedCount).toBe(0);
    });

    it('drops the oldest message once the queue limit is reached (drop-oldest)', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        queueLimit: 3,
        queuePolicy: 'drop-oldest',
      });

      supervisor.send('a');
      supervisor.send('b');
      supervisor.send('c');
      supervisor.send('d'); // 'a' dropped

      expect(supervisor.getStatus().queuedCount).toBe(3);
      supervisor.connect();
      transport.simulateOpen();
      expect(transport.sent).toEqual(['b', 'c', 'd']);
      expect(hasMetric('queue_dropped')).toBe(true);
    });

    it('blocks (drops the new message) under the block policy', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        queueLimit: 2,
        queuePolicy: 'block',
      });

      supervisor.send('a');
      supervisor.send('b');
      supervisor.send('c'); // blocked — queue unchanged

      expect(supervisor.getStatus().queuedCount).toBe(2);
      supervisor.connect();
      transport.simulateOpen();
      expect(transport.sent).toEqual(['a', 'b']);
    });

    it('sends immediately when connected', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });

      supervisor.connect();
      transport.simulateOpen();
      supervisor.send('live');
      expect(transport.sent).toEqual(['live']);
      expect(supervisor.getStatus().queuedCount).toBe(0);
    });

    it('buffers messages across disconnects and flushes them on the next connect', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        queueLimit: 10,
      });

      supervisor.send('a');
      supervisor.connect();
      transport.simulateOpen();
      expect(transport.sent).toEqual(['a']);

      transport.simulateClose();
      supervisor.send('b');
      supervisor.send('c');
      expect(supervisor.getStatus().queuedCount).toBe(2);

      supervisor.connect();
      transport.simulateOpen();
      expect(transport.sent).toEqual(['a', 'b', 'c']);
      expect(supervisor.getStatus().queuedCount).toBe(0);
    });

    it('drops incoming messages when the queue limit is zero', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        queueLimit: 0,
      });

      supervisor.send('a');
      expect(supervisor.getStatus().queuedCount).toBe(0);
      expect(hasMetric('queue_dropped')).toBe(true);

      supervisor.connect();
      transport.simulateOpen();
      expect(transport.sent).toEqual([]);
    });
  });

  describe('inbound sequence tracking and catch-up', () => {
    it('requests catch-up when an inbound sequence gap is detected', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });
      const catchUp = vi.fn();
      supervisor.setCatchUpHandler(catchUp);

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateMessage({ sequence: 1 });
      expect(catchUp).not.toHaveBeenCalled();

      transport.simulateMessage({ sequence: 3 });
      expect(catchUp).toHaveBeenCalledTimes(1);
      expect(supervisor.getStatus().lastSequence).toBe(3);
      expect(supervisor.getLastSequence()).toBe(3);
    });

    it('tracks sequences with no gap', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });
      const catchUp = vi.fn();
      supervisor.setCatchUpHandler(catchUp);

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateMessage({ sequence: 5 });
      transport.simulateMessage({ sequence: 6 });
      expect(catchUp).not.toHaveBeenCalled();
      expect(supervisor.getStatus().lastSequence).toBe(6);
    });
  });

  describe('resubscribe registry', () => {
    it('restores registered subscriptions after every reconnect', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        initialReconnectDelayMs: 100,
      });
      const restored: string[] = [];

      supervisor.registerResubscribe('room:general', () => restored.push('room:general'));
      supervisor.registerResubscribe('sub:notifications', () => restored.push('sub:notifications'));

      supervisor.connect();
      transport.simulateOpen();
      expect(restored).toEqual(['room:general', 'sub:notifications']);

      transport.simulateClose();
      vi.advanceTimersByTime(100);
      transport.simulateOpen();
      expect(restored).toEqual(['room:general', 'sub:notifications', 'room:general', 'sub:notifications']);
    });

    it('honours unsubscribe and stops restoring that key', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });
      const restored: string[] = [];

      const unsubscribe = supervisor.registerResubscribe('room:general', () => restored.push('room:general'));
      unsubscribe();

      supervisor.connect();
      transport.simulateOpen();
      expect(restored).toEqual([]);
    });

    it('invokes onReconnect callbacks after reconnects', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        initialReconnectDelayMs: 100,
      });
      const onReconnect = vi.fn();
      supervisor.onReconnect(onReconnect);

      supervisor.connect();
      transport.simulateOpen();
      expect(onReconnect).toHaveBeenCalledTimes(1);

      transport.simulateClose();
      vi.advanceTimersByTime(100);
      transport.simulateOpen();
      expect(onReconnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('offline degradation', () => {
    it('gives up after max attempts, emits realtime_offline and signals the service worker', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: 100,
        reconnectJitter: 0,
        maxReconnectAttempts: 2,
      });
      const postMessage = vi.fn();
      (navigator.serviceWorker as { controller: unknown }).controller = { postMessage };

      supervisor.connect();
      transport.simulateClose(); // attempt 1
      vi.advanceTimersByTime(100); // attempt 2 (connect)
      transport.simulateClose(); // attempt 2 fails → attempt 2 retry scheduled
      vi.advanceTimersByTime(200); // retry timer fires → give up

      const status = supervisor.getStatus();
      expect(status.phase).toBe('offline');
      expect(status.isConnected).toBe(false);
      expect(status.lastError).toContain('Max reconnection attempts (2) reached');
      expect(hasMetric('realtime_offline')).toBe(true);
      expect(postMessage).toHaveBeenCalledWith({ type: 'REALTIME_OFFLINE' });
    });

    it('does not emit a reconnect_success metric for a first connect', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });

      supervisor.connect();
      transport.simulateOpen();
      const metrics = getRecordedMetrics(200).filter((m) => m.name === 'reconnect_success');
      expect(metrics).toHaveLength(0);
    });
  });

  describe('reconnectNow (browser online)', () => {
    it('reconnects immediately, skipping the pending backoff timer', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: 5_000,
        reconnectJitter: 0,
      });

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateClose();
      expect(transport.connectCount).toBe(1);

      supervisor.reconnectNow();
      expect(transport.connectCount).toBe(2);
      expect(supervisor.getStatus().phase).toBe('connecting');
    });

    it('is a no-op when connected or intentionally closed', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });

      supervisor.connect();
      transport.simulateOpen();
      supervisor.reconnectNow();
      expect(transport.connectCount).toBe(1);

      supervisor.disconnect();
      supervisor.reconnectNow();
      expect(transport.connectCount).toBe(1);
    });
  });

  describe('manageReconnect = false', () => {
    it('mirrors status but never schedules reconnects itself', () => {
      const transport = new FakeTransport();
      const supervisor = new ConnectionSupervisor(transport, {
        reconnectJitter: 0,
        initialReconnectDelayMs: 100,
        manageReconnect: false,
      });

      supervisor.connect();
      transport.simulateOpen();
      transport.simulateClose();

      expect(supervisor.getStatus().phase).toBe('disconnected');
      vi.advanceTimersByTime(10_000);
      expect(transport.connectCount).toBe(1);
    });
  });
});

describe('supervisor registry', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers, looks up and unregisters supervisors by name', () => {
    const transport = new FakeTransport();
    const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });
    const unregister = registerSupervisor('test:registry', supervisor);

    expect(getSupervisor('test:registry')).toBe(supervisor);
    unregister();
    expect(getSupervisor('test:registry')).toBeUndefined();
  });

  it('replays registered supervisors to late subscribers', () => {
    const transport = new FakeTransport();
    const supervisor = new ConnectionSupervisor(transport, { reconnectJitter: 0 });
    registerSupervisor('test:replay', supervisor);

    const seen: string[] = [];
    onSupervisorRegistered((name) => seen.push(name));
    expect(seen).toContain('test:replay');
  });

  it('fires onAnyReconnect for supervisors registered after subscribing', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const unsubscribe = onAnyReconnect(callback);

    const transport = new FakeTransport();
    const supervisor = new ConnectionSupervisor(transport, {
      reconnectJitter: 0,
      initialReconnectDelayMs: 100,
    });
    registerSupervisor('test:any-reconnect', supervisor);

    supervisor.connect();
    transport.simulateOpen();
    transport.simulateClose();
    vi.advanceTimersByTime(100);
    transport.simulateOpen();

    expect(callback).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
