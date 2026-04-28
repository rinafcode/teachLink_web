/**
 * Example GraphQL Subscriptions
 * Common subscription queries for TeachLink real-time features
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
