'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useState } from 'react';
import type { ProfileTabId } from '../profile-data';
import { profileTabs } from '../profile-data';
import ProfileInfoPanel from './ProfileInfoPanel';
import ProfilePanelSkeleton from './ProfilePanelSkeleton';

const SettingsPanel = dynamic(() => import('./SettingsPanel'), {
  loading: () => <ProfilePanelSkeleton label="settings" />,
});

const AchievementsPanel = dynamic(() => import('./AchievementsPanel'), {
  loading: () => <ProfilePanelSkeleton label="achievements" />,
});

const CustomerSupportPanel = dynamic(() => import('./CustomerSupportPanel'), {
  loading: () => <ProfilePanelSkeleton label="support" />,
});

interface ProfileTabButtonProps {
  tab: { id: ProfileTabId; label: string };
  isActive: boolean;
  onSelect: (tabId: ProfileTabId) => void;
}

const ProfileTabButton = memo(function ProfileTabButton({
  tab,
  isActive,
  onSelect,
}: ProfileTabButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(tab.id);
  }, [onSelect, tab.id]);

  return (
    <button
      id={`${tab.id}-tab`}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tab.id}-panel`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      className={`rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isActive ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {tab.label}
    </button>
  );
});

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('profile');

  const handleTabChange = useCallback((tabId: ProfileTabId) => {
    setActiveTab(tabId);
  }, []);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-3" role="tablist" aria-label="Profile sections">
        {profileTabs.map((tab) => (
          <ProfileTabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onSelect={handleTabChange}
          />
        ))}
      </div>

      {activeTab === 'profile' && <ProfileInfoPanel />}
      {activeTab === 'settings' && <SettingsPanel />}
      {activeTab === 'achievements' && <AchievementsPanel />}
      {activeTab === 'support' && <CustomerSupportPanel />}
    </>
  );
}
