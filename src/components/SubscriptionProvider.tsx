'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { ApolloProvider, ApolloClient } from '@apollo/client';
import {
  createSubscriptionClient,
  SubscriptionConfig,
  DEFAULT_SUBSCRIPTION_CONFIG,
} from '@/lib/graphql/subscriptions';

/**
 * Context for accessing the Apollo Client with subscription support
 */
const SubscriptionClientContext = createContext<ApolloClient<any> | null>(null);

/**
 * Props for SubscriptionProvider
 */
export interface SubscriptionProviderProps {
  children: ReactNode;
  config: SubscriptionConfig;
  /**
   * Optional custom Apollo Client instance
   * If provided, config is ignored
   */
  client?: ApolloClient<any>;
}

/**
 * Provider component that configures GraphQL subscriptions
 * Wraps the application with Apollo Client configured for subscriptions
 *
 * @example
 * ```tsx
 * <SubscriptionProvider
 *   config={{
 *     subscriptionUrl: 'wss://api.teachlink.com/graphql',
 *     httpUrl: 'https://api.teachlink.com/graphql',
 *     headers: {
 *       authorization: `Bearer ${token}`,
 *     },
 *   }}
 * >
 *   <App />
 * </SubscriptionProvider>
 * ```
 */
export function SubscriptionProvider({
  children,
  config,
  client: customClient,
}: SubscriptionProviderProps) {
  const client = useMemo(() => {
    if (customClient) {
      return customClient;
    }

    const mergedConfig: SubscriptionConfig = {
      ...DEFAULT_SUBSCRIPTION_CONFIG,
      ...config,
      reconnect: {
        ...(DEFAULT_SUBSCRIPTION_CONFIG.reconnect as any),
        ...config.reconnect,
      },
    };

    return createSubscriptionClient(mergedConfig);
  }, [config, customClient]);

  return (
    <ApolloProvider client={client}>
      <SubscriptionClientContext.Provider value={client}>
        {children}
      </SubscriptionClientContext.Provider>
    </ApolloProvider>
  );
}

/**
 * Hook to access the subscription-enabled Apollo Client
 * Must be used within a SubscriptionProvider
 *
 * @throws {Error} If used outside of SubscriptionProvider
 *
 * @example
 * ```tsx
 * const client = useSubscriptionClient();
 * const query = client.query({ query: MY_QUERY });
 * ```
 */
export function useSubscriptionClient(): ApolloClient<any> {
  const client = useContext(SubscriptionClientContext);

  if (!client) {
    throw new Error(
      'useSubscriptionClient must be used within a SubscriptionProvider. ' +
      'Make sure your component is wrapped with <SubscriptionProvider>.',
    );
  }

  return client;
}

/**
 * Hook to check if subscription client is available
 */
export function useHasSubscriptionClient(): boolean {
  return useContext(SubscriptionClientContext) !== null;
}
