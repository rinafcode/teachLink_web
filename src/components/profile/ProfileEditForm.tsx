'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProfileUpdate } from '../../hooks/useProfileUpdate';
import { User, Mail, FileText } from 'lucide-react';
import ImageUploader from '../shared/ImageUploader';
import PreferencesSection from './PreferencesSection';
import { FormInput } from '../forms/FormInput';
import { useStore } from '../../store/stateManager';

// Schema definition
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.any().optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
  theme: z.enum(['light', 'dark']),
  prefetching: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEditForm() {
  const { updateProfile, isLoading } = useProfileUpdate();
  const user = useStore((state) => state.user);
  const setPreferences = useStore((state) => state.setPreferences);
  const setUser = useStore((state) => state.setUser);

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || 'John Doe',
      email: user.id ? 'user@example.com' : 'john@example.com', // Placeholder if no user
      bio: 'Lifelong learner and enthusiast.',
      notifications: {
        email: user.preferences.notifications,
        push: false,
      },
      theme: user.preferences.theme,
      prefetching: user.preferences.prefetching,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
  } = methods;

  const onSubmit = async (data: ProfileFormData) => {
    const success = await updateProfile(data);
    if (success) {
      setUser({ name: data.name });
      setPreferences({
        theme: data.theme,
        notifications: data.notifications.email,
        prefetching: data.prefetching,
      });
    }
  };

  const handleImageSelect = (file: File) => {
    setValue('avatar', file);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Review & Avatar */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="shrink-0 mx-auto sm:mx-0">
              <ImageUploader
                onImageSelect={handleImageSelect}
                initialImageUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              />
              {errors.avatar && (
                <p className="text-red-500 text-sm mt-1 text-center">Image error</p>
              )}
            </div>

            <div className="grow space-y-6 w-full">
              <FormInput
                name="name"
                label="Full Name"
                icon={User}
                placeholder="Your Name"
              />

              <FormInput
                name="email"
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="you@company.com"
              />

              <FormInput
                name="bio"
                label="Bio"
                icon={FileText}
                as="textarea"
                rows={4}
                placeholder="Tell us a little about yourself..."
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: Preferences */}
          <PreferencesSection />

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium mr-4 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-2 rounded-lg text-white font-medium transition-all shadow-md ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
