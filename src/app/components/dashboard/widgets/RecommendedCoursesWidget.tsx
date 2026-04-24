import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Clock, Users, Settings } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  image: string;
  price: number;
}

interface RecommendedCoursesWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, unknown>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onRemove: () => void;
  size: 'small' | 'medium' | 'large';
  onChangeSize: (size: 'small' | 'medium' | 'large') => void;
  onUpdateTitle: (title: string) => void;
}

export const RecommendedCoursesWidget: React.FC<RecommendedCoursesWidgetProps> = ({
  id,
  title,
  isCollapsed,
  settings,
  onToggleCollapse,
  onUpdateSettings,
  onRemove,
  size,
  onChangeSize,
  onUpdateTitle,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (cancelled) return;
      } catch {
        if (!cancelled) setError('Failed to load recommendations');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const recommendedCourses: Course[] = [
    {
      id: '1',
      title: 'Advanced React Patterns',
      instructor: 'Sarah Johnson',
      rating: 4.8,
      students: 12450,
      duration: '8 hours',
      level: 'advanced',
      category: 'Web Development',
      image: 'https://via.placeholder.com/300x200/3B82F6/ffffff?text=React',
      price: 89,
    },
    {
      id: '2',
      title: 'Machine Learning Fundamentals',
      instructor: 'Dr. Michael Chen',
      rating: 4.9,
      students: 8920,
      duration: '12 hours',
      level: 'intermediate',
      category: 'Data Science',
      image: 'https://via.placeholder.com/300x200/10B981/ffffff?text=ML',
      price: 129,
    },
    {
      id: '3',
      title: 'UI/UX Design Principles',
      instructor: 'Emma Davis',
      rating: 4.7,
      students: 15680,
      duration: '6 hours',
      level: 'beginner',
      category: 'Design',
      image: 'https://via.placeholder.com/300x200/8B5CF6/ffffff?text=Design',
      price: 69,
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-600';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-600';
      case 'advanced':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isCollapsed) {
    return (
      <motion.div layout className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{recommendedCourses.length} courses</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <BookOpen size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsConfigOpen((value) => !value)}
              className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Widget settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-red-400 transition-colors hover:text-red-600"
            >
              x
            </button>
          </div>
        </div>
        {isConfigOpen && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Title</label>
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => {
                  const nextTitle = tempTitle.trim();
                  if (nextTitle) onUpdateTitle(nextTitle);
                  else setTempTitle(title);
                }}
                className="w-full rounded border border-gray-300 px-2 py-1"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">Size</label>
              <select
                value={size}
                onChange={(e) => onChangeSize(e.target.value as 'small' | 'medium' | 'large')}
                className="w-full rounded border border-gray-300 px-2 py-1"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">Category</label>
              <input
                // @ts-expect-error settings uses an unknown-backed record
                value={settings.category ?? ''}
                onChange={(e) => onUpdateSettings({ category: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1"
                placeholder="e.g. Web Development"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        {isLoading && <div className="text-sm text-gray-500">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {recommendedCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="flex">
              <div className="h-20 w-24 flex-shrink-0 bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 p-3">
                <h4 className="mb-1 line-clamp-2 text-sm font-medium text-gray-900">
                  {course.title}
                </h4>
                <p className="mb-2 text-xs text-gray-600">{course.instructor}</p>

                <div className="mb-2 flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="fill-current text-yellow-500" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users size={12} />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getLevelColor(
                      course.level,
                    )}`}
                  >
                    {course.level}
                  </span>
                  <span className="text-sm font-bold text-gray-900">${course.price}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <button className="w-full py-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
          View All Recommendations
        </button>
      </div>
    </motion.div>
  );
};
