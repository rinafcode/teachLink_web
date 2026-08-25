import type { Metadata } from 'next';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import { profileUser } from './profile-data';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${profileUser.name} | TeachLink`,
    description: `View the profile of ${profileUser.name} on TeachLink.`,
    openGraph: {
      title: `${profileUser.name} | TeachLink`,
      description: `View the profile of ${profileUser.name} on TeachLink.`,
      images: profileUser.avatarUrl
        ? [
            {
              url: profileUser.avatarUrl,
              width: 800,
              height: 800,
              alt: profileUser.name,
            },
          ]
        : [],
    },
  };
}

export default function Profile() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ProfileHeader user={profileUser} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileTabs />
      </div>
    </main>
  );
}
