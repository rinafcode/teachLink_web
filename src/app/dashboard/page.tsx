'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { CardSkeleton, ListSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Dashboard() {
  const { isLoading } = useDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <OfflineStatusIndicator />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Learning Progress</h2>

                <div className="space-y-8">
                  <div className="border-l-4 border-blue-500 pl-6 group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Web3 UX Design Principles</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">68% complete • 12h remaining</p>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '68%' }}
                      />
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6 group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">Smart Contract Security</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">45% complete • 18h remaining</p>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '45%' }}
                      />
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-6 group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">Scaling DAPps on Starknet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">12% complete • 32h remaining</p>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '12%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {isLoading ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
                <ListSkeleton count={4} />
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
                  <div className="space-y-4">
                    <button className="w-full text-left p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl transition-all group">
                      <div className="font-bold text-blue-900 dark:text-blue-300 group-hover:translate-x-1 transition-transform">Continue Learning</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400/80 mt-1">Web3 UX Design Principles</div>
                    </button>

                    <button className="w-full text-left p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-2xl transition-all group">
                      <div className="font-bold text-green-900 dark:text-green-300 group-hover:translate-x-1 transition-transform">Download Course</div>
                      <div className="text-sm text-green-700 dark:text-green-400/80 mt-1">For offline access</div>
                    </button>

                    <button className="w-full text-left p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-2xl transition-all group">
                      <div className="font-bold text-purple-900 dark:text-purple-300 group-hover:translate-x-1 transition-transform">View Progress</div>
                      <div className="text-sm text-purple-700 dark:text-purple-400/80 mt-1">Track your learning</div>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 group">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5 ring-4 ring-blue-50 dark:ring-blue-900/20" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Completed lesson</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Web3 UX Design • 2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 ring-4 ring-green-50 dark:ring-green-900/20" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Downloaded course</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Smart Contracts • 1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <DownloadManager />
    </div>
  );
}
