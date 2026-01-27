"use client";

import { useFormContext } from "react-hook-form";

export default function PreferencesSection() {
  const { register, watch } = useFormContext();

  const currentTheme = watch("theme");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
          Notifications
        </h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("notifications.email")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Email Notifications</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("notifications.push")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Push Notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
          Display Settings
        </h3>
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Theme Preference
            </span>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="light"
                  {...register("theme")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Light</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="dark"
                  {...register("theme")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Dark</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
