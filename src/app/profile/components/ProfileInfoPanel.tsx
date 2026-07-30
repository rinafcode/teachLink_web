'use client';

import { memo, useState, useEffect } from 'react';
import type { ProfileUser } from '../profile-data';
import { dailyLearningTimeOptions, learningGoalOptions } from '../profile-data';
import { useUserProfile } from '@/hooks/useUserProfile';

interface ProfileInfoPanelProps {
  initialUser?: ProfileUser;
}

function ProfileInfoPanel({ initialUser }: ProfileInfoPanelProps) {
  const { user, isLoading, updateProfile } = useUserProfile(initialUser);

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    learningGoal: user.learningGoal || 'monthly-course',
    dailyLearningTime: user.dailyLearningTime || '30-minutes',
    bio: user.bio,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        learningGoal: user.learningGoal || 'monthly-course',
        dailyLearningTime: user.dailyLearningTime || '30-minutes',
        bio: user.bio,
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  return (
    <section
      id="profile-panel"
      role="tabpanel"
      aria-labelledby="profile-tab"
      className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow transition-colors duration-200"
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Personal Information
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="profile-full-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              id="profile-full-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="profile-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="profile-learning-goal"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Learning Goal
            </label>
            <select
              id="profile-learning-goal"
              name="learningGoal"
              value={formData.learningGoal}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {learningGoalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="profile-daily-time"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Daily Learning Time
            </label>
            <select
              id="profile-daily-time"
              name="dailyLearningTime"
              value={formData.dailyLearningTime}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {dailyLearningTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="profile-bio"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Bio
          </label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default memo(ProfileInfoPanel);
