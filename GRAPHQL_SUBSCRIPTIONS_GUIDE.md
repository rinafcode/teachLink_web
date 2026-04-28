# GraphQL Subscriptions - Real-Time Updates

## Overview

This implementation provides production-ready GraphQL subscriptions for TeachLink, enabling real-time data updates without polling. The system uses WebSocket (graphql-ws) for efficient bidirectional communication and includes automatic reconnection, error recovery, and fallback mechanisms.

## Features

✅ **WebSocket-based real-time subscriptions**
✅ **Automatic reconnection with exponential backoff**
✅ **Connection lifecycle management**
✅ **Error recovery and fallback to polling**
✅ **Connection state tracking**
✅ **Type-safe subscription hooks**
✅ **UI components for connection status**
✅ **Memory-efficient cleanup**
✅ **WCAG accessible components**

---

## Architecture

```
┌─────────────────────────────────────────┐
│     SubscriptionProvider (Root)         │
│  Wraps app with Apollo Client            │
└──────────────┬──────────────────────────┘
              │
┌─────────────┴──────────────────────────┐
│   createSubscriptionClient              │
│  - HTTP Link (queries/mutations)        │
│  - WebSocket Link (subscriptions)       │
│  - Automatic reconnection               │
└──────────────┬──────────────────────────┘
              │
┌─────────────┴──────────────────────────┐
│      useSubscription Hook               │
│  - Subscribe to real-time updates       │
│  - Manage connection lifecycle          │
│  - Handle errors & reconnection         │
└──────────────┬──────────────────────────┘
              │
    ┌─────────┴────────────┐
    │                      │
┌───▼──────┐       ┌─────▼────┐
│UI Data   │       │Status    │
│Display   │       │Indicator │
└──────────┘       └──────────┘
```

---

## Installation

Dependencies are already added to `package.json`:
- `@apollo/client` - GraphQL client
- `graphql` - GraphQL core
- `graphql-ws` - WebSocket protocol for GraphQL

Run installation:
```bash
npm install
```

---

## Setup

### 1. Wrap Your App with SubscriptionProvider

**File**: `src/app/layout.tsx`

```tsx
'use client';

import { SubscriptionProvider } from '@/components/SubscriptionProvider';
import type { JSX } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const subscriptionConfig = {
    subscriptionUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'wss://api.teachlink.com/graphql',
    httpUrl: process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || 'https://api.teachlink.com/graphql',
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN || ''}`,
    },
  };

  return (
    <html>
      <body>
        <SubscriptionProvider config={subscriptionConfig}>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  );
}
```

### 2. Set Environment Variables

**File**: `.env.local`

```bash
# GraphQL Subscription Endpoints
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://api.teachlink.com/graphql
NEXT_PUBLIC_GRAPHQL_HTTP_URL=https://api.teachlink.com/graphql

# Authentication
NEXT_PUBLIC_AUTH_TOKEN=your-jwt-token
```

---

## Usage

### Basic Subscription

```tsx
'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { NEW_POSTS_SUBSCRIPTION } from '@/lib/graphql/subscriptionQueries';

export function PostFeed() {
  const { data, loading, error, connectionState } = useSubscription(
    NEW_POSTS_SUBSCRIPTION,
    {
      variables: { topicId: 'web3' },
    },
  );

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.onNewPost && (
        <div>
          <h3>{data.onNewPost.title}</h3>
          <p>{data.onNewPost.content}</p>
        </div>
      )}
    </div>
  );
}
```

### Subscription with Callbacks

```tsx
export function NotificationCenter() {
  const { data, errorMessage, resubscribe } = useSubscription(
    USER_NOTIFICATIONS_SUBSCRIPTION,
    {
      variables: { userId: 'user-123' },
      onConnect: () => {
        console.log('Connected to notifications');
      },
      onData: (newNotification) => {
        console.log('New notification:', newNotification);
        // Play sound, show toast, etc.
      },
      onError: (error) => {
        console.error('Subscription error:', error);
      },
      onDisconnect: () => {
        console.log('Disconnected from notifications');
      },
    },
  );

  return (
    <div>
      {errorMessage && (
        <button onClick={resubscribe}>Retry Connection</button>
      )}
    </div>
  );
}
```

### Subscription with Polling Fallback

```tsx
export function LiveQuizResults() {
  const { data, loading, connectionState } = usePollableSubscription(
    LIVE_QUIZ_RESPONSES_SUBSCRIPTION,
    {
      variables: { quizId: 'quiz-123' },
      pollFn: async () => {
        // Fallback to polling if subscription fails
        const response = await fetch(`/api/quiz/quiz-123/responses`);
        return response.json();
      },
      pollIntervalMs: 5000,
    },
  );

  return (
    <div>
      <h2>Live Results</h2>
      {loading ? <LoadingSpinner /> : <ResultsList data={data} />}
    </div>
  );
}
```

---

## Available Subscriptions

Pre-built subscription queries available in `src/lib/graphql/subscriptionQueries.ts`:

### Posts & Comments
- `NEW_POSTS_SUBSCRIPTION` - New posts in topic
- `POST_COMMENTS_SUBSCRIPTION` - Comments on post

### Notifications
- `USER_NOTIFICATIONS_SUBSCRIPTION` - User notifications
- `FEED_UPDATES_SUBSCRIPTION` - Feed updates

### Tipping & Reputation
- `TIPPING_UPDATES_SUBSCRIPTION` - Received tips
- `REPUTATION_UPDATES_SUBSCRIPTION` - Reputation changes

### Real-Time Features
- `USER_ACTIVITY_SUBSCRIPTION` - User activity status
- `TYPING_INDICATOR_SUBSCRIPTION` - Typing indicators
- `MESSAGE_STATUS_SUBSCRIPTION` - Message delivery status
- `PRESENCE_SUBSCRIPTION` - Who's online

### Advanced
- `STUDY_GROUP_UPDATES_SUBSCRIPTION` - Study group messages
- `LIVE_QUIZ_RESPONSES_SUBSCRIPTION` - Quiz responses
- `BLOCKCHAIN_TRANSACTION_SUBSCRIPTION` - Transaction updates

---

## UI Components

### Connection Status Indicator

```tsx
import { ConnectionStatusIndicator } from '@/components/subscription/SubscriptionUI';

export function Header() {
  return (
    <header>
      <h1>TeachLink</h1>
      <ConnectionStatusIndicator
        showLabel={true}
        size="md"
      />
    </header>
  );
}
```

### Connection Status Banner

```tsx
import { ConnectionStatusBanner } from '@/components/subscription/SubscriptionUI';

export function App() {
  return (
    <>
      <ConnectionStatusBanner
        position="top"
        showOnSuccess={false}
        action={{
          label: 'Retry',
          onClick: () => window.location.reload(),
        }}
      />
      {/* Your app content */}
    </>
  );
}
```

### Loading State with Fallback

```tsx
import { SubscriptionLoadingState } from '@/components/subscription/SubscriptionUI';

export function PostFeed() {
  const { data, loading, error } = useSubscription(POST_SUBSCRIPTION);

  return (
    <SubscriptionLoadingState
      loading={loading}
      error={error}
      fallback={<SubscriptionSkeleton />}
    >
      <PostList posts={data} />
    </SubscriptionLoadingState>
  );
}
```

---

## Connection Management

### Connection States

```tsx
import { ConnectionState } from '@/lib/graphql/subscriptions';
import { useSubscriptionConnection } from '@/hooks/useSubscription';

export function ConnectionMonitor() {
  const state = useSubscriptionConnection();

  return (
    <div>
      {state === ConnectionState.CONNECTED && <p>✓ Connected</p>}
      {state === ConnectionState.CONNECTING && <p>⟳ Connecting...</p>}
      {state === ConnectionState.RECONNECTING && <p>⟳ Reconnecting...</p>}
      {state === ConnectionState.DISCONNECTED && <p>✗ Offline</p>}
      {state === ConnectionState.ERROR && <p>⚠ Error</p>}
    </div>
  );
}
```

### Manual Resubscription

```tsx
export function SubscriptionComponent() {
  const { data, error, resubscribe } = useSubscription(SUBSCRIPTION);

  function handleRetry() {
    resubscribe(); // Manually reconnect
  }

  if (error) {
    return <button onClick={handleRetry}>Retry Connection</button>;
  }

  return <div>{/* Display data */}</div>;
}
```

---

## Error Handling

### Connection Errors

```tsx
import { isConnectionError } from '@/lib/graphql/subscriptions';

export function SafeSubscription() {
  const { error } = useSubscription(SUBSCRIPTION);

  if (error && isConnectionError(error)) {
    return <p>Network connection lost. Retrying...</p>;
  }

  return <div>{/* Normal content */}</div>;
}
```

### Format Error Messages

```tsx
import { formatSubscriptionError } from '@/lib/graphql/subscriptions';

export function SubscriptionWithErrorDisplay() {
  const { error } = useSubscription(SUBSCRIPTION);

  return (
    <div>
      {error && (
        <ErrorAlert message={formatSubscriptionError(error)} />
      )}
    </div>
  );
}
```

---

## Advanced Patterns

### Multiple Subscriptions

```tsx
export function Dashboard() {
  const posts = useSubscription(NEW_POSTS_SUBSCRIPTION, {
    variables: { topicId: 'web3' },
  });

  const notifications = useSubscription(USER_NOTIFICATIONS_SUBSCRIPTION, {
    variables: { userId: 'user-123' },
  });

  const tips = useSubscription(TIPPING_UPDATES_SUBSCRIPTION, {
    variables: { recipientId: 'user-123' },
  });

  return (
    <div>
      <PostFeed data={posts.data} />
      <NotificationBell data={notifications.data} />
      <TipsWidget data={tips.data} />
    </div>
  );
}
```

### Conditional Subscriptions

```tsx
interface Props {
  postId?: string;
  isOpen: boolean;
}

export function PostComments({ postId, isOpen }: Props) {
  const { data } = useSubscription(
    POST_COMMENTS_SUBSCRIPTION,
    {
      variables: { postId: postId || '' },
      skip: !isOpen || !postId, // Skip if post not open or no postId
    },
  );

  if (!isOpen) return null;
  return <CommentsList comments={data?.onPostComment} />;
}
```

### Custom Subscription Hooks

```tsx
// Create a custom hook for specific feature
export function usePostComments(postId: string) {
  return useSubscription(
    POST_COMMENTS_SUBSCRIPTION,
    {
      variables: { postId },
      onData: (comment) => {
        // Custom logic here
        playNotificationSound();
      },
    },
  );
}

// Use in component
export function Comments({ postId }: { postId: string }) {
  const { data, loading } = usePostComments(postId);
  return <div>{/* Display comments */}</div>;
}
```

---

## Performance Optimization

### Memoization

```tsx
import { useCallback, useMemo } from 'react';

export function OptimizedFeed() {
  const variables = useMemo(() => ({ topicId: 'web3' }), []);

  const { data } = useSubscription(NEW_POSTS_SUBSCRIPTION, {
    variables,
  });

  const handlePostClick = useCallback((postId: string) => {
    // Handle click
  }, []);

  return <PostList posts={data} onPostClick={handlePostClick} />;
}
```

### Subscription Cleanup

The `useSubscription` hook automatically cleans up resources:
- Unsubscribes when component unmounts
- Clears timers and listeners
- Closes WebSocket connections

No manual cleanup needed!

---

## Browser Support

✅ Chrome/Edge 96+
✅ Firefox 95+
✅ Safari 15+
✅ Mobile browsers (iOS Safari 15+, Chrome Android)

**Note**: WebSocket requires secure contexts (HTTPS, except localhost)

---

## Configuration

### Custom Reconnection Settings

```tsx
const config = {
  subscriptionUrl: 'wss://api.teachlink.com/graphql',
  httpUrl: 'https://api.teachlink.com/graphql',
  reconnect: {
    maxRetries: 10,        // Retry up to 10 times
    initialDelayMs: 500,   // Start with 500ms delay
    maxDelayMs: 60000,     // Cap at 60 seconds
  },
  connectionTimeoutMs: 10000, // 10 second timeout
};

<SubscriptionProvider config={config}>
  {children}
</SubscriptionProvider>
```

### Custom Apollo Client

```tsx
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { SubscriptionProvider } from '@/components/SubscriptionProvider';

const customClient = new ApolloClient({
  cache: new InMemoryCache(),
  // ... your configuration
});

<SubscriptionProvider
  config={baseConfig}
  client={customClient}
>
  {children}
</SubscriptionProvider>
```

---

## Testing

### Test Subscriptions

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from '@/hooks/useSubscription';

describe('useSubscription', () => {
  it('should subscribe and receive data', async () => {
    const { result } = renderHook(() =>
      useSubscription(SUBSCRIPTION)
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Mock Subscriptions

```tsx
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: SUBSCRIPTION,
      variables: { id: '1' },
    },
    result: {
      data: {
        onUpdate: { id: '1', data: 'test' },
      },
    },
  },
];

<MockedProvider mocks={mocks}>
  <Component />
</MockedProvider>
```

---

## Troubleshooting

### Subscription not connecting

```
Check:
1. WebSocket URL is correct and accessible
2. Authentication headers are valid
3. Browser console for specific error messages
4. Network tab for failed connections
```

### Data not updating

```
Check:
1. Subscription is not skipped (skip: true)
2. Variables are correct
3. Connection state is CONNECTED
4. Server is sending updates
```

### Memory leaks

```
Check:
1. Components unmounting properly
2. No manual subscriptions without cleanup
3. useSubscription is used (not manual subscribe)
4. No circular dependencies in cache policies
```

### WebSocket connection timeout

```
Solution:
1. Increase connectionTimeoutMs in config
2. Check network latency
3. Verify server is responding
4. Check firewall/proxy settings
```

---

## Best Practices

✅ **Do:**
- Wrap app with `SubscriptionProvider` once at root
- Use `useSubscription` hook for subscriptions
- Handle errors gracefully with fallback UI
- Implement retry logic for failed connections
- Monitor connection state for UX improvements
- Clean up with proper dependency arrays

❌ **Don't:**
- Create multiple SubscriptionProviders
- Subscribe in server components
- Ignore connection errors
- Subscribe to large result sets without filtering
- Block UI on subscription data
- Forget to handle unmounting

---

## Documentation Files

- **[subscriptions.ts](src/lib/graphql/subscriptions.ts)** - Core configuration & client creation
- **[useSubscription.ts](src/hooks/useSubscription.ts)** - Main subscription hook
- **[subscriptionQueries.ts](src/lib/graphql/subscriptionQueries.ts)** - Pre-built subscriptions
- **[SubscriptionProvider.tsx](src/components/SubscriptionProvider.tsx)** - Provider component
- **[SubscriptionUI.tsx](src/components/subscription/SubscriptionUI.tsx)** - UI components

---

## Need Help?

- Documentation: See files above
- Examples: Check `src/app/` for usage patterns
- Tests: See `__tests__` directories
- Issues: GitHub issues with `graphql-subscriptions` label

---

**Ready to ship real-time TeachLink!** 🚀
