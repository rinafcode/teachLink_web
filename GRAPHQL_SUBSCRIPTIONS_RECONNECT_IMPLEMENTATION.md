# GraphQL Subscriptions Auto-Reconnect Implementation

## Overview
This document summarizes the implementation of automatic GraphQL subscription resubscription after socket reconnection in the TeachLink application.

## Problem Statement
Active subscriptions were not being restored after a socket drop, causing updates to stop until the page was manually refreshed.

## Solution
Implemented automatic subscription management through the `ConnectionSupervisor` with a registry-based resubscription mechanism.

## Implementation Details

### 1. Enhanced `GraphQLWsTransport` Class
**File**: `src/lib/graphql/subscriptions.ts`

#### Key Improvements:
- **Subscription Tracking**: Maintains a map of active subscriptions with their metadata
- **Resubscription Prevention**: Added `resubscribeInProgress` flag to prevent race conditions during reconnects
- **Improved Logging**: Comprehensive debug logging for subscription lifecycle events
- **Error Handling**: Graceful error handling in `resubscribe()` with proper cleanup
- **Public Methods** for monitoring:
  - `getActiveSubscriptionCount()`: Returns count of active subscriptions
  - `getActiveSubscriptionIds()`: Returns array of subscription IDs

#### Resubscription Flow:
1. When a subscription is registered via `subscribe()`:
   - Entry is stored in the subscriptions map
   - A resubscribe handler is registered with the supervisor
   - The subscription is immediately established

2. When the connection drops and reconnects:
   - `ConnectionSupervisor` detects the open event
   - Calls `connect()` on the transport
   - `connect()` calls `resubscribeAll()` to restore all subscriptions
   - Each subscription is re-established via `resubscribe(id)`

3. If a subscription fails during resubscription:
   - Error is logged with context
   - Subscription remains in registry for future reconnects
   - Other subscriptions are not affected

### 2. New Public APIs
**File**: `src/lib/graphql/subscriptions.ts`

```typescript
/**
 * Get all active subscription IDs for the GraphQL connection
 */
export function getActiveSubscriptions(): string[]

/**
 * Get the count of active subscriptions for the GraphQL connection
 */
export function getActiveSubscriptionCount(): number
```

These functions allow monitoring and debugging of active subscriptions.

### 3. Enhanced Documentation
**File**: `src/lib/graphql/subscriptionQueries.ts`

Added comprehensive documentation including:
- **Automatic Resubscription Explanation**: How the mechanism works
- **Usage Examples**: Step-by-step guide with code samples
- **Subscription Lifecycle**: Detailed phases from subscribe to reconnect
- **Error Handling**: How errors are managed
- **Monitoring**: How to track active subscriptions and connection status
- **React Patterns**: Common patterns for using subscriptions in React
- **Performance Considerations**: Memory management and efficiency tips
- **Feature Gate Documentation**: How to enable/disable subscriptions per user

### 4. Comprehensive Test Suite
**File**: `src/lib/graphql/subscriptions.test.ts`

Added 10+ new test cases:

1. **Basic Functionality**:
   - `builds WS+split link when no featureGate is provided`
   - `recreates the websocket client and restores active subscriptions after a socket close`

2. **Multiple Subscriptions**:
   - `restores multiple subscriptions after reconnect`
   - Tests that all subscriptions are reestablished

3. **Unsubscription**:
   - `handles unsubscription before reconnect`
   - Verifies subscriptions are removed from registry

4. **Variables & Handlers**:
   - `handles subscription with variables correctly`
   - `handles handler errors gracefully`
   - `restores subscription handler after reconnect`

5. **Error Scenarios**:
   - `handles resubscription errors gracefully`
   - Ensures one failing subscription doesn't affect others

6. **Race Conditions**:
   - `prevents duplicate resubscriptions when resubscribeAll is called multiple times`

7. **Feature Gates**:
   - `builds WS+split link when featureGate flag is enabled`
   - `falls back to HTTP-only link when featureGate flag is disabled`
   - `passes featureGate context to flag evaluation`

## How It Works

### Reconnection Sequence Diagram
```
Socket Open
    ↓
WebSocket connected
    ↓
ConnectionSupervisor.handleOpen()
    ↓
ConnectionSupervisor.runResubscribeRegistry()
    ↓
For each registered subscription:
    - Call resubscribe handler
    - Transport.resubscribe(id)
    - graphql-ws client.subscribe()
    ↓
All subscriptions restored
    ↓
Updates resume flowing
```

### Subscription Entry Structure
```typescript
interface SubscriptionEntry {
  query: DocumentNode;           // GraphQL subscription document
  variables?: Record<...>;       // Query variables
  handler: (payload: any) => void; // Handler for incoming data
}
```

## Testing

All tests are defined in `src/lib/graphql/subscriptions.test.ts` and cover:

- ✅ Feature gate evaluation
- ✅ WebSocket client creation and lifecycle
- ✅ Single and multiple subscription restoration
- ✅ Unsubscription handling
- ✅ Variable passing
- ✅ Error handling and recovery
- ✅ Handler invocation
- ✅ Race condition prevention
- ✅ Duplicate prevention

## Acceptance Criteria Met

✅ **Implemented across listed files**:
- `src/lib/graphql/subscriptions.ts` - Enhanced with better reconnection handling
- `src/lib/graphql/subscriptionQueries.ts` - Updated with comprehensive documentation

✅ **Unit/Integration tests added**:
- 10+ new test cases covering reconnection scenarios
- Tests verify subscriptions are restored after socket drops
- Tests cover edge cases and error scenarios

✅ **All tests passing**:
- No TypeScript compilation errors
- Test coverage for all critical paths

## Key Features

1. **Automatic Resubscription**: Subscriptions are automatically re-established after reconnects
2. **Graceful Error Handling**: One failing subscription doesn't affect others
3. **Comprehensive Logging**: Debug logging for troubleshooting subscription issues
4. **Monitoring APIs**: Public functions to check active subscriptions
5. **Multiple Subscriptions**: Support for many concurrent subscriptions
6. **Race Condition Protection**: Prevents duplicate resubscriptions
7. **Feature Gating**: Optional feature flag support for rollouts

## Usage Example

```typescript
import { subscribeRealtime } from '@/lib/graphql/subscriptions';
import { USER_NOTIFICATIONS_SUBSCRIPTION } from '@/lib/graphql/subscriptionQueries';

// Subscribe to notifications
const unsubscribe = subscribeRealtime(
  `user-notifications-${userId}`,  // Unique ID
  USER_NOTIFICATIONS_SUBSCRIPTION,   // GraphQL subscription
  { userId },                        // Variables
  (data) => {                        // Handler
    console.log('New notification:', data);
  }
);

// Automatically resubscribed on reconnect
// Unsubscribe when done
unsubscribe();
```

## Monitoring

```typescript
import { 
  getActiveSubscriptions,
  getActiveSubscriptionCount,
  getConnectionManager 
} from '@/lib/graphql/subscriptions';

// Check active subscriptions
console.log('Active subscriptions:', getActiveSubscriptions());
console.log('Count:', getActiveSubscriptionCount());

// Listen to connection changes
getConnectionManager().onStateChange((event) => {
  console.log('Connection state:', event.state);
});
```

## Backward Compatibility

All changes are backward compatible:
- Existing subscription mechanisms continue to work
- New logging is non-intrusive
- New public APIs are optional
- No breaking changes to existing signatures

## Future Enhancements

1. Metrics/telemetry for subscription lifecycle events
2. Subscription deduplication logic
3. Priority-based resubscription (important subscriptions first)
4. Subscription audit logging
5. Memory usage monitoring
