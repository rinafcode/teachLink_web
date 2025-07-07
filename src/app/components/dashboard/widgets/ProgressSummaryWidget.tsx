import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BookOpen, Award, Clock } from 'lucide-react';

interface ProgressSummaryWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, any>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
}

export const ProgressSummaryWidget: React.FC<ProgressSummaryWidgetProps> = ({
  id,
  title,
  isCollapsed,
  settings,
  onToggleCollapse,
  onUpdateSettings,
  onRemove
}) => {
  // Mock data - in real app, this would come from API
  const weeklyProgress = [
    { day: 'Mon', completed: 4, planned: 6 },
    { day: 'Tue', completed: 6, planned: 6 },
    { day: 'Wed', completed: 3, planned: 5 },
    { day: 'Thu', completed: 7, planned: 7 },
    { day: 'Fri', completed: 5, planned: 6 },
    { day: 'Sat', completed: 2, planned: 4 },
    { day: 'Sun', completed: 3, planned: 3 }
  ];

  const courseProgress = [
    { name: 'Completed', value: 65, color: '#10B981' },
    { name: 'In Progress', value: 25, color: '#F59E0B' },
    { name: 'Not Started', value: 10, color: '#EF4444' }
  ];

  const stats = [
    { label: 'Courses Completed', value: '12', icon: Award, color: 'text-green-600' },
    { label: 'Hours Studied', value: '156', icon: Clock, color: 'text-blue-600' },
    { label: 'Current Streak', value: '7 days', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Certificates', value: '8', icon: BookOpen, color: 'text-orange-600' }
  ];

  if (isCollapsed) {
    return (
      <motion.div
        layout
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <TrendingUp size={20} />
          </button>
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
            <TrendingUp size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <TrendingUp size={16} />
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
      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-3 bg-gray-50 rounded-lg"
            >
              <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Progress Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Progress</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="planned" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Progress Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Course Progress</h4>
          <div className="flex items-center space-x-4">
            <ResponsiveContainer width="50%" height={150}>
              <PieChart>
                <Pie
                  data={courseProgress}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {courseProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {courseProgress.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-blue-900">Overall Progress</h5>
              <p className="text-sm text-blue-700">You're doing great! Keep up the momentum.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">78%</div>
              <div className="text-sm text-blue-700">Complete</div>
            </div>
          </div>
          <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '78%' }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-blue-600 h-2 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 