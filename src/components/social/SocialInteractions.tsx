'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, UserCircle } from 'lucide-react';
import { useSocialInteractions } from '@/hooks/useSocialFeatures';
import { formatFollowerCount, getRelativeTime } from '@/utils/socialUtils';

interface SocialInteractionsProps {
  contentId: string;
  contentUrl?: string;
}

export default function SocialInteractions({ contentId, contentUrl }: SocialInteractionsProps) {
  const { likes, liked, comments, toggleLike, addComment, loading } =
    useSocialInteractions(contentId);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = contentUrl ?? window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await addComment(draft.trim());
    setDraft('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Action bar */}
      <div className="flex items-center gap-4">
        {/* Like */}
        <button
          onClick={toggleLike}
          disabled={loading}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
            liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{formatFollowerCount(likes)}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-label="Toggle comments"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{formatFollowerCount(comments.length)}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          aria-label="Copy link"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {/* Add comment */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              Post
            </button>
          </form>

          {/* Comment list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                {c.authorAvatar ? (
                  <img
                    src={c.authorAvatar}
                    alt={c.authorName}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <UserCircle className="w-7 h-7 text-gray-400 shrink-0" />
                )}
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{c.authorName}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{getRelativeTime(c.createdAt)}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-center text-gray-400 py-2">No comments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
