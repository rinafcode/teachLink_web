'use client';

import React, { useMemo, useState } from 'react';
import { Trophy, Award } from 'lucide-react';
import type { GroupChallenge } from '@/app/hooks/useStudyGroups';

interface LearningChallengeBoardProps {
  challenges: GroupChallenge[];
  onCreate: (challenge: { title: string; description?: string; startDate: string; endDate: string; target: number }) => void;
  onUpdateProgress: (challengeId: string, progress: number) => void;
  getLeaderboard: (challengeId: string) => { userId: string; userName: string; progress: number }[];
}

export default function LearningChallengeBoard({ challenges, onCreate, onUpdateProgress, getLeaderboard }: LearningChallengeBoardProps) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<number>(100);
  const [start, setStart] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [end, setEnd] = useState<string>(() => new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10));

  const activeChallenges = useMemo(
    () => challenges.filter(c => new Date(c.endDate) >= new Date()),
    [challenges]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Create Challenge</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-md" />
          <input value={start} onChange={(e) => setStart(e.target.value)} type="date" className="px-3 py-2 border rounded-md" />
          <input value={end} onChange={(e) => setEnd(e.target.value)} type="date" className="px-3 py-2 border rounded-md" />
          <input value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} type="number" className="px-3 py-2 border rounded-md" placeholder="Target" />
          <button
            onClick={() => {
              if (!title.trim()) return;
              onCreate({ title: title.trim(), startDate: start, endDate: end, target, description: '' });
              setTitle('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Create
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activeChallenges.map((c) => {
          const lb = getLeaderboard(c.id).slice(0, 5);
          return (
            <div key={c.id} className="bg-white border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold"><Trophy size={18} /> {c.title}</div>
                  <div className="text-xs text-gray-500">{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()} • Target {c.target}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Your %"
                    className="px-2 py-1 border rounded-md w-24"
                    onChange={(e) => onUpdateProgress(c.id, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-800 mb-1">Leaderboard</div>
                <div className="space-y-1">
                  {lb.length === 0 && <div className="text-sm text-gray-500">No progress yet.</div>}
                  {lb.map((p, i) => (
                    <div key={p.userId} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <div className="flex items-center gap-2">
                        <Award size={16} className={i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'} />
                        <span className="text-sm text-gray-800">{i + 1}. {p.userName}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{p.progress}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {activeChallenges.length === 0 && (
          <div className="text-sm text-gray-500">No active challenges. Create one above!</div>
        )}
      </div>
    </div>
  );
}
