import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import { profileUser } from './profile-data';

export default function Profile() {
  return (
    <main className="min-h-screen bg-gray-50">
      <ProfileHeader user={profileUser} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileTabs />
      </div>
    </main>
  );
}
