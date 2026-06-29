'use client';

import { memo } from 'react';
import { dailyLearningTimeOptions, learningGoalOptions, profileUser } from '../profile-data';

function ProfileInfoPanel() {
  return (
    <section
      id="profile-panel"
      role="tabpanel"
      aria-labelledby="profile-tab"
      className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow transition-colors duration-200"
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Personal Information</h2>

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
            type="text"
            defaultValue={profileUser.name}
            autoComplete="name"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            defaultValue={profileUser.email}
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
            defaultValue="monthly-course"
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
            defaultValue="30-minutes"
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
        <label htmlFor="profile-bio" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bio
        </label>
        <textarea
          id="profile-bio"
          rows={4}
          defaultValue={profileUser.bio}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
        />
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}

export default memo(ProfileInfoPanel);
