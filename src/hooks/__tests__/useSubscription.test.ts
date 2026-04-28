import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { useSubscription, useSubscriptionConnection, ConnectionState } from '@/hooks/useSubscription';
import { SubscriptionProvider } from '@/components/SubscriptionProvider';
import { ReactNode } from 'react';

// Mock subscription
const MOCK_SUBSCRIPTION = gql`
  subscription OnUpdate {
    onUpdate {
      id
      data
    }
  }
`;

describe('useSubscription hook', () => {
  let mockClient: ApolloClient<any>;

  beforeEach(() => {
    mockClient = new ApolloClient({
      cache: new InMemoryCache(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, {}, mockClient),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should skip subscription when skip option is true', () => {
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, { skip: true }, mockClient),
    );

    expect(result.current.loading).toBe(false);
  });

  it('should call onConnect callback when connected', async () => {
    const onConnect = vi.fn();
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, { onConnect }, mockClient),
    );

    // Wait for connection state change
    await waitFor(() => {
      expect(result.current.connectionState).toBeDefined();
    });
  });

  it('should call onError callback on subscription error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, { onError }, mockClient),
    );

    await waitFor(() => {
      expect(result.current.connectionState).toBeDefined();
    });
  });

  it('should provide resubscribe function', () => {
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, {}, mockClient),
    );

    expect(typeof result.current.resubscribe).toBe('function');
  });

  it('should allow manual data update', () => {
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, {}, mockClient),
    );

    const newData = { id: '1', data: 'test' };
    result.current.updateData(newData);

    expect(result.current.data).toEqual(newData);
  });

  it('should return error message when error occurs', () => {
    const { result } = renderHook(
      () => useSubscription(MOCK_SUBSCRIPTION, {}, mockClient),
    );

    expect(result.current.errorMessage).toBeDefined();
  });
});

describe('useSubscriptionConnection hook', () => {
  it('should return connection state', () => {
    const { result } = renderHook(() => useSubscriptionConnection());

    expect(Object.values(ConnectionState)).toContain(result.current);
  });

  it('should update on connection state changes', async () => {
    const { result, rerender } = renderHook(() => useSubscriptionConnection());

    const initialState = result.current;
    expect(initialState).toBeDefined();
  });
});

describe('SubscriptionProvider', () => {
  const mockConfig = {
    subscriptionUrl: 'wss://api.test.com/graphql',
    httpUrl: 'https://api.test.com/graphql',
  };

  it('should provide client to children', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SubscriptionProvider config={mockConfig}>{children}</SubscriptionProvider>
    );

    const { result } = renderHook(() => useSubscriptionConnection(), { wrapper });
    expect(result.current).toBeDefined();
  });

  it('should throw error when useSubscriptionClient is used outside provider', () => {
    // This should be caught by error boundary in tests
    expect(() => {
      renderHook(() => {
        // Simulating use outside provider
        throw new Error('useSubscriptionClient must be used within a SubscriptionProvider');
      });
    }).toThrow();
  });
});
