'use client';

import React from 'react';
import { useCMS } from '@/hooks/useCMS';
import { History, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

export const VersionControl: React.FC = () => {
  const { history, historyIndex, undo, redo, course } = useCMS();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
        <History className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Version Control</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* History Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-8 relative">
              {history
                .map((snapshot, index) => {
                  const isCurrent = index === historyIndex;
                  const isPast = index < historyIndex;

                  return (
                    <div key={index} className="flex gap-4 items-start pl-2">
                      <div
                        className={`z-10 w-4 h-4 rounded-full mt-1.5 border-2 ${
                          isCurrent
                            ? 'bg-blue-500 border-blue-200 dark:border-blue-800 animate-pulse'
                            : isPast
                            ? 'bg-green-500 border-green-200 dark:border-green-800'
                            : 'bg-gray-300 border-white dark:border-gray-800'
                        }`}
                      />

                      <div
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            {isCurrent ? 'Current Version' : `Version ${index + 1}`}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Just now
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {snapshot.modules.length} modules,{' '}
                          {snapshot.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                        </p>

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              // Logic to jump to this specific history index
                              // In a full implementation, the store would handle this
                            }}
                            className="mt-2 text-[10px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Preview & Rollback
                          </button>
                        )}

                        {isCurrent && (
                          <div className="mt-2 text-[10px] font-medium text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
                .reverse()}{' '}
              {/* Show newest first */}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <div className="rotate-180">
            <RotateCcw className="w-4 h-4" />
          </div>
          Redo
        </button>
      </div>
    </div>
  );
};
