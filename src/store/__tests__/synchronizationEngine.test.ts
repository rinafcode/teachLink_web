import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const storage = new Map<string, string>();
  return {
    storage,
    reconnectCb: { current: null as null | (() => void) },
    catchUpCb: { current: null as null | ((since?: number) => void) },
    requestCatchUp: vi.fn(),
    lastSequence: { current: undefined as number | undefined },
  };
});

vi.mock('@/lib/realtime/connectionSupervisor', () => ({
  onAnyReconnect: (cb: () => void) => {
    h.reconnectCb.current = cb;
    return () => {
      h.reconnectCb.current = null;
    };
  },
}));

vi.mock('@/lib/graphql/subscriptions', () => ({
  getLastRealtimeSequence: () => h.lastSequence.current,
  onSubscriptionCatchUp: (cb: (since?: number) => void) => {
    h.catchUpCb.current = cb;
    return () => {
      h.catchUpCb.current = null;
    };
  },
  requestRealtimeCatchUp: h.requestCatchUp,
}));

vi.mock('@/store/persistenceLayer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/persistenceLayer')>();
  return {
    ...actual,
    persistenceLayer: {
      getItem: async (name: string) => h.storage.get(name) ?? null,
      setItem: async (name: string, value: string) => {
        h.storage.set(name, value);
      },
      removeItem: async (name: string) => {
        h.storage.delete(name);
      },
      getJSON: async <T>(name: string): Promise<T | null> => {
        const raw = h.storage.get(name);
        return raw ? (JSON.parse(raw) as T) : null;
      },
      setJSON: async (name: string, value: unknown) => {
        h.storage.set(name, JSON.stringify(value));
      },
    },
  };
});

let syncEngine: any;
let useStore: any;

async function loadEngine() {
  class MockBroadcastChannel {
    onmessage: ((event: unknown) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {}
  }
  (window as any).BroadcastChannel = MockBroadcastChannel;
  const engine = await import('@/store/synchronizationEngine');
  const state = await import('@/store/stateManager');
  syncEngine = engine.syncEngine;
  useStore = state.useStore;
}

function persistedCursor(): number {
  const raw = h.storage.get('realtime_event_cursor');
  return raw ? JSON.parse(raw).sequence : 0;
}

function makeEvent(sequence: number, payload: Record<string, unknown>) {
  return {
    id: `evt-${sequence}`,
    sequence,
    type: 'state.updated',
    payload,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

beforeEach(async () => {
  vi.resetModules();
  h.storage.clear();
  h.reconnectCb.current = null;
  h.catchUpCb.current = null;
  h.lastSequence.current = undefined;
  h.requestCatchUp.mockReset();
  await loadEngine();
});

describe('synchronization engine — reconnect catch-up', () => {
  it('backfills missed events and advances the persisted cursor after a reconnect', async () => {
    h.storage.set('realtime_event_cursor', JSON.stringify({ sequence: 1 }));
    h.requestCatchUp.mockResolvedValue([
      makeEvent(2, { user: { id: 'u-9' } }),
      makeEvent(3, { app: { offlineMode: false } }),
    ]);

    h.reconnectCb.current!();

    await vi.waitFor(() => {
      expect(h.requestCatchUp).toHaveBeenCalledWith(1);
    });
    await vi.waitFor(() => {
      expect(useStore.getState().user.id).toBe('u-9');
    });
    await vi.waitFor(() => {
      expect(persistedCursor()).toBe(3);
    });
    expect(useStore.getState().app.lastSynced).not.toBeNull();
  });

  it('prefers the supervisor live sequence over the persisted cursor', async () => {
    h.storage.set('realtime_event_cursor', JSON.stringify({ sequence: 1 }));
    h.lastSequence.current = 5;
    h.requestCatchUp.mockResolvedValue([
      makeEvent(6, { user: { id: 'u-6' } }),
    ]);

    h.reconnectCb.current!();

    await vi.waitFor(() => {
      expect(h.requestCatchUp).toHaveBeenCalledWith(5);
    });
    await vi.waitFor(() => {
      expect(persistedCursor()).toBe(6);
    });
  });

  it('recovers missed events when the subscriptions layer signals a gap', async () => {
    h.requestCatchUp.mockResolvedValue([
      makeEvent(4, { user: { id: 'u-gap' } }),
    ]);

    h.catchUpCb.current?.(3);

    await vi.waitFor(() => {
      expect(h.requestCatchUp).toHaveBeenCalledWith(3);
    });
    await vi.waitFor(() => {
      expect(useStore.getState().user.id).toBe('u-gap');
    });
  });

  it('skips applying events that carry no owned state slices but still advances the cursor', async () => {
    h.requestCatchUp.mockResolvedValue([
      makeEvent(2, { unrelated: { anything: true } }),
    ]);

    h.reconnectCb.current!();

    await vi.waitFor(() => {
      expect(h.requestCatchUp).toHaveBeenCalledTimes(1);
    });
    expect(useStore.getState().user.id).toBeNull();
    await vi.waitFor(() => {
      expect(persistedCursor()).toBe(2);
    });
  });

  it('survives a catch-up fetch failure without touching the cursor', async () => {
    h.storage.set('realtime_event_cursor', JSON.stringify({ sequence: 2 }));
    h.requestCatchUp.mockResolvedValue(null);

    h.reconnectCb.current!();

    await vi.waitFor(() => {
      expect(h.requestCatchUp).toHaveBeenCalledTimes(1);
    });
    expect(persistedCursor()).toBe(2);
  });
});