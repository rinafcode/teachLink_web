import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BookOpen, Award, Clock, CheckCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'course_completed' | 'lesson_started' | 'quiz_passed' | 'certificate_earned' | 'streak_milestone';
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
  color: string;
}

interface RecentActivityWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, any>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  id,
  title,
  isCollapsed,
  settings,
  onToggleCollapse,
  onUpdateSettings,
  onRemove
}) => {
  // Mock activity data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'course_completed',
      title: 'Completed React Fundamentals',
      description: 'You finished the React Fundamentals course with 95% score',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: '2',
      type: 'lesson_started',
      title: 'Started Advanced JavaScript',
      description: 'You began lesson 3: Closures and Scope',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      id: '3',
      type: 'quiz_passed',
      title: 'Passed Database Quiz',
      description: 'You scored 88% on the SQL Fundamentals quiz',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      icon: Award,
      color: 'text-purple-600'
    },
    {
      id: '4',
      type: 'streak_milestone',
      title: '7-Day Learning Streak',
      description: 'Congratulations! You\'ve maintained a 7-day learning streak',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: Activity,
      color: 'text-orange-600'
    },
    {
      id: '5',
      type: 'certificate_earned',
      title: 'Earned Python Certificate',
      description: 'You earned a certificate for completing Python for Beginners',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      icon: Award,
      color: 'text-yellow-600'
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
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
            <span className="text-sm text-gray-500">{activities.length} activities</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Activity size={20} />
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
            <Activity size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Activity size={16} />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
              <activity.icon size={16} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {activity.title}
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                {activity.description}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>{formatTimeAgo(activity.timestamp)}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* View All Button */}
        <div className="pt-4 border-t border-gray-200">
          <button className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 