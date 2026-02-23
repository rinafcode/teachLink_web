'use client';

import { DownloadManager } from '../components/offline/DownloadManager';
import { OfflineStatusIndicator } from '../components/offline/OfflineStatusIndicator';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <OfflineStatusIndicator />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Learning Progress</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Web3 UX Design Principles</h3>
                  <p className="text-sm text-gray-500">68% complete • 12h remaining</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: '68%' }}
                    />
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">Smart Contract Security</h3>
                  <p className="text-sm text-gray-500">45% complete • 18h remaining</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: '45%' }}
                    />
                  </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-gray-900">Scaling DAPps on Starknet</h3>
                  <p className="text-sm text-gray-500">12% complete • 32h remaining</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: '12%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="font-medium text-blue-900">Continue Learning</div>
                  <div className="text-sm text-blue-700">Web3 UX Design Principles</div>
                </button>
                
                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="font-medium text-green-900">Download Course</div>
                  <div className="text-sm text-green-700">For offline access</div>
                </button>
                
                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <div className="font-medium text-purple-900">View Progress</div>
                  <div className="text-sm text-purple-700">Track your learning</div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed lesson</p>
                    <p className="text-xs text-gray-500">Web3 UX Design • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Downloaded course</p>
                    <p className="text-xs text-gray-500">Smart Contracts • 1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DownloadManager />
    </div>
  );
}