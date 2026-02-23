import { useState, useEffect } from 'react';
import { Download, Check, Wifi, WifiOff, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { Course, OfflineContent } from '../types/mobile';

interface DownloadProgress {
  courseId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export default function OfflineContentManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(5000 * 1024 * 1024); 
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof window !== 'undefined') {
      loadData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline) {
        const response = await apiService.getDownloadableCourses();
        setCourses(response.data);
      } else {
        const downloadedCourses = await offlineStorage.getDownloadedCourses();
        setCourses(downloadedCourses);
      }

      const storage = await offlineStorage.getStorageUsage();
      setStorageUsed(storage.used);
      setStorageTotal(storage.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading offline content:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCourse = async (courseId: string) => {
    if (!isOnline) {
      setError('No internet connection available');
      return;
    }

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Add to downloads queue
    setDownloads(prev => [...prev, {
      courseId,
      progress: 0,
      status: 'downloading'
    }]);

    try {
      // Get download URL from API
      const downloadResponse = await apiService.downloadCourse(courseId);
      
      // Simulate download progress
      const interval = setInterval(() => {
        setDownloads(prev => prev.map(download => {
          if (download.courseId === courseId) {
            const newProgress = download.progress + 10;
            
            if (newProgress >= 100) {
              clearInterval(interval);
              
              // Update course as downloaded
              const updatedCourse = { ...course, downloaded: true };
              setCourses(prev => prev.map(c => 
                c.id === courseId ? updatedCourse : c
              ));
              
              // Save to offline storage
              offlineStorage.saveCourse(updatedCourse);
              
              // Create offline content record
              const offlineContent: OfflineContent = {
                courseId,
                chapters: [],
                downloadedAt: new Date(),
                size: downloadResponse.data.size,
                lastAccessed: new Date()
              };
              offlineStorage.saveOfflineContent(offlineContent);
              
              // Update storage usage
              setStorageUsed(prev => prev + downloadResponse.data.size);
              
              return { ...download, progress: 100, status: 'completed' };
            }
            
            return { ...download, progress: newProgress };
          }
          return download;
        }));
      }, 500);

      // Clean up downloads after completion
      setTimeout(() => {
        setDownloads(prev => prev.filter(d => d.courseId !== courseId));
      }, 3000);

    } catch (err) {
      console.error('Download error:', err);
      setDownloads(prev => prev.map(download => 
        download.courseId === courseId 
          ? { ...download, status: 'error', error: 'Download failed' }
          : download
      ));
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      // Delete from offline storage
      await offlineStorage.deleteOfflineContent(courseId);
      
      // Update course status
      const updatedCourse = { ...course, downloaded: false };
      await offlineStorage.saveCourse(updatedCourse);
      
      setCourses(prev => prev.map(c => 
        c.id === courseId ? updatedCourse : c
      ));

      // Update storage usage
      const sizeNum = parseInt(course.size) * 1024 * 1024; 
      setStorageUsed(prev => Math.max(0, prev - sizeNum));

      // Notify API if online
      if (isOnline) {
        await apiService.deleteDownloadedCourse(courseId);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete course');
    }
  };

  const cancelDownload = (courseId: string) => {
    setDownloads(prev => prev.map(download => 
      download.courseId === courseId 
        ? { ...download, status: 'cancelled' }
        : download
    ));
    
    setTimeout(() => {
      setDownloads(prev => prev.filter(d => d.courseId !== courseId));
    }, 500);
  };

  const storagePercent = (storageUsed / storageTotal) * 100;
  const formattedStorageUsed = (storageUsed / (1024 * 1024)).toFixed(1);
  const formattedStorageTotal = (storageTotal / (1024 * 1024 * 1024)).toFixed(1);

  const getDownloadStatus = (courseId: string) => {
    return downloads.find(d => d.courseId === courseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Offline Content</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span className="font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600 text-sm">
                  <WifiOff className="w-4 h-4" />
                  <span className="font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Storage Used</span>
              <span className="font-medium">{formattedStorageUsed} MB / {formattedStorageTotal} GB</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  storagePercent > 90 ? 'bg-red-500' : 
                  storagePercent > 70 ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {storagePercent > 90 ? 'Storage almost full' : 
               storagePercent > 70 ? 'Storage getting full' : 'Plenty of space available'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No courses available
            </h3>
            <p className="text-gray-500">
              {isOnline ? 'Connect to see downloadable courses' : 'Go online to download courses'}
            </p>
          </div>
        ) : (
          courses.map(course => {
            const downloadStatus = getDownloadStatus(course.id);
            
            return (
              <div 
                key={course.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="text-4xl shrink-0">
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span>{course.totalLessons} lessons</span>
                        <span>•</span>
                        <span>{course.duration}</span>
                        <span>•</span>
                        <span>{course.size}</span>
                      </div>
                    </div>
                  </div>

                  {downloadStatus ? (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>
                          {downloadStatus.status === 'downloading' ? 'Downloading...' :
                           downloadStatus.status === 'error' ? 'Download failed' :
                           downloadStatus.status === 'cancelled' ? 'Cancelled' : 'Downloaded!'}
                        </span>
                        <span>{downloadStatus.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            downloadStatus.status === 'error' ? 'bg-red-500' :
                            downloadStatus.status === 'cancelled' ? 'bg-gray-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${downloadStatus.progress}%` }}
                        />
                      </div>
                      {downloadStatus.status === 'downloading' && (
                        <button
                          onClick={() => cancelDownload(course.id)}
                          className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium active:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : course.downloaded ? (
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-50 text-green-700 rounded-lg font-medium">
                        <Check className="w-5 h-5" />
                        <span>Downloaded</span>
                      </div>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="py-2.5 px-4 bg-red-50 text-red-600 rounded-lg active:bg-red-100 transition-colors"
                        aria-label="Delete course"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => downloadCourse(course.id)}
                      disabled={!isOnline || downloads.some(d => d.courseId === course.id)}
                      className="w-full mt-4 py-2.5 px-4 bg-blue-500 text-white rounded-lg font-medium active:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>{isOnline ? 'Download for Offline' : 'No Connection'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}