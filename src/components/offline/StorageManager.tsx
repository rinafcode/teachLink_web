'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HardDrive, Trash2, DownloadCloud, AlertTriangle } from 'lucide-react';
import { OfflineCourseRecord } from '../../services/offlineSync';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface StorageManagerProps {
  className?: string;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (timestamp?: string) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

export const StorageManager: React.FC<StorageManagerProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState<OfflineCourseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    storageUsage,
    getOfflineCourses,
    removeCourse,
    clearOfflineData,
    refreshStorageUsage
  } = useOfflineModeContext();

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    const results = await getOfflineCourses();
    setCourses(results);
    setIsLoading(false);
  }, [getOfflineCourses]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCourses();
  }, [fetchCourses, isOpen]);

  const totalCourseSize = useMemo(() => courses.reduce((acc, course) => acc + course.sizeBytes, 0), [courses]);

  const handleRemoveCourse = useCallback(async (courseId: string) => {
    await removeCourse(courseId);
    await fetchCourses();
    await refreshStorageUsage();
  }, [fetchCourses, refreshStorageUsage, removeCourse]);

  const handleClearAll = useCallback(async () => {
    await clearOfflineData();
    setCourses([]);
    await refreshStorageUsage();
  }, [clearOfflineData, refreshStorageUsage]);

  const warning = storageUsage.percentage > 85;

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Offline storage</p>
            <p className="text-xs text-gray-500">Manage downloaded courses and assets.</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {isOpen ? 'Hide details' : 'View details'}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Storage used</span>
          <span>{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full ${warning ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
          />
        </div>
        {warning && (
          <p className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-4 w-4" /> Storage is getting full.
          </p>
        )}
      </div>

      {isOpen && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{courses.length} downloaded courses</span>
            <span>Total size: {formatBytes(totalCourseSize)}</span>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading downloads...</p>
          ) : courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              No courses downloaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <DownloadCloud className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{course.title}</p>
                      <p className="text-xs text-gray-500">Downloaded {formatDate(course.downloadedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatBytes(course.sizeBytes)}</span>
                    <button
                      onClick={() => handleRemoveCourse(course.id)}
                      className="inline-flex items-center gap-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" /> Clear all offline data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
