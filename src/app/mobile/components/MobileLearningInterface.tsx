"use client"

import { useState, useEffect } from "react";
import { Home, BookOpen, Download, BarChart3, User, Play, Loader2 } from "lucide-react";
import TouchOptimizedControls from "./TouchOptimizedControls";
import OfflineContentManager from "./OfflineContentManager";
import MobileProgressTracker from "./MobileProgressTracker";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";
import { apiService } from "@/services/api";
import { offlineStorage } from "../../services/offlineStorage";
import { Course, Lesson } from "../../types/mobile";

type Tab = "home" | "courses" | "downloads" | "progress" | "profile";

export default function MobileLearningInterface() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showVideo, setShowVideo] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isMobile, isOnline, deviceType } = useMobileOptimization();

  useEffect(() => {
       if (typeof window !== 'undefined') {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API first
      if (isOnline) {
        const [coursesResponse, userProgressResponse] = await Promise.all([
          apiService.getCourses({ limit: 3 }),
          apiService.getUserProgress()
        ]);

        setFeaturedCourses(coursesResponse.data);
        
        // Save to offline storage
        await offlineStorage.saveUserProgress(userProgressResponse.data);
      } else {
        // Load from offline storage
        const downloadedCourses = await offlineStorage.getDownloadedCourses();
        setFeaturedCourses(downloadedCourses.slice(0, 3));

        const userProgress = await offlineStorage.getUserProgress();
        if (userProgress) {
          // Process recent lessons from progress
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayLesson = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setShowVideo(true);

    // Start learning session
    if (isOnline) {
      try {
        await apiService.startLearningSession(lesson.id);
      } catch (err) {
        console.error('Failed to start session:', err);
      }
    }
  };

  const handleVideoClose = async () => {
    if (currentLesson && isOnline) {
      try {
        // End learning session
        await apiService.updateLessonProgress(currentLesson.id, true);
      } catch (err) {
        console.error('Failed to update progress:', err);
      }
    }
    setShowVideo(false);
    setCurrentLesson(null);
  };

  if (showVideo && currentLesson) {
    return (
      <div className="relative">
        <TouchOptimizedControls 
          videoTitle={currentLesson.title}
          videoUrl={currentLesson.videoUrl}
          onClose={handleVideoClose}
        />
      </div>
    );
  }

  const renderHome = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Hero Section */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 text-white p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-1">Welcome back!</h1>
            <p className="text-blue-100 text-sm">Ready to continue learning?</p>
          </div>

          {/* Status indicators */}
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-full text-xs ${
              isOnline ? "bg-green-500/20 text-green-100" : "bg-orange-500/20 text-orange-100"
            }`}>
              {isOnline ? "🟢 Online" : "🟠 Offline"}
            </div>
            <div className="px-3 py-1 rounded-full text-xs bg-white/20 text-white">
              {deviceType}
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        {recentLessons.length > 0 && (
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Continue Learning
            </h2>
            <div
              onClick={() => handlePlayLesson(recentLessons[0])}
              className="bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform"
            >
              <div className="aspect-video flex items-center justify-center relative">
                <div className="text-6xl mb-4">🎬</div>
                <div className="absolute">
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {recentLessons[0].title}
                </h3>
                <p className="text-sm text-gray-500 mb-2 truncate">
                  Course Name
                </p>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-linear-to-r from-purple-500 to-indigo-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  65% complete • 6:32 remaining
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Featured Courses */}
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Featured Courses
          </h2>
          <div className="space-y-3">
            {featuredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm p-4 active:scale-[0.98] transition-transform"
                onClick={() => setActiveTab("courses")}
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{course.instructor}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>{course.totalLessons} lessons</span>
                  <span>•</span>
                  <span>{course.duration}</span>
                </div>
                {course.progress > 0 && (
                  <div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {course.progress}% complete
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Content Area */}
      {activeTab === "home" && renderHome()}
      {activeTab === "courses" && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center p-8">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>All Courses</p>
          </div>
        </div>
      )}
      {activeTab === "downloads" && <OfflineContentManager />}
      {activeTab === "progress" && <MobileProgressTracker />}
      {activeTab === "profile" && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center p-8">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Profile Settings</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:scale-95 transition-transform ${
              activeTab === "home" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("courses")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:scale-95 transition-transform ${
              activeTab === "courses" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs font-medium">Courses</span>
          </button>

          <button
            onClick={() => setActiveTab("downloads")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:scale-95 transition-transform ${
              activeTab === "downloads" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <Download className="w-6 h-6" />
            <span className="text-xs font-medium">Downloads</span>
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:scale-95 transition-transform ${
              activeTab === "progress" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Progress</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:scale-95 transition-transform ${
              activeTab === "profile" ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}