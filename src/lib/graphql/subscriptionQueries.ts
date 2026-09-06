/**
 * GraphQL Subscriptions
 *
 * ## Overview
 * This module provides typed GraphQL subscription queries for real-time features in TeachLink.
 * All subscriptions are automatically managed by the ConnectionSupervisor and will be
 * resubscribed automatically after a socket reconnection.
 *
 * ## Automatic Resubscription
 * When a WebSocket connection drops and reconnects:
 * 1. The ConnectionSupervisor detects the disconnection
 * 2. It automatically initiates reconnection with exponential backoff
 * 3. Upon successful reconnection, all active subscriptions are re-established
 * 4. Subscription handlers continue receiving updates without manual intervention
 *
 * ## Usage Example
 * ```typescript
 * import { subscribeRealtime } from '@/lib/graphql/subscriptions';
 * import { USER_NOTIFICATIONS_SUBSCRIPTION } from '@/lib/graphql/subscriptionQueries';
 *
 * // Subscribe to notifications
 * const unsubscribe = subscribeRealtime(
 *   `user-notifications-${userId}`,  // Unique ID for this subscription
 *   USER_NOTIFICATIONS_SUBSCRIPTION,   // GraphQL subscription document
 *   { userId },                        // Variables to pass to the subscription
 *   (data) => {                        // Handler for incoming data
 *     console.log('New notification:', data);
 *   }
 * );
 *
 * // Unsubscribe when done (cleanup)
 * unsubscribe();
 * ```
 *
 * ## Subscription Lifecycle
 * - **Initial Subscribe**: Subscription is established immediately when subscribeRealtime is called
 * - **Active**: Subscription receives data from the server
 * - **Disconnect**: If socket drops, subscription remains registered in the supervisor
 * - **Reconnect**: Upon reconnection, all registered subscriptions are automatically re-established
 * - **Unsubscribe**: Calling the returned unsubscribe function removes the subscription
 *
 * ## Error Handling
 * Subscription errors are logged and emitted through the connection supervisor's error handlers.
 * If a subscription fails during resubscription:
 * - The error is logged with context
 * - The subscription remains registered for future reconnect attempts
 * - Other subscriptions are not affected
 *
 * ## Monitoring
 * Get active subscriptions:
 * ```typescript
 * import { getActiveSubscriptions, getActiveSubscriptionCount } from '@/lib/graphql/subscriptions';
 *
 * const activeIds = getActiveSubscriptions();
 * const count = getActiveSubscriptionCount();
 * ```
 *
 * Listen to connection status:
 * ```typescript
 * import { getConnectionManager } from '@/lib/graphql/subscriptions';
 *
 * const manager = getConnectionManager();
 * manager.onStateChange((event) => {
 *   console.log('Connection state:', event.state);
 * });
 * ```
 *
 * ## Common Patterns
 *
 * ### React Hook (useSubscription)
 * ```typescript
 * function useNotifications(userId: string) {
 *   const [notifications, setNotifications] = useState([]);
 *
 *   useEffect(() => {
 *     const unsubscribe = subscribeRealtime(
 *       `notifications-${userId}`,
 *       USER_NOTIFICATIONS_SUBSCRIPTION,
 *       { userId },
 *       (data) => setNotifications(prev => [...prev, data])
 *     );
 *     return unsubscribe;
 *   }, [userId]);
 *
 *   return notifications;
 * }
 * ```
 *
 * ### Multiple Subscriptions
 * ```typescript
 * // Multiple subscriptions are supported and will all be resubscribed
 * const unsub1 = subscribeRealtime('sub1', QUERY_1, vars1, handler1);
 * const unsub2 = subscribeRealtime('sub2', QUERY_2, vars2, handler2);
 * const unsub3 = subscribeRealtime('sub3', QUERY_3, vars3, handler3);
 *
 * // Clean up individually
 * unsub1();
 * unsub2();
 * unsub3();
 * ```
 *
 * ## Performance Considerations
 * - Each subscription maintains state in memory (query, variables, handler)
 * - Handlers should be efficient to avoid blocking the event loop
 * - Unsubscribe when the subscription is no longer needed
 * - The supervisor manages outbound queue with bounded backpressure
 *
 * ## Feature Gate
 * GraphQL subscriptions can be feature-gated using feature flags:
 * ```typescript
 * const client = createSubscriptionClient({
 *   subscriptionUrl: 'ws://...',
 *   httpUrl: 'http://...',
 *   featureGate: {
 *     flagId: 'realtime_subscriptions',
 *     context: { userId, plan }
 *   }
 * });
 * ```
 * When the flag is disabled, subscriptions fall back to HTTP polling.
 */

import { gql } from '@apollo/client';

/**
 * Subscribe to new posts in a topic
 */
export const NEW_POSTS_SUBSCRIPTION = gql`
  subscription OnNewPosts($topicId: ID!) {
    onNewPost(topicId: $topicId) {
      id
      title
      content
      author {
        id
        username
        avatar
      }
      createdAt
      likes
      comments
    }
  }
`;

/**
 * Subscribe to post comments
 */
export const POST_COMMENTS_SUBSCRIPTION = gql`
  subscription OnPostComments($postId: ID!) {
    onPostComment(postId: $postId) {
      id
      content
      author {
        id
        username
        avatar
      }
      createdAt
      likes
      replies {
        id
        content
        author {
          id
          username
        }
        createdAt
      }
    }
  }
`;

/**
 * Subscribe to user notifications
 */
export const USER_NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription OnUserNotifications($userId: ID!) {
    onNotification(userId: $userId) {
      id
      type
      title
      message
      data {
        postId
        userId
        commentId
      }
      read
      createdAt
    }
  }
`;

/**
 * Subscribe to tipping updates
 */
export const TIPPING_UPDATES_SUBSCRIPTION = gql`
  subscription OnTippingUpdates($recipientId: ID!) {
    onTip(recipientId: $recipientId) {
      id
      sender {
        id
        username
        avatar
      }
      amount
      currency
      message
      transactionHash
      status
      createdAt
    }
  }
`;

/**
 * Subscribe to reputation updates
 */
export const REPUTATION_UPDATES_SUBSCRIPTION = gql`
  subscription OnReputationUpdates($userId: ID!) {
    onReputationChange(userId: $userId) {
      currentReputation
      previousReputation
      change
      reason
      badge
      timestamp
    }
  }
`;

/**
 * Subscribe to live user activity
 */
export const USER_ACTIVITY_SUBSCRIPTION = gql`
  subscription OnUserActivity($userId: ID!) {
    onUserActivityUpdate(userId: $userId) {
      userId
      status
      lastActiveAt
      currentPostId
      currentTopicId
    }
  }
`;

/**
 * Subscribe to study group updates
 */
export const STUDY_GROUP_UPDATES_SUBSCRIPTION = gql`
  subscription OnStudyGroupUpdates($groupId: ID!) {
    onStudyGroupUpdate(groupId: $groupId) {
      id
      name
      members {
        id
        username
        avatar
        status
      }
      messages {
        id
        author {
          id
          username
        }
        content
        createdAt
      }
      updatedAt
    }
  }
`;

/**
 * Subscribe to live quiz responses
 */
export const LIVE_QUIZ_RESPONSES_SUBSCRIPTION = gql`
  subscription OnLiveQuizResponses($quizId: ID!) {
    onQuizResponse(quizId: $quizId) {
      id
      userId
      username
      answer
      correct
      timeSpent
      submittedAt
    }
  }
`;

/**
 * Subscribe to real-time search results
 */
export const SEARCH_RESULTS_SUBSCRIPTION = gql`
  subscription OnSearchResults($query: String!, $filters: SearchFilters) {
    onSearchResults(query: $query, filters: $filters) {
      id
      title
      type
      relevanceScore
      highlight
      author {
        id
        username
      }
    }
  }
`;

/**
 * Subscribe to feed updates
 */
export const FEED_UPDATES_SUBSCRIPTION = gql`
  subscription OnFeedUpdates($userId: ID!, $limit: Int = 20) {
    onFeedUpdate(userId: $userId, limit: $limit) {
      items {
        id
        type
        content {
          id
          title
          author {
            id
            username
            avatar
          }
          likes
          comments
          createdAt
        }
      }
      totalCount
      hasMore
    }
  }
`;

/**
 * Subscribe to typing indicators
 */
export const TYPING_INDICATOR_SUBSCRIPTION = gql`
  subscription OnTypingIndicator($conversationId: ID!) {
    onTyping(conversationId: $conversationId) {
      userId
      username
      isTyping
    }
  }
`;

/**
 * Subscribe to message delivery status
 */
export const MESSAGE_STATUS_SUBSCRIPTION = gql`
  subscription OnMessageStatus($senderId: ID!) {
    onMessageStatusUpdate(senderId: $senderId) {
      messageId
      status
      deliveredAt
      readAt
      recipientId
    }
  }
`;

/**
 * Subscribe to blockchain transaction updates
 */
export const BLOCKCHAIN_TRANSACTION_SUBSCRIPTION = gql`
  subscription OnTransactionUpdate($transactionHash: String!) {
    onTransactionStatusUpdate(transactionHash: $transactionHash) {
      transactionHash
      status
      confirmations
      blockNumber
      gasUsed
      timestamp
    }
  }
`;

/**
 * Subscribe to presence updates (who's online)
 */
export const PRESENCE_SUBSCRIPTION = gql`
  subscription OnPresenceUpdates {
    onPresenceChange {
      userId
      username
      status
      lastSeen
      location
    }
  }
`;

/**
 * Catch-up query used to backfill events missed while the realtime connection was
 * down. Consumed by the connection supervisor's inbound sequence-gap handler after
 * a reconnect (`since` = last seen sequence number).
 */
export const REALTIME_CATCHUP_QUERY = gql`
  query RealtimeCatchUp($since: ID!) {
    realtimeEvents(since: $since) {
      id
      sequence
      type
      payload
      createdAt
    }
  }
`;
