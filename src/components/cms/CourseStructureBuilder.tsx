'use client';

import React, { useState } from 'react';
import { useCMS } from '@/hooks/useCMS';
import { Plus, GripVertical, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';

export const CourseStructureBuilder: React.FC = () => {
  const { course, addModule, addLesson, updateCourse } = useCMS();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddModule = () => {
    addModule();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Course Structure</h2>
        <button
          onClick={handleAddModule}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {course.modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500">
            <p>No modules added yet.</p>
            <button onClick={handleAddModule} className="mt-2 text-blue-500 hover:underline">
              Click here to add your first module
            </button>
          </div>
        ) : (
          course.modules
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <div
                key={module.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Module Header */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 group">
                  <button onClick={() => toggleModule(module.id)}>
                    {expandedModules[module.id] ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                  <input
                    value={module.title}
                    onChange={(e) => {
                      const updatedModules = course.modules.map((m) =>
                        m.id === module.id ? { ...m, title: e.target.value } : m,
                      );
                      updateCourse({ modules: updatedModules });
                    }}
                    className="flex-1 bg-transparent border-none focus:ring-0 font-semibold text-gray-800 dark:text-white p-0"
                  />
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                {expandedModules[module.id] && (
                  <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {module.lessons
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                              {lesson.title}
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {lesson.type}
                            </div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => addLesson(module.id)}
                      className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all text-xs font-medium mt-2"
                    >
                      <Plus className="w-3 h-3" />
                      Add Lesson
                    </button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
};
