'use client';

import React, { useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import StudyGroupCard from '@/app/components/social/StudyGroupCard';
import GroupDiscussionThread from '@/app/components/social/GroupDiscussionThread';
import SharedResourceLibrary from '@/app/components/social/SharedResourceLibrary';
import LearningChallengeBoard from '@/app/components/social/LearningChallengeBoard';
import { useStudyGroups } from '@/app/hooks/useStudyGroups';
import NotificationBell from '@/app/components/notifications/NotificationBell';

export default function StudyGroupsPage() {
  const sg = useStudyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selected = useMemo(() => sg.groups.find((g) => g.id === selectedGroupId) || null, [sg.groups, selectedGroupId]);
  const [tab, setTab] = useState<'discussion' | 'resources' | 'challenges'>('discussion');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <NotificationBell />
        </div>

        {/* Create group */}
        <CreateGroupForm onCreate={(name, description) => {
          const g = sg.createGroup({ name, description });
          setSelectedGroupId(g.id);
        }} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-1 space-y-3">
            {sg.groups.map((g) => (
              <StudyGroupCard
                key={g.id}
                group={g}
                challenges={sg.groupChallenges(g.id)}
                isMember={!!g.members.find((m) => m.id === sg.currentUser.id)}
                onJoin={() => sg.joinGroup(g.id)}
                onLeave={() => sg.leaveGroup(g.id)}
                onOpen={() => { setSelectedGroupId(g.id); }}
              />
            ))}
            {sg.groups.length === 0 && (
              <div className="text-sm text-gray-500">No groups yet. Create one above.</div>
            )}
          </div>

          <div className="md:col-span-2">
            {!selected && (
              <div className="text-sm text-gray-500">Select a group to view details.</div>
            )}
            {selected && (
              <div className="bg-white border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
                    {selected.description && <div className="text-sm text-gray-600">{selected.description}</div>}
                  </div>
                </div>
                <div className="mt-4 border-b">
                  <nav className="-mb-px flex gap-4">
                    <TabButton active={tab === 'discussion'} onClick={() => setTab('discussion')}>Discussion</TabButton>
                    <TabButton active={tab === 'resources'} onClick={() => setTab('resources')}>Resources</TabButton>
                    <TabButton active={tab === 'challenges'} onClick={() => setTab('challenges')}>Challenges</TabButton>
                  </nav>
                </div>

                <div className="mt-4">
                  {tab === 'discussion' && (
                    <GroupDiscussionThread
                      messages={sg.groupMessages(selected.id)}
                      onPost={(html, files) => sg.postMessage(selected.id, html, files)}
                    />
                  )}
                  {tab === 'resources' && (
                    <SharedResourceLibrary
                      resources={sg.groupResources(selected.id)}
                      onAdd={(r) => sg.addResource(selected.id, r)}
                    />
                  )}
                  {tab === 'challenges' && (
                    <LearningChallengeBoard
                      challenges={sg.groupChallenges(selected.id)}
                      onCreate={(c) => sg.createChallenge(selected.id, c)}
                      onUpdateProgress={(id, p) => sg.updateChallengeProgress(id, p)}
                      getLeaderboard={(id) => sg.challengeLeaderboard(id)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function CreateGroupForm({ onCreate }: { onCreate: (name: string, description?: string) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <div className="bg-white border rounded-md p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="px-3 py-2 border rounded-md" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="px-3 py-2 border rounded-md" />
        <button
          onClick={() => { if (!name.trim()) return; onCreate(name.trim(), desc.trim() || undefined); setName(''); setDesc(''); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
        >
          Create Group
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm border-b-2 ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200'}`}
    >
      {children}
    </button>
  );
}
