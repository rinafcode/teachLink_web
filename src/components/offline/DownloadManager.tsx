'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, CheckCircle, AlertTriangle, Wifi, WifiOff, HardDrive } from 'lucide-react';
import { DownloadCourseInput } from '../../hooks/useOfflineMode';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface DownloadItem {
  id: string;
  courseId: string;
  title: string;
  sizeBytes?: number;
  progress: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  error?: string;
}

interface DownloadManagerProps {
  courses?: DownloadCourseInput[];
  className?: string;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const DownloadManager: React.FC<DownloadManagerProps> = ({ courses = [], className = '' }) => {
  const [downloadQueue, setDownloadQueue] = useState<DownloadItem[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

  const {
    isOnline,
    isOfflineModeEnabled,
    storageUsage,
    enableOfflineMode,
    downloadCourse,
    isCourseAvailableOffline,
    refreshStorageUsage
  } = useOfflineModeContext();

  const refreshAvailability = useCallback(async () => {
    const results = await Promise.all(
      courses.map(async (course) => ({
        id: course.id,
        available: await isCourseAvailableOffline(course.id)
      }))
    );

    const nextMap = results.reduce<Record<string, boolean>>((acc, result) => {
      acc[result.id] = result.available;
      return acc;
    }, {});

    setAvailabilityMap(nextMap);
  }, [courses, isCourseAvailableOffline]);

  useEffect(() => {
    if (courses.length === 0) return;
    refreshAvailability();
  }, [courses.length, refreshAvailability]);

  const setDownloadState = useCallback((courseId: string, updater: (item: DownloadItem) => DownloadItem) => {
    setDownloadQueue(prev => prev.map(item => (item.courseId === courseId ? updater(item) : item)));
  }, []);

  const startDownload = useCallback(async (course: DownloadCourseInput) => {
    if (!isOfflineModeEnabled) {
      await enableOfflineMode();
    }

    setDownloadQueue(prev => {
      const exists = prev.find(item => item.courseId === course.id);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `download-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          courseId: course.id,
          title: course.title,
          sizeBytes: course.sizeBytes,
          progress: 0,
          status: 'downloading'
        }
      ];
    });

    try {
      await downloadCourse(course, {
        onProgress: (progress) => {
          setDownloadState(course.id, (item) => ({
            ...item,
            progress,
            status: progress >= 100 ? 'completed' : 'downloading'
          }));
        }
      });

      setDownloadState(course.id, (item) => ({
        ...item,
        progress: 100,
        status: 'completed'
      }));

      await refreshStorageUsage();
      await refreshAvailability();
    } catch (error) {
      setDownloadState(course.id, (item) => ({
        ...item,
        status: 'error',
        error: String(error)
      }));
    }
  }, [downloadCourse, enableOfflineMode, isOfflineModeEnabled, refreshAvailability, refreshStorageUsage, setDownloadState]);

  const activeDownloads = useMemo(() => downloadQueue.filter(item => item.status === 'downloading'), [downloadQueue]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">Offline downloads</p>
            <p className="text-xs text-gray-500">
              {isOfflineModeEnabled ? 'Offline mode enabled' : 'Enable offline mode to download'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <HardDrive className="h-4 w-4" />
          <span>{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Add courses to show download actions.
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => {
            const available = availabilityMap[course.id];
            const inQueue = downloadQueue.find(item => item.courseId === course.id);
            const status = inQueue?.status;

            return (
              <div key={course.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.description || 'Course content ready for offline access.'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {available && !status && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-4 w-4" /> Downloaded
                    </span>
                  )}
                  {status === 'downloading' && (
                    <span className="text-xs text-blue-600">Downloading {inQueue?.progress}%</span>
                  )}
                  {status === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertTriangle className="h-4 w-4" /> Failed
                    </span>
                  )}

                  <button
                    onClick={() => startDownload(course)}
                    disabled={!isOnline || status === 'downloading' || available}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <Download className="h-4 w-4" />
                    {available ? 'Downloaded' : status === 'downloading' ? 'Downloading' : 'Download'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeDownloads.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Active downloads</p>
          <div className="mt-3 space-y-3">
            {activeDownloads.map(item => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{item.title}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
