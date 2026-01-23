'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Search, Plus, X, Users } from 'lucide-react';
import StudyGroupCard from '@/app/components/social/StudyGroupCard';
import GroupDiscussionThread from '@/app/components/social/GroupDiscussionThread';
import SharedResourceLibrary from '@/app/components/social/SharedResourceLibrary';
import LearningChallengeBoard from '@/app/components/social/LearningChallengeBoard';
import { useStudyGroups } from '@/app/hooks/useStudyGroups';
import NotificationBell from '@/app/components/notifications/NotificationBell';

export default function StudyGroupsPage() {
  const sg = useStudyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const selected = useMemo(() => sg.groups.find((g) => g.id === selectedGroupId) || null, [sg.groups, selectedGroupId]);
  const [tab, setTab] = useState<'discussion' | 'resources' | 'challenges'>('discussion');

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return sg.groups;
    const query = searchQuery.toLowerCase();
    return sg.groups.filter(g => 
      g.name.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query)
    );
  }, [sg.groups, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Study Groups</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Collaborate, share resources, and learn together
            </p>
          </div>
          <NotificationBell />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Create group form */}
        <AnimatePresence>
          {showCreateForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <CreateGroupForm
                onCreate={(name, description) => {
                  const g = sg.createGroup({ name, description });
                  setSelectedGroupId(g.id);
                  setShowCreateForm(false);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowCreateForm(true)}
              className="mb-6 w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Create New Group
            </motion.button>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Groups ({filteredGroups.length})
              </h2>
            </div>
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Users size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">
                  {searchQuery ? 'No groups match your search.' : 'No groups yet. Create one above!'}
                </p>
              </div>
            ) : (
              filteredGroups.map((g) => (
                <StudyGroupCard
                  key={g.id}
                  group={g}
                  challenges={sg.groupChallenges(g.id)}
                  isMember={!!g.members.find((m) => m.id === sg.currentUser.id)}
                  onJoin={() => sg.joinGroup(g.id)}
                  onLeave={() => sg.leaveGroup(g.id)}
                  onOpen={() => { setSelectedGroupId(g.id); }}
                />
              ))
            )}
          </div>

          {/* Group Details */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <Users size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">
                  Select a group to view details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a group from the list to see discussions, resources, and challenges
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-1">
                        {selected.name}
                      </h2>
                      {selected.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {selected.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{selected.members.length} {selected.members.length === 1 ? 'member' : 'members'}</span>
                        <span>•</span>
                        <span>{sg.groupChallenges(selected.id).length} challenges</span>
                        <span>•</span>
                        <span>{sg.groupMessages(selected.id).length} messages</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex gap-1 px-6">
                    {[
                      { id: 'discussion', label: 'Discussion' },
                      { id: 'resources', label: 'Resources' },
                      { id: 'challenges', label: 'Challenges' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id as typeof tab)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                          tab === t.id
                            ? 'border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {tab === 'discussion' && (
                      <motion.div
                        key="discussion"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <GroupDiscussionThread
                          messages={sg.groupMessages(selected.id)}
                          onPost={(html, files) => sg.postMessage(selected.id, html, files)}
                        />
                      </motion.div>
                    )}
                    {tab === 'resources' && (
                      <motion.div
                        key="resources"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <SharedResourceLibrary
                          resources={sg.groupResources(selected.id)}
                          onAdd={(r) => sg.addResource(selected.id, r)}
                        />
                      </motion.div>
                    )}
                    {tab === 'challenges' && (
                      <motion.div
                        key="challenges"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <LearningChallengeBoard
                          challenges={sg.groupChallenges(selected.id)}
                          onCreate={(c) => sg.createChallenge(selected.id, c)}
                          onUpdateProgress={(id, p) => sg.updateChallengeProgress(id, p)}
                          getLeaderboard={(id) => sg.challengeLeaderboard(id)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function CreateGroupForm({ 
  onCreate, 
  onCancel 
}: { 
  onCreate: (name: string, description?: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 dark:text-gray-50 mb-4">Create New Study Group</h3>
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onCreate(name.trim(), desc.trim() || undefined);
              setName('');
              setDesc('');
            }}
            disabled={!name.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
