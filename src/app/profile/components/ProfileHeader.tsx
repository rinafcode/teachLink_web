import type { ProfileUser } from '../profile-data';

interface ProfileHeaderProps {
  user: ProfileUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <div className="flex items-center space-x-2" aria-label={`Signed in as ${user.name}`}>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-semibold text-white"
              aria-hidden="true"
            >
              {user.initials}
            </div>
            <span className="text-gray-700 dark:text-gray-300">{user.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
