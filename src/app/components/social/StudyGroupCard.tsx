'use client';

import React from 'react';
import { Users, Calendar, Trophy } from 'lucide-react';
import type { StudyGroup, GroupChallenge } from '@/app/hooks/useStudyGroups';

interface StudyGroupCardProps {
  group: StudyGroup;
  challenges?: GroupChallenge[];
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onOpen: () => void;
}

export default function StudyGroupCard({ group, challenges = [], isMember, onJoin, onLeave, onOpen }: StudyGroupCardProps) {
  const memberCount = group.members.length;
  const upcoming = challenges
    .filter((c) => new Date(c.endDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {group.coverImage ? (
        <div className="h-24 w-full bg-gray-100" style={{ backgroundImage: `url(${group.coverImage})`, backgroundSize: 'cover' }} />
      ) : (
        <div className="h-2 w-full bg-gradient-to-r from-blue-500/30 to-purple-500/30" />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
            )}
          </div>
          <button
            onClick={onOpen}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            Open
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users size={16} /> {memberCount} members
          </div>
          {upcoming && (
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span className="truncate max-w-[180px]" title={upcoming.title}>{upcoming.title}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Trophy size={16} /> {challenges.length} challenges
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMember ? (
            <button
              onClick={onLeave}
              className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Leave
            </button>
          ) : (
            <button
              onClick={onJoin}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
