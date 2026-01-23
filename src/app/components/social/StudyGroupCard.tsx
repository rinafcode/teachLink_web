'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, UserPlus, LogOut } from 'lucide-react';
import type { StudyGroup, GroupChallenge } from '@/app/hooks/useStudyGroups';

interface StudyGroupCardProps {
  group: StudyGroup;
  challenges?: GroupChallenge[];
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onOpen: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function StudyGroupCard({ group, challenges = [], isMember, onJoin, onLeave, onOpen }: StudyGroupCardProps) {
  const memberCount = group.members.length;
  const upcoming = challenges
    .filter((c) => new Date(c.endDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const displayedMembers = group.members.slice(0, 3);
  const remainingMembers = Math.max(0, memberCount - 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      {group.coverImage ? (
        <div 
          className="h-24 w-full bg-gray-100 dark:bg-gray-700" 
          style={{ backgroundImage: `url(${group.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
      ) : (
        <div className="h-2 w-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30" />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 truncate">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{group.description}</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="ml-2 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex-shrink-0"
          >
            Open
          </button>
        </div>

        {/* Member Avatars */}
        {displayedMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {displayedMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400"
                  title={member.name}
                  style={{ zIndex: displayedMembers.length - index }}
                >
                  {getInitials(member.name)}
                </div>
              ))}
            </div>
            {remainingMembers > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{remainingMembers} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-purple-600 dark:text-purple-400" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>
          {upcoming && (
            <div className="flex items-center gap-1.5" title={upcoming.title}>
              <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="truncate max-w-[120px]">{upcoming.title}</span>
            </div>
          )}
          {challenges.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Trophy size={16} className="text-yellow-600 dark:text-yellow-400" />
              <span>{challenges.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {isMember ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeave();
              }}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Leave
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Join
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
