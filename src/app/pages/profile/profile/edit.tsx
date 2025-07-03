import { Metadata } from 'next';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Edit Profile | TeachLink',
  description: 'Update your profile information and preferences',
};

export default function ProfileEditPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        <div className="max-w-2xl mx-auto">
          <ProfileEditForm />
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
} 