'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  Trash2, 
  Wifi, 
  WifiOff,
  HardDrive,
  Clock
} from 'lucide-react';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface DownloadItem {
  id: string;
  courseId: string;
  title: string;
  size: number;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
  startTime?: Date;
  estimatedTime?: number;
}

interface DownloadManagerProps {
  className?: string;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({ className = '' }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const { 
    isOnline, 
    isOfflineModeEnabled, 
    storageUsage,
    enableOfflineMode 
  } = useOfflineModeContext();

  // Sample course data for demonstration
  const sampleCourses = [
    {
      id: 'course-1',
      title: 'React Fundamentals',
      size: 250 * 1024 * 1024, // 250MB
      description: 'Learn the basics of React development'
    },
    {
      id: 'course-2', 
      title: 'Advanced JavaScript',
      size: 180 * 1024 * 1024, // 180MB
      description: 'Master advanced JavaScript concepts'
    },
    {
      id: 'course-3',
      title: 'Node.js Backend Development',
      size: 320 * 1024 * 1024, // 320MB
      description: 'Build scalable backend applications'
    }
  ];

  const addToDownloadQueue = useCallback(async (course: any) => {
    if (!isOfflineModeEnabled) {
      await enableOfflineMode();
    }

    const downloadItem: DownloadItem = {
      id: `download-${Date.now()}-${Math.random()}`,
      courseId: course.id,
      title: course.title,
      size: course.size,
      progress: 0,
      status: 'pending',
      startTime: new Date()
    };

    setDownloads(prev => [...prev, downloadItem]);

    // Simulate download process
    simulateDownload(downloadItem);
  }, [isOfflineModeEnabled, enableOfflineMode]);

  const simulateDownload = useCallback((item: DownloadItem) => {
    const updateProgress = (progress: number) => {
      setDownloads(prev => prev.map(download => 
        download.id === item.id 
          ? { ...download, progress, status: progress === 100 ? 'completed' : 'downloading' }
          : download
      ));
    };

    let progress = 0;
    const interval = setInterval(() => {
      if (isPaused) return;

      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateProgress(progress);
      } else {
        updateProgress(progress);
      }
    }, 500);
  }, [isPaused]);

  const pauseDownload = useCallback((downloadId: string) => {
    setDownloads(prev => prev.map(download => 
      download.id === downloadId 
        ? { ...download, status: 'paused' as const }
        : download
    ));
  }, []);

  const resumeDownload = useCallback((downloadId: string) => {
    setDownloads(prev => prev.map(download => 
      download.id === downloadId 
        ? { ...download, status: 'downloading' as const }
        : download
    ));
  }, []);

  const cancelDownload = useCallback((downloadId: string) => {
    setDownloads(prev => prev.filter(download => download.id !== downloadId));
  }, []);

  const clearCompleted = useCallback(() => {
    setDownloads(prev => prev.filter(download => download.status !== 'completed'));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'downloading':
        return 'Downloading';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'paused':
        return 'Paused';
      default:
        return 'Unknown';
    }
  };

  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const pendingDownloads = downloads.filter(d => d.status === 'pending');

  return (
    <div className={className}>
      {/* Download Manager Toggle */}
      <button
        onClick={() => setShowManager(!showManager)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Download className="w-6 h-6" />
        {activeDownloads.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeDownloads.length}
          </span>
        )}
      </button>

      {/* Download Manager Panel */}
      <AnimatePresence>
        {showManager && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-40 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Download Manager</h3>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {storageUsage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Storage Usage Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Storage</span>
                  <span>{formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Download Controls */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={clearCompleted}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {activeDownloads.length} active
                </span>
              </div>
            </div>

            {/* Download List */}
            <div className="max-h-64 overflow-y-auto">
              {downloads.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Download className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No downloads</p>
                </div>
              ) : (
                downloads.map((download) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(download.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {download.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(download.size)} • {getStatusText(download.status)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{download.progress.toFixed(1)}%</span>
                            <span>{formatFileSize((download.size * download.progress) / 100)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${download.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 ml-2">
                        {download.status === 'downloading' && (
                          <button
                            onClick={() => pauseDownload(download.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        {download.status === 'paused' && (
                          <button
                            onClick={() => resumeDownload(download.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => cancelDownload(download.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Quick Download Section */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Download</h4>
              <div className="space-y-1">
                {sampleCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => addToDownloadQueue(course)}
                    disabled={downloads.some(d => d.courseId === course.id)}
                    className="w-full text-left p-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{course.title}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(course.size)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
