'use client';

import { useMemo } from 'react';
import type { TranscriptCue } from '@/components/video/types';
import { formatVideoTime, getActiveCueId } from '@/utils/videoPlayerUtils';

type InteractiveTranscriptProps = {
  cues: TranscriptCue[];
  currentTime: number;
  onSeek: (time: number) => void;
};

export function InteractiveTranscript({ cues, currentTime, onSeek }: InteractiveTranscriptProps) {
  const activeCueId = useMemo(() => getActiveCueId(cues, currentTime), [cues, currentTime]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Transcript</h3>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {cues.map((cue) => {
          const isActive = cue.id === activeCueId;
          return (
            <button
              key={cue.id}
              type="button"
              onClick={() => onSeek(cue.start)}
              className={`w-full rounded-md px-3 py-2 text-left transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="mr-2 text-xs font-semibold">{formatVideoTime(cue.start)}</span>
              <span className="text-sm">{cue.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
