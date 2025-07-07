import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy, Target } from 'lucide-react';

interface LearningStreakWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, any>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
}

export const LearningStreakWidget: React.FC<LearningStreakWidgetProps> = ({
  id,
  title,
  isCollapsed,
  settings,
  onToggleCollapse,
  onUpdateSettings,
  onRemove
}) => {
  // Mock streak data
  const currentStreak = 7;
  const longestStreak = 21;
  const weeklyGoal = 5;
  const weeklyProgress = 4;
  const monthlyHours = 45;

  const streakDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date,
      studied: i >= 23, // Last 7 days
      hours: i >= 23 ? Math.floor(Math.random() * 3) + 1 : 0
    };
  });

  if (isCollapsed) {
    return (
      <motion.div
        layout
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <Flame size={20} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-600">{currentStreak}</span>
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
            <Flame size={20} className="text-orange-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Flame size={16} />
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
        {/* Current Streak */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Flame size={32} className="text-orange-500" />
            <span className="text-3xl font-bold text-gray-900">{currentStreak}</span>
          </div>
          <p className="text-sm text-gray-600">Current Streak (days)</p>
        </div>

        {/* Streak Calendar */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">30-Day Activity</h4>
          <div className="grid grid-cols-15 gap-1">
            {streakDays.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`w-4 h-4 rounded-sm ${
                  day.studied 
                    ? day.hours >= 2 
                      ? 'bg-green-500' 
                      : 'bg-green-300'
                    : 'bg-gray-200'
                }`}
                title={`${day.date.toLocaleDateString()}: ${day.hours}h`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Trophy size={20} className="mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold text-gray-900">{longestStreak}</div>
            <div className="text-xs text-gray-600">Longest Streak</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Target size={20} className="mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold text-gray-900">{monthlyHours}h</div>
            <div className="text-xs text-gray-600">This Month</div>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Weekly Goal</h4>
            <span className="text-sm text-gray-600">{weeklyProgress}/{weeklyGoal} days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-green-500 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Flame size={16} className="text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Keep the fire burning!</p>
              <p className="text-xs text-gray-600">You're on a great streak. Don't break it!</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 