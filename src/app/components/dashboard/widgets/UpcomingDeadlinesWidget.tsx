import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { format, addDays, isAfter, isBefore, isToday } from 'date-fns';

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  course: string;
  type: 'assignment' | 'quiz' | 'project' | 'exam';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

interface UpcomingDeadlinesWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, any>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
}

export const UpcomingDeadlinesWidget: React.FC<UpcomingDeadlinesWidgetProps> = ({
  id,
  title,
  isCollapsed,
  settings,
  onToggleCollapse,
  onUpdateSettings,
  onRemove
}) => {
  // Mock deadlines data
  const deadlines: Deadline[] = [
    {
      id: '1',
      title: 'React Fundamentals Quiz',
      dueDate: addDays(new Date(), 1),
      course: 'React Development',
      type: 'quiz',
      priority: 'high',
      completed: false
    },
    {
      id: '2',
      title: 'Final Project Submission',
      dueDate: addDays(new Date(), 3),
      course: 'Advanced JavaScript',
      type: 'project',
      priority: 'high',
      completed: false
    },
    {
      id: '3',
      title: 'Database Design Assignment',
      dueDate: addDays(new Date(), 5),
      course: 'Database Management',
      type: 'assignment',
      priority: 'medium',
      completed: false
    },
    {
      id: '4',
      title: 'Midterm Exam',
      dueDate: addDays(new Date(), 7),
      course: 'Computer Science',
      type: 'exam',
      priority: 'high',
      completed: false
    },
    {
      id: '5',
      title: 'Weekly Reflection',
      dueDate: new Date(),
      course: 'Learning Strategies',
      type: 'assignment',
      priority: 'low',
      completed: true
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return '📝';
      case 'project': return '💼';
      case 'assignment': return '📋';
      case 'exam': return '📚';
      default: return '📄';
    }
  };

  const getDaysUntil = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const getUrgencyStatus = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  };

  const sortedDeadlines = deadlines
    .filter(d => !d.completed)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const completedDeadlines = deadlines.filter(d => d.completed);

  if (isCollapsed) {
    return (
      <motion.div
        layout
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{sortedDeadlines.length} pending</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Clock size={20} />
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
            <Clock size={20} className="text-orange-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {sortedDeadlines.length} pending
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Clock size={16} />
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
        {/* Upcoming Deadlines */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Deadlines</h4>
          <div className="space-y-3">
            {sortedDeadlines.slice(0, 4).map((deadline, index) => {
              const urgencyStatus = getUrgencyStatus(deadline.dueDate);
              const isUrgent = urgencyStatus === 'urgent' || urgencyStatus === 'overdue';
              
              return (
                <motion.div
                  key={deadline.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    isUrgent 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg">{getTypeIcon(deadline.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate">
                          {deadline.title}
                        </h5>
                        <p className="text-sm text-gray-600">{deadline.course}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(deadline.dueDate, 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deadline.priority)}`}>
                        {deadline.priority}
                      </span>
                      <div className={`text-xs font-medium ${
                        urgencyStatus === 'overdue' ? 'text-red-600' :
                        urgencyStatus === 'urgent' ? 'text-orange-600' :
                        urgencyStatus === 'soon' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getDaysUntil(deadline.dueDate)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Completed Deadlines */}
        {completedDeadlines.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recently Completed</h4>
            <div className="space-y-2">
              {completedDeadlines.slice(0, 2).map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg"
                >
                  <CheckCircle size={16} className="text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-gray-600">{deadline.course}</p>
                  </div>
                  <span className="text-xs text-green-600">Completed</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {sortedDeadlines.filter(d => getUrgencyStatus(d.dueDate) === 'urgent').length}
            </div>
            <div className="text-xs text-gray-600">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {sortedDeadlines.filter(d => getUrgencyStatus(d.dueDate) === 'soon').length}
            </div>
            <div className="text-xs text-gray-600">Soon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedDeadlines.length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 