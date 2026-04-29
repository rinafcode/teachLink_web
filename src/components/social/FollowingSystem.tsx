'use client';

import { useState, useEffect } from 'react';
import { Search, UserCircle } from 'lucide-react';
import { useFollowUser } from '@/hooks/useSocialFeatures';
import { apiClient } from '@/lib/api';
import type { SocialUser } from './SocialProfile';

interface FollowingSystemProps {
  userId: string;
}

type ListTab = 'followers' | 'following';

function UserRow({ user }: { user: SocialUser }) {
  const { isFollowing, follow, unfollow, loading } = useFollowUser(user.id);
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <UserCircle className="w-9 h-9 text-gray-400" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
          {user.bio && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {user.bio}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={isFollowing ? unfollow : follow}
        disabled={loading}
        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          isFollowing
            ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  );
}

export default function FollowingSystem({ userId }: FollowingSystemProps) {
  const [tab, setTab] = useState<ListTab>('followers');
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<SocialUser[]>(`/api/social/${tab}/${userId}`)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [tab, userId]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['followers', 'following'] as ListTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 px-4">
        {loading && (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No users found.</p>
        )}
        {!loading && filtered.map((u) => <UserRow key={u.id} user={u} />)}
      </div>
    </div>
  );
}
