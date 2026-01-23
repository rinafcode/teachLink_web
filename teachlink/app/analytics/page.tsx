"use client"

import React, { useState } from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { UserRole } from '@/types/analytics';

const AnalyticsPage: React.FC = () => {
  // In a real app, this would come from auth context
  const [userRole, setUserRole] = useState<UserRole>('student');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">TeachLink Analytics</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Current role: 
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="ml-2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
            <p className="opacity-90">
              Gain insights into your learning progress, course performance, and platform engagement.
              {userRole === 'student' && ' Track your personal learning journey.'}
              {userRole === 'teacher' && ' Monitor class performance and student progress.'}
              {userRole === 'admin' && ' View platform-wide metrics and usage patterns.'}
              {userRole === 'parent' && ' Follow your child\'s educational progress.'}
            </p>
          </div>
        </div>

        <AnalyticsDashboard role={userRole} />
      </main>

     
    </div>
  );
};

export default AnalyticsPage;