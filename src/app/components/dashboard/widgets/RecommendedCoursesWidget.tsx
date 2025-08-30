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
  settings: Record<string, any>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
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
  onUpdateTitle
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setTempTitle(title); }, [title]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) setError('Failed to load recommendations');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Mock recommended courses
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
      price: 89
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
      price: 129
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
      price: 69
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        layout
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{recommendedCourses.length} courses</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsConfigOpen((v) => !v)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Widget settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        {isConfigOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Title</label>
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => {
                  const t = tempTitle.trim();
                  if (t) onUpdateTitle(t); else setTempTitle(title);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Size</label>
              <select
                value={size}
                onChange={(e) => onChangeSize(e.target.value as any)}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Category</label>
              <input
                value={settings.category ?? ''}
                onChange={(e) => onUpdateSettings({ category: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="e.g. Web Development"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {recommendedCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex">
              <div className="w-24 h-20 bg-gray-200 flex-shrink-0">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-3">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {course.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">{course.instructor}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="text-yellow-500 fill-current" />
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                  <span className="text-sm font-bold text-gray-900">${course.price}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* View All Button */}
        <button className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          View All Recommendations
        </button>
      </div>
    </motion.div>
  );
}; 