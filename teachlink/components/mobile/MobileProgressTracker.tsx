import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Trophy, Target, Flame, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import { apiService } from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';
import { Course, Lesson, UserProgress } from '../../types/mobile';

interface ProgressCourse extends Course {
  lessons: Lesson[];
  completedLessons: number;
}

export default function MobileProgressTracker() {
  const [courses, setCourses] = useState<ProgressCourse[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadData();

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
        // Load from API
        const [coursesResponse, progressResponse] = await Promise.all([
          apiService.getCourses(),
          apiService.getUserProgress()
        ]);

        const coursesWithLessons = await Promise.all(
          coursesResponse.data.slice(0, 3).map(async (course) => {
            const lessonsResponse = await apiService.getCourseLessons(course.id);
            const completedLessons = lessonsResponse.data.filter(l => l.completed).length;
            
            return {
              ...course,
              lessons: lessonsResponse.data,
              completedLessons
            };
          })
        );

        setCourses(coursesWithLessons);
        setUserProgress(progressResponse.data);

        // Save to offline storage
        await offlineStorage.saveUserProgress(progressResponse.data);
        coursesWithLessons.forEach(course => {
          offlineStorage.saveCourse(course);
          offlineStorage.saveLessons(course.lessons);
        });
      } else {
        // Load from offline storage
        const storedCourses = await offlineStorage.getDownloadedCourses();
        const coursesWithLessons = await Promise.all(
          storedCourses.map(async (course) => {
            const lessons = await offlineStorage.getCourseLessons(course.id);
            const completedLessons = lessons.filter(l => l.completed).length;
            
            return {
              ...course,
              lessons,
              completedLessons
            };
          })
        );

        setCourses(coursesWithLessons);
        setUserProgress(await offlineStorage.getUserProgress());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance && activeIndex < courses.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
    
    if (distance < -minSwipeDistance && activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const toggleLesson = async (courseId: string, lessonId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const newCompleted = !lesson.completed;

    // Update local state
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        const updatedLessons = c.lessons.map(l =>
          l.id === lessonId ? { ...l, completed: newCompleted } : l
        );
        const completedCount = updatedLessons.filter(l => l.completed).length;
        const progress = (completedCount / c.totalLessons) * 100;
        
        return {
          ...c,
          lessons: updatedLessons,
          completedLessons: completedCount,
          progress
        };
      }
      return c;
    }));

    // Update offline storage
    const updatedCourse = courses.find(c => c.id === courseId);
    if (updatedCourse) {
      await offlineStorage.saveCourse(updatedCourse);
      await offlineStorage.saveLessons(updatedCourse.lessons);
    }

    // Sync with API if online
    if (isOnline) {
      try {
        await apiService.updateLessonProgress(lessonId, newCompleted);
      } catch (err) {
        console.error('Failed to sync progress:', err);
      }
    }
  };

  const activeCourse = courses[activeIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-700 mb-4">{error}</p>
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

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No progress data
          </h3>
          <p className="text-gray-500">
            Start learning to see your progress here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats Header */}
      <div className="bg-white p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-linear-to-br from-orange-400 to-orange-500 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-xs font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold">{userProgress?.streak || 0}</div>
            <div className="text-xs opacity-90">days</div>
          </div>

          <div className="bg-linear-to-br from-blue-400 to-blue-500 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5" />
              <span className="text-xs font-medium">Time</span>
            </div>
            <div className="text-2xl font-bold">
              {userProgress ? Math.floor(userProgress.totalTimeSpent / 60) : 0}
            </div>
            <div className="text-xs opacity-90">hours</div>
          </div>

          <div className="bg-linear-to-br from-green-400 to-green-500 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-xs font-medium">Done</span>
            </div>
            <div className="text-2xl font-bold">
              {courses.reduce((acc, c) => acc + c.completedLessons, 0)}
            </div>
            <div className="text-xs opacity-90">lessons</div>
          </div>

          <div className="bg-linear-to-br from-purple-400 to-purple-500 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">Goal</span>
            </div>
            <div className="text-2xl font-bold">{userProgress?.dailyGoal || 30}</div>
            <div className="text-xs opacity-90">min/day</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Last active: {userProgress?.lastActive ? 
            new Date(userProgress.lastActive).toLocaleDateString() : 'Never'}</span>
        </div>
      </div>

      {/* Course Swipe Area */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
          <div className="flex gap-1">
            {courses.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'w-8 bg-blue-500' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div 
          className="relative overflow-hidden rounded-2xl"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {courses.map((course) => (
              <div key={course.id} className="w-full shrink-0 px-1">
                <div className="bg-white rounded-2xl shadow-lg p-5">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{Math.round(course.progress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {course.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => toggleLesson(course.id, lesson.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-transform touch-manipulation ${
                          lesson.completed ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          lesson.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {lesson.completed && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${
                            lesson.completed ? 'text-gray-600 line-through' : 'text-gray-900'
                          }`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-500">{lesson.duration}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>

                  <button 
                    className="w-full mt-4 py-3 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform"
                    onClick={() => {
                      // Navigate to course or continue learning
                      const firstIncompleteLesson = course.lessons.find(l => !l.completed);
                      if (firstIncompleteLesson) {
                        // Handle lesson start
                      }
                    }}
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Swipe to switch courses • Tap lessons to mark complete
        </p>
      </div>
    </div>
  );
}