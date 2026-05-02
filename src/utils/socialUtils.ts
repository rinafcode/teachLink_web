export interface Activity {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  action: string;
  targetId?: string;
  targetTitle?: string;
  createdAt: Date;
}

/** Format large numbers: 1200 → "1.2K", 1_500_000 → "1.5M" */
export function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/** Returns a human-readable relative time string: "2 hours ago", "just now", etc. */
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

/** Groups activities by calendar date label ("Today", "Yesterday", or "MMM D, YYYY"). */
export function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const label = (d: Date): string => {
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const key = label(new Date(activity.createdAt));
    (acc[key] ??= []).push(activity);
    return acc;
  }, {});
}
