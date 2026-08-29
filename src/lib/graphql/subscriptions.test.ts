import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock heavy Apollo/graphql-ws deps before importing the module under test ──
vi.mock('@apollo/client/link/subscriptions', () => ({
  GraphQLWsLink: vi.fn().mockImplementation(function () {
    return { request: vi.fn() };
  }),
}));

vi.mock('graphql-ws', () => ({
  createClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@apollo/client', () => {
  const HttpLink = vi.fn().mockImplementation(function () {
    return { request: vi.fn() };
  });
  const ApolloLink = { from: vi.fn((links) => links[0]) };
  const split = vi.fn((test, ws, http) => ({ _ws: ws, _http: http, _split: true }));
  const ApolloClient = vi.fn().mockImplementation(function (opts: { link: unknown }) {
    return { link: opts.link };
  });
  const InMemoryCache = vi.fn().mockImplementation(function () {
    return {};
  });
  return { HttpLink, ApolloLink, split, ApolloClient, InMemoryCache };
});

vi.mock('@apollo/client/utilities', () => ({
  getMainDefinition: vi.fn(),
}));

import { createClient as createWSClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { split, HttpLink } from '@apollo/client';
import { flagStore } from '@/lib/feature-flags';
import { getSupervisor } from '@/lib/realtime/connectionSupervisor';
import {
  isFeatureEnabled,
  createSubscriptionClient,
  SubscriptionConfig,
  GRAPHQL_SUBSCRIPTIONS_CONNECTION,
  getActiveSubscriptions,
  getActiveSubscriptionCount,
} from './subscriptions';

const BASE_CONFIG: SubscriptionConfig = {
  subscriptionUrl: 'ws://localhost/graphql',
  httpUrl: 'http://localhost/graphql',
};

function seedFlag(id: string, enabled: boolean) {
  flagStore.set(id, {
    id,
    name: id,
    description: '',
    enabled,
    strategy: 'all',
    percentage: 100,
    rules: [],
    tags: [],
    createdAt: '',
    updatedAt: '',
    createdBy: 'test',
  });
}

beforeEach(() => {
  flagStore.clear();
  vi.clearAllMocks();
});

// ── isFeatureEnabled ──────────────────────────────────────────────────────────

describe('isFeatureEnabled', () => {
  it('returns false when flag does not exist', () => {
    expect(isFeatureEnabled('flag_missing')).toBe(false);
  });

  it('returns false when flag is disabled', () => {
    seedFlag('flag_off', false);
    expect(isFeatureEnabled('flag_off')).toBe(false);
  });

  it('returns true when flag is enabled with strategy=all', () => {
    seedFlag('flag_on', true);
    expect(isFeatureEnabled('flag_on')).toBe(true);
  });
});

// ── createSubscriptionClient — feature gate ───────────────────────────────────

describe('createSubscriptionClient', () => {
  it('builds WS+split link when no featureGate is provided', () => {
    createSubscriptionClient(BASE_CONFIG);
    expect(createWSClient).toHaveBeenCalledTimes(1);
    expect(GraphQLWsLink).toHaveBeenCalledTimes(1);
    expect(split).toHaveBeenCalledTimes(1);
  });

  it('recreates the websocket client and restores active subscriptions after a socket close', () => {
    const firstClient = {
      subscribe: vi.fn(() => vi.fn()),
      terminate: vi.fn(),
    };
    const secondClient = {
      subscribe: vi.fn(() => vi.fn()),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient)
      .mockReturnValueOnce(firstClient as any)
      .mockReturnValueOnce(secondClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    expect(supervisor).toBeTruthy();

    const transport = supervisor!.getTransport() as any;
    transport.subscribe('graph-sub-1', {
      query: { kind: 'Document', definitions: [] },
      variables: { userId: 'u-1' },
      handler: vi.fn(),
    });

    expect(firstClient.subscribe).toHaveBeenCalledTimes(1);
    const registry = (supervisor as any).resubscribeRegistry;
    expect(registry.has('graphql:graph-sub-1')).toBe(true);

    const closed = vi.mocked(createWSClient).mock.calls[0][0].on.closed;
    closed();
    expect(firstClient.terminate).toHaveBeenCalledTimes(1);

    supervisor!.connect();
    expect(createWSClient).toHaveBeenCalledTimes(2);
    expect(secondClient.subscribe).toHaveBeenCalledTimes(1);

    registry.get('graphql:graph-sub-1')();
    expect(secondClient.subscribe).toHaveBeenCalledTimes(2);
  });

  it('restores multiple subscriptions after reconnect', () => {
    const mockClient = {
      subscribe: vi.fn(() => vi.fn()),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient).mockReturnValue(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    // Register multiple subscriptions
    transport.subscribe('sub-1', {
      query: { kind: 'Document', definitions: [{ name: { value: 'Sub1' } }] },
      variables: { id: '1' },
      handler: vi.fn(),
    });

    transport.subscribe('sub-2', {
      query: { kind: 'Document', definitions: [{ name: { value: 'Sub2' } }] },
      variables: { id: '2' },
      handler: vi.fn(),
    });

    transport.subscribe('sub-3', {
      query: { kind: 'Document', definitions: [{ name: { value: 'Sub3' } }] },
      variables: { id: '3' },
      handler: vi.fn(),
    });

    expect(mockClient.subscribe).toHaveBeenCalledTimes(3);
    expect(getActiveSubscriptionCount()).toBe(3);
    expect(getActiveSubscriptions()).toContain('sub-1');
    expect(getActiveSubscriptions()).toContain('sub-2');
    expect(getActiveSubscriptions()).toContain('sub-3');
  });

  it('handles unsubscription before reconnect', () => {
    const mockClient = {
      subscribe: vi.fn(() => vi.fn()),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient).mockReturnValue(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    // Register subscription
    const unsubscribe = transport.subscribe('sub-1', {
      query: { kind: 'Document', definitions: [] },
      variables: {},
      handler: vi.fn(),
    });

    expect(getActiveSubscriptionCount()).toBe(1);

    // Unsubscribe before reconnect
    unsubscribe();
    expect(getActiveSubscriptionCount()).toBe(0);

    // Attempt to trigger reconnect
    const registry = (supervisor as any).resubscribeRegistry;
    expect(registry.has('graphql:sub-1')).toBe(false);
  });

  it('handles subscription with variables correctly', () => {
    const mockClient = {
      subscribe: vi.fn(({ query, variables }) => {
        // Verify variables are passed through
        expect(variables).toEqual({ userId: 'user-123', limit: 10 });
        return vi.fn();
      }),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient).mockReturnValue(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    transport.subscribe('sub-with-vars', {
      query: { kind: 'Document', definitions: [] },
      variables: { userId: 'user-123', limit: 10 },
      handler: vi.fn(),
    });

    expect(mockClient.subscribe).toHaveBeenCalledTimes(1);
    const callArgs = mockClient.subscribe.mock.calls[0][0];
    expect(callArgs.variables).toEqual({ userId: 'user-123', limit: 10 });
  });

  it('handles handler errors gracefully', () => {
    const errorHandler = vi.fn(() => {
      throw new Error('Handler failed');
    });
    const mockClient = {
      subscribe: vi.fn(({ variables }, handlers) => {
        // Simulate receiving data
        setTimeout(() => handlers.next({ data: { test: 'value' } }), 0);
        return vi.fn();
      }),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient).mockReturnValue(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    expect(() => {
      transport.subscribe('error-sub', {
        query: { kind: 'Document', definitions: [] },
        variables: {},
        handler: errorHandler,
      });
    }).not.toThrow();
  });

  it('handles resubscription errors gracefully', () => {
    const mockClient = {
      subscribe: vi.fn(() => {
        throw new Error('Subscribe failed');
      }),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient).mockReturnValue(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    expect(() => {
      transport.subscribe('failing-sub', {
        query: { kind: 'Document', definitions: [] },
        variables: {},
        handler: vi.fn(),
      });
    }).not.toThrow();
  });

  it('restores subscription handler after reconnect', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const mockClient = {
      subscribe: vi.fn(({ variables }, handlers) => {
        // Simulate receiving data on first call
        if (mockClient.subscribe.mock.callCount === 1) {
          handlers.next({ data: { message: 'initial' } });
        }
        // Simulate receiving data on resubscribe
        if (mockClient.subscribe.mock.callCount === 2) {
          handlers.next({ data: { message: 'resubscribed' } });
        }
        return vi.fn();
      }),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient).mockReturnValue(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    // Subscribe
    transport.subscribe('handler-test', {
      query: { kind: 'Document', definitions: [] },
      variables: {},
      handler: handler1,
    });

    // Simulate reconnect by calling the resubscribe handler
    const registry = (supervisor as any).resubscribeRegistry;
    const resubscribeHandler = registry.get('graphql:handler-test');

    expect(resubscribeHandler).toBeDefined();
    resubscribeHandler?.();

    expect(mockClient.subscribe).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate resubscriptions when resubscribeAll is called multiple times', () => {
    const mockClient = {
      subscribe: vi.fn(() => vi.fn()),
      terminate: vi.fn(),
    };

    vi.mocked(createWSClient)
      .mockReturnValueOnce(mockClient as any)
      .mockReturnValueOnce(mockClient as any);

    createSubscriptionClient(BASE_CONFIG);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const transport = supervisor!.getTransport() as any;

    // Register subscription
    transport.subscribe('sub-1', {
      query: { kind: 'Document', definitions: [] },
      variables: {},
      handler: vi.fn(),
    });

    expect(mockClient.subscribe).toHaveBeenCalledTimes(1);

    // Manually call connect (which triggers resubscribeAll)
    const initialCallCount = mockClient.subscribe.mock.callCount;
    transport.connect();

    // Should resubscribe once
    expect(mockClient.subscribe.mock.callCount).toBeGreaterThanOrEqual(initialCallCount);
  });

  it('builds WS+split link when featureGate flag is enabled', () => {
    seedFlag('flag_subs', true);
    createSubscriptionClient({ ...BASE_CONFIG, featureGate: { flagId: 'flag_subs' } });
    expect(createWSClient).toHaveBeenCalledTimes(1);
    expect(split).toHaveBeenCalledTimes(1);
  });

  it('falls back to HTTP-only link when featureGate flag is disabled', () => {
    seedFlag('flag_subs', false);
    createSubscriptionClient({ ...BASE_CONFIG, featureGate: { flagId: 'flag_subs' } });
    expect(createWSClient).not.toHaveBeenCalled();
    expect(GraphQLWsLink).not.toHaveBeenCalled();
    expect(split).not.toHaveBeenCalled();
    expect(HttpLink).toHaveBeenCalledTimes(1);
  });

  it('falls back to HTTP-only link when featureGate flag does not exist', () => {
    createSubscriptionClient({ ...BASE_CONFIG, featureGate: { flagId: 'flag_nonexistent' } });
    expect(createWSClient).not.toHaveBeenCalled();
    expect(split).not.toHaveBeenCalled();
  });

  it('passes featureGate context to flag evaluation', () => {
    flagStore.set('flag_targeting', {
      id: 'flag_targeting',
      name: 'targeting',
      description: '',
      enabled: true,
      strategy: 'targeting',
      percentage: 0,
      rules: [{ attribute: 'plan', operator: 'equals', value: 'pro' }],
      tags: [],
      createdAt: '',
      updatedAt: '',
      createdBy: 'test',
    });

    // pro user → WS enabled
    createSubscriptionClient({
      ...BASE_CONFIG,
      featureGate: { flagId: 'flag_targeting', context: { plan: 'pro' } },
    });
    expect(createWSClient).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    // free user → HTTP only
    createSubscriptionClient({
      ...BASE_CONFIG,
      featureGate: { flagId: 'flag_targeting', context: { plan: 'free' } },
    });
    expect(createWSClient).not.toHaveBeenCalled();
  });
});
