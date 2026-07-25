import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock heavy Apollo/graphql-ws deps before importing the module under test ──
vi.mock('@apollo/client/link/subscriptions', () => ({
  GraphQLWsLink: vi.fn().mockImplementation(() => ({ request: vi.fn() })),
}));

vi.mock('graphql-ws', () => ({
  createClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@apollo/client', () => {
  const HttpLink = vi.fn().mockImplementation(() => ({ request: vi.fn() }));
  const ApolloLink = { from: vi.fn((links) => links[0]) };
  const split = vi.fn((test, ws, http) => ({ _ws: ws, _http: http, _split: true }));
  const ApolloClient = vi.fn().mockImplementation((opts) => ({ link: opts.link }));
  const InMemoryCache = vi.fn().mockImplementation(() => ({}));
  return { HttpLink, ApolloLink, split, ApolloClient, InMemoryCache };
});

vi.mock('@apollo/client/utilities', () => ({
  getMainDefinition: vi.fn(),
}));

import { createClient as createWSClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { split, HttpLink } from '@apollo/client';
import { flagStore } from '@/lib/feature-flags';
import { isFeatureEnabled, createSubscriptionClient, SubscriptionConfig } from './subscriptions';

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
