'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Target, Calendar, TrendingUp, Plus } from 'lucide-react';
import type { GroupChallenge } from '@/app/hooks/useStudyGroups';

interface LearningChallengeBoardProps {
  challenges: GroupChallenge[];
  onCreate: (challenge: { title: string; description?: string; startDate: string; endDate: string; target: number }) => void;
  onUpdateProgress: (challengeId: string, progress: number) => void;
  getLeaderboard: (challengeId: string) => { userId: string; userName: string; progress: number }[];
}

export default function LearningChallengeBoard({ challenges, onCreate, onUpdateProgress, getLeaderboard }: LearningChallengeBoardProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState<number>(100);
  const [start, setStart] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [showCreateForm, setShowCreateForm] = useState(false);

  const activeChallenges = useMemo(
    () => challenges.filter(c => new Date(c.endDate) >= new Date()),
    [challenges]
  );

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({ 
      title: title.trim(), 
      description: description.trim() || undefined,
      startDate: start, 
      endDate: end, 
      target 
    });
    setTitle('');
    setDescription('');
    setTarget(100);
    setShowCreateForm(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={20} />;
    if (index === 1) return <Award className="text-gray-400" size={20} />;
    if (index === 2) return <Award className="text-amber-700" size={20} />;
    return <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Create Challenge Form */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create New Challenge
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-4">Create Challenge</h4>
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Challenge title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={start}
                onChange={(e) => setStart(e.target.value)}
                type="date"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                type="date"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                value={target}
                onChange={(e) => setTarget(Number(e.target.value) || 0)}
                type="number"
                min={1}
                placeholder="Target"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!title.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setTitle('');
                    setDescription('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Challenges */}
      <div className="space-y-4">
        {activeChallenges.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Trophy size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No active challenges. Create one above!</p>
          </div>
        ) : (
          activeChallenges.map((c) => {
            const lb = getLeaderboard(c.id);
            const sortedLeaderboard = [...lb].sort((a, b) => b.progress - a.progress);
            const maxProgress = Math.max(...sortedLeaderboard.map(p => p.progress), c.target);
            
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-50 font-semibold mb-1">
                      <Trophy size={20} className="text-yellow-500" />
                      {c.title}
                    </div>
                    {c.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{c.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={14} />
                        Target: {c.target}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Your %"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onChange={(e) => onUpdateProgress(c.id, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">Leaderboard</h5>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {sortedLeaderboard.length} participant{sortedLeaderboard.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sortedLeaderboard.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No progress yet. Be the first!
                      </div>
                    ) : (
                      sortedLeaderboard.slice(0, 5).map((p, i) => {
                        const percentage = maxProgress > 0 ? (p.progress / maxProgress) * 100 : 0;
                        return (
                          <motion.div
                            key={p.userId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getRankIcon(i)}
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 min-w-[120px]">
                                {p.userName}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.1 }}
                                  className={`h-2 rounded-full ${
                                    i === 0 ? 'bg-yellow-500' :
                                    i === 1 ? 'bg-gray-400' :
                                    i === 2 ? 'bg-amber-700' :
                                    'bg-purple-500'
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 min-w-[3rem] text-right">
                                {p.progress}%
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
