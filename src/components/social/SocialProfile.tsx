'use client';

import { useState } from 'react';
import { UserCircle } from 'lucide-react';
import { useFollowUser } from '@/hooks/useSocialFeatures';
import { formatFollowerCount } from '@/utils/socialUtils';

export interface SocialUser {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount: number;
}

interface SocialProfileProps {
  user: SocialUser;
  isOwnProfile?: boolean;
}

type Tab = 'posts' | 'activity' | 'analytics';

export default function SocialProfile({ user, isOwnProfile = false }: SocialProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const { isFollowing, follow, unfollow, loading } = useFollowUser(user.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'activity', label: 'Activity' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Profile header */}
      <div className="p-6 flex items-start gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <UserCircle className="w-16 h-16 text-gray-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{user.name}</h2>
            {!isOwnProfile && (
              <button
                onClick={isFollowing ? unfollow : follow}
                disabled={loading}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>

          {user.bio && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{user.bio}</p>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-gray-900 dark:text-white">
              <strong>{formatFollowerCount(user.followerCount)}</strong>{' '}
              <span className="text-gray-500 dark:text-gray-400">followers</span>
            </span>
            <span className="text-gray-900 dark:text-white">
              <strong>{formatFollowerCount(user.followingCount)}</strong>{' '}
              <span className="text-gray-500 dark:text-gray-400">following</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-t border-gray-200 dark:border-gray-700 flex">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content placeholder */}
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        {activeTab === 'posts' && <p>Posts will appear here.</p>}
        {activeTab === 'activity' && <p>Recent activity will appear here.</p>}
        {activeTab === 'analytics' && <p>Analytics will appear here.</p>}
      </div>
    </div>
  );
}
