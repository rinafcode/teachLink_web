'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { VideoBookmark } from '@/components/video/types';
import { formatVideoTime, getVideoStorageKey } from '@/utils/videoPlayerUtils';

type BookmarkSystemProps = {
  videoId: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onCreateThumbnail: (time: number) => Promise<string | null>;
};

export function BookmarkSystem({
  videoId,
  currentTime,
  onSeek,
  onCreateThumbnail,
}: BookmarkSystemProps) {
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const storageKey = useMemo(() => getVideoStorageKey(videoId, 'bookmarks'), [videoId]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setBookmarks([]);
      return;
    }
    try {
      setBookmarks(JSON.parse(raw) as VideoBookmark[]);
    } catch {
      setBookmarks([]);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(bookmarks));
  }, [bookmarks, storageKey]);

  const addBookmark = async () => {
    const bookmarkTitle = title.trim() || `Bookmark ${bookmarks.length + 1}`;
    const thumbnail = await onCreateThumbnail(currentTime);
    const bookmark: VideoBookmark = {
      id: crypto.randomUUID(),
      title: bookmarkTitle,
      note: note.trim(),
      time: currentTime,
      thumbnail,
      createdAt: new Date().toISOString(),
    };
    setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.time - b.time));
    setTitle('');
    setNote('');
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Bookmarks</h3>
      <div className="space-y-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Bookmark title"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
          className="h-20 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => void addBookmark()}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add bookmark at {formatVideoTime(currentTime)}
        </button>
      </div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {bookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            onClick={() => onSeek(bookmark.time)}
            className="flex w-full items-start gap-3 rounded-md border border-slate-200 p-2 text-left hover:bg-slate-50"
          >
            {bookmark.thumbnail ? (
              <Image
                src={bookmark.thumbnail}
                alt={bookmark.title}
                width={80}
                height={48}
                className="h-12 w-20 rounded object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-12 w-20 rounded bg-slate-200" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{bookmark.title}</p>
              <p className="text-xs text-slate-600">{formatVideoTime(bookmark.time)}</p>
              {bookmark.note ? (
                <p className="line-clamp-2 text-xs text-slate-500">{bookmark.note}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
