'use client';

import { useState } from 'react';
import { ConnectionStatusIndicator, ConnectionStatusBanner } from '@/components/subscription/SubscriptionUI';
import { useSubscriptionConnection } from '@/hooks/useSubscription';
import { ConnectionState } from '@/lib/graphql/subscriptions';
import { RefreshCw } from 'lucide-react';

/**
 * Subscriptions Demo Page
 * Showcases GraphQL subscription features and real-time capabilities
 */
export default function SubscriptionsDemoPage() {
  const connectionState = useSubscriptionConnection();
  const [selectedExample, setSelectedExample] = useState<'posts' | 'notifications' | 'tips'>('posts');
  
  const examples = [
    {
      id: 'posts' as const,
      title: '📝 New Posts',
      description: 'Real-time updates when new posts are published',
      features: [
        'Subscribe to new posts in topic',
        'Live feed updates',
        'Author information',
        'Automatic reconnection',
      ],
      code: `const { data, loading, error } = useSubscription(
  NEW_POSTS_SUBSCRIPTION,
  { variables: { topicId: 'web3' } }
);

return (
  <div>
    {loading && <Skeleton />}
    {error && <ErrorAlert error={error} />}
    {data?.onNewPost && (
      <PostCard post={data.onNewPost} />
    )}
  </div>
);`,
    },
    {
      id: 'notifications' as const,
      title: '🔔 Notifications',
      description: 'Real-time user notifications',
      features: [
        'Like and comment notifications',
        'Tip notifications',
        'Message notifications',
        'Playable sounds and badges',
      ],
      code: `const { data, errorMessage, resubscribe } = useSubscription(
  USER_NOTIFICATIONS_SUBSCRIPTION,
  {
    variables: { userId: 'user-123' },
    onData: (notification) => {
      playNotificationSound();
      showBadge();
    },
  }
);

if (errorMessage) {
  return <button onClick={resubscribe}>Retry</button>;
}

return <NotificationList notifications={data} />;`,
    },
    {
      id: 'tips' as const,
      title: '💰 Tips & Rewards',
      description: 'Real-time tipping and reputation updates',
      features: [
        'Instant tip notifications',
        'Reputation score changes',
        'Badge achievements',
        'Transaction status',
      ],
      code: `const { data } = useSubscription(
  TIPPING_UPDATES_SUBSCRIPTION,
  { variables: { recipientId: 'user-123' } }
);

const { data: reputationData } = useSubscription(
  REPUTATION_UPDATES_SUBSCRIPTION,
  { variables: { userId: 'user-123' } }
);

return (
  <div>
    <TipsWidget tips={data} />
    <ReputationBar reputation={reputationData} />
  </div>
);`,
    },
  ];

  const currentExample = examples.find(e => e.id === selectedExample)!;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Connection Banner */}
      <ConnectionStatusBanner 
        position="top"
        showOnSuccess={false}
      />

      <div className="max-w-7xl mx-auto pt-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            GraphQL Subscriptions Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Real-time data updates for TeachLink platform
          </p>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Connection Status
            </h3>
            <div className="flex items-center gap-3">
              <ConnectionStatusIndicator size="lg" showLabel={false} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {connectionState === ConnectionState.CONNECTED && '✓ Connected'}
                  {connectionState === ConnectionState.CONNECTING && '⟳ Connecting...'}
                  {connectionState === ConnectionState.RECONNECTING && '⟳ Reconnecting...'}
                  {connectionState === ConnectionState.DISCONNECTED && '✗ Disconnected'}
                  {connectionState === ConnectionState.ERROR && '⚠ Error'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time subscription active
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ WebSocket-based</li>
              <li>✓ Auto-reconnect</li>
              <li>✓ Error recovery</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Update Frequency
            </h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              Real-time
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Zero polling, instant updates
            </p>
          </div>
        </div>

        {/* Examples */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Example Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Examples
              </h2>

              <div className="space-y-2">
                {examples.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => setSelectedExample(example.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedExample === example.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {example.title}
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedExample === example.id
                        ? 'text-indigo-100'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {example.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">
                  💡 Tip
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Connect to your GraphQL API endpoint to see real-time updates. All subscriptions are automatically managed and reconnected on failure.
                </p>
              </div>
            </div>
          </div>

          {/* Example Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {currentExample.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {currentExample.description}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                  Implementation highlights:
                </h3>
                <ul className="grid grid-cols-2 gap-2">
                  {currentExample.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-indigo-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code Example */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  Code Example:
                </h3>
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  {currentExample.code}
                </pre>
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                  <RefreshCw size={16} />
                  Test Subscription
                </button>
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  View Full Guide
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Quick Setup
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mb-3">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Install Dependencies
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                npm install
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mb-3">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Set Environment
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                NEXT_PUBLIC_GRAPHQL_WS_URL=<br/>wss://api.teachlink.com/graphql
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mb-3">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Wrap with Provider
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                &lt;SubscriptionProvider&gt;
              </pre>
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            For detailed documentation, see <span className="font-mono text-sm">GRAPHQL_SUBSCRIPTIONS_GUIDE.md</span>
          </p>
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
            View Full Documentation
          </button>
        </div>
      </div>
    </main>
  );
}
