import { getDateTimeFormat } from './intlCache';

export interface Topic { slug: string; name: string; description?: string; postCount: number; followerCount: number; isFollowing?: boolean; }
export interface TopicPost { id: string; authorId: string; authorName: string; authorAvatar?: string; title: string; body: string; topicSlug: string; likes: number; commentCount: number; createdAt: Date; tags?: string[]; }
export interface Activity { id: string; actorId: string; actorName: string; actorAvatar?: string; action: string; targetId?: string; targetTitle?: string; createdAt: Date; }

export function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dateFormatter = getDateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const label = (date: Date): string => {
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return dateFormatter.format(date);
  };
  return activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const key = label(new Date(activity.createdAt));
    (acc[key] ??= []).push(activity);
    return acc;
  }, {});
}
