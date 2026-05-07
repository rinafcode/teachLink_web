'use client';

import { useState } from 'react';
import { formatVideoTime } from '@/utils/videoPlayerUtils';
import { useCollaborativeAnnotations } from '@/hooks/useCollaborativeAnnotations';

type CollaborativeAnnotationsProps = {
  videoId: string;
  userId: string;
  userName: string;
  currentTime: number;
  onSeek: (time: number) => void;
};

export function CollaborativeAnnotations({
  videoId,
  userId,
  userName,
  currentTime,
  onSeek,
}: CollaborativeAnnotationsProps) {
  const [text, setText] = useState('');
  const { annotations, addAnnotation } = useCollaborativeAnnotations({ videoId, userId, userName });

  const handleAdd = () => {
    addAnnotation(text, currentTime);
    setText('');
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Collaborative annotations</h3>
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={`Add annotation at ${formatVideoTime(currentTime)}`}
          className="h-20 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Share annotation
        </button>
      </div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {annotations.map((annotation) => (
          <button
            key={annotation.id}
            type="button"
            onClick={() => onSeek(annotation.time)}
            className="w-full rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700">{annotation.authorName}</span>
              <span className="text-xs text-slate-500">{formatVideoTime(annotation.time)}</span>
            </div>
            <p className="text-sm text-slate-700">{annotation.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
