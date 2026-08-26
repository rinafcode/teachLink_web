'use client';

import { useState, useCallback } from 'react';
import { Trophy, Medal, Crown, Users, Plus, Trash2, Video, ShieldAlert, Lock } from 'lucide-react';
import { VideoConference } from '@/components/collaboration/VideoConference';
import { fraudDetectionService, FraudDetectionService } from '@/services/fraud-detection';
import type { ConferenceAccessCheck } from '@/services/fraud-detection';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
}

export interface Conference {
  id: string;
  name: string;
  roomId: string;
  participants: number;
  hostUserId?: string;
  locked?: boolean;
}

interface LeaderboardConferenceProps {
  entries?: LeaderboardEntry[];
  conferences?: Conference[];
  currentUserId?: string;
  currentUserName?: string;
  fraudService?: FraudDetectionService;
}

const RANK_ICONS = [
  <Crown key="1" size={18} className="text-yellow-500" />,
  <Medal key="2" size={18} className="text-slate-400" />,
  <Medal key="3" size={18} className="text-amber-600" />,
];

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { id: '1', name: 'Alice Chen', score: 4820, rank: 1 },
  { id: '2', name: 'Bob Okafor', score: 4310, rank: 2 },
  { id: '3', name: 'Clara Diaz', score: 3990, rank: 3 },
  { id: '4', name: 'David Kim', score: 3450, rank: 4 },
  { id: '5', name: 'Eva Müller', score: 2980, rank: 5 },
];

export function LeaderboardConference({
  entries = MOCK_ENTRIES,
  conferences: initialConferences = [],
  currentUserId = 'guest',
  currentUserName = 'Guest',
  fraudService = fraudDetectionService,
}: LeaderboardConferenceProps) {
  const [conferences, setConferences] = useState<Conference[]>(initialConferences);
  const [activeConference, setActiveConference] = useState<Conference | null>(null);
  const [newConferenceName, setNewConferenceName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const sorted = [...entries].sort((a, b) => a.rank - b.rank);

  const handleCreateConference = () => {
    const name = newConferenceName.trim();
    if (!name) return;
    const conf: Conference = {
      id: crypto.randomUUID(),
      name,
      roomId: `room-${Date.now()}`,
      participants: 0,
      hostUserId: currentUserId,
      locked: false,
    };
    setConferences((prev) => [...prev, conf]);
    setNewConferenceName('');
    setShowCreateForm(false);
  };

  const handleDeleteConference = (id: string) => {
    if (activeConference?.id === id) {
      setActiveConference(null);
    }
    setConferences((prev) => prev.filter((c) => c.id !== id));
  };

  const handleJoinConference = useCallback(
    (conf: Conference) => {
      setAccessError(null);

      if (conf.locked) {
        setAccessError('This conference is locked by the host.');
        return;
      }

      const accessCheck: ConferenceAccessCheck = fraudService.checkConferenceAccess(
        currentUserId,
        conf.roomId,
        conf.hostUserId === currentUserId,
        conf.hostUserId,
      );

      if (!accessCheck.allowed) {
        setAccessError(accessCheck.reason || 'Access denied by fraud detection.');
        return;
      }

      if (accessCheck.requiresVerification) {
        setAccessError(accessCheck.reason || 'Access granted with monitoring.');
      }

      setActiveConference(activeConference?.id === conf.id ? null : conf);
    },
    [activeConference, currentUserId, fraudService],
  );

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <section
        className="rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90"
        aria-label="Leaderboard"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-yellow-500" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Leaderboard</h2>
        </div>

        <ol className="space-y-2" aria-label="Top participants">
          {sorted.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
            >
              <span className="w-6 flex justify-center" aria-label={`Rank ${entry.rank}`}>
                {entry.rank <= 3 ? (
                  RANK_ICONS[entry.rank - 1]
                ) : (
                  <span className="text-sm font-semibold text-slate-500">{entry.rank}</span>
                )}
              </span>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-sm font-bold text-blue-700 dark:text-blue-300">
                {entry.name.charAt(0)}
              </div>

              <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {entry.name}
              </span>

              <span
                className="text-sm font-semibold text-blue-600 dark:text-blue-400"
                aria-label={`${entry.score} points`}
              >
                {entry.score.toLocaleString()} pts
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Conference Management */}
      <section
        className="rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90"
        aria-label="Conference management"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Conferences
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            aria-expanded={showCreateForm}
          >
            <Plus size={15} aria-hidden="true" />
            New
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newConferenceName}
              onChange={(e) => setNewConferenceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateConference()}
              placeholder="Conference name"
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Conference name"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateConference}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Create
            </button>
          </div>
        )}

        {accessError && (
          <div
            className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400"
            role="alert"
          >
            <ShieldAlert size={14} aria-hidden="true" />
            {accessError}
            <button
              type="button"
              onClick={() => setAccessError(null)}
              className="ml-auto rounded-lg px-2 py-1 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Dismiss
            </button>
          </div>
        )}

        {conferences.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No conferences yet. Create one to get started.
          </p>
        ) : (
          <ul className="space-y-2" aria-label="Conference list">
            {conferences.map((conf) => (
              <li
                key={conf.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
              >
                {conf.locked ? (
                  <Lock size={16} className="text-red-400 shrink-0" aria-hidden="true" />
                ) : (
                  <Video size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
                )}
                <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {conf.name}
                  {conf.hostUserId === currentUserId && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      Host
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleJoinConference(conf)}
                  className={`rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeConference?.id === conf.id
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400'
                  }`}
                  aria-pressed={activeConference?.id === conf.id}
                >
                  {activeConference?.id === conf.id ? 'Leave' : 'Join'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConference(conf.id)}
                  className="rounded-2xl p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  aria-label={`Delete conference ${conf.name}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active Video Conference */}
      {activeConference && (
        <VideoConference
          roomId={activeConference.roomId}
          user={{
            id: currentUserId,
            name: currentUserName,
            avatar: '',
            color: '#3b82f6',
            isHost: activeConference.hostUserId === currentUserId,
          }}
          fraudService={fraudService}
          isHost={activeConference.hostUserId === currentUserId}
          hostUserId={activeConference.hostUserId}
        />
      )}
    </div>
  );
}
