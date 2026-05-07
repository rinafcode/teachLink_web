'use client';

import React, { useCallback } from 'react';
import { useCMS } from '@/hooks/useCMS';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const MediaManager: React.FC = () => {
  const { mediaQueue, addToQueue, updateUploadProgress, setUploadStatus } = useCMS();

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = useCallback(
    (files: File[]) => {
      const tasks = files.map((file) => ({
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: 'uploading' as const,
      }));

      addToQueue(tasks);

      // Simulate upload for each file
      tasks.forEach((task) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadStatus(task.id, 'completed', 'https://example.com/media/dummy.jpg');
            toast.success(`${task.fileName} uploaded successfully!`);
          } else {
            updateUploadProgress(task.id, progress);
          }
        }, 500);
      });
    },
    [addToQueue, setUploadStatus, updateUploadProgress],
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Media Manager</h2>
        <div className="text-xs text-gray-500 font-medium">
          {mediaQueue.filter((t) => t.status === 'uploading').length} uploads in progress
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer relative"
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Click or drag to upload media
            </p>
            <p className="text-xs text-gray-500">Video, Images, or Documents (up to 500MB)</p>
          </div>
        </div>

        {/* Upload Queue */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Recent Uploads
          </h3>
          {mediaQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm italic">No recent uploads</div>
          ) : (
            mediaQueue
              .slice()
              .reverse()
              .map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <File className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[150px]">
                          {task.fileName}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {(task.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    {task.status === 'uploading' && (
                      <div className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {Math.round(task.progress)}%
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {task.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  </div>

                  {task.status === 'uploading' && (
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
