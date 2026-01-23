'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Video, FileCheck } from 'lucide-react';

interface ContentUploaderProps {
  onUpload: (file: File, type: 'video' | 'text' | 'pdf') => void;
  accept?: string;
  maxSize?: number;
}

export const ContentUploader: React.FC<ContentUploaderProps> = ({
  onUpload,
  accept = 'video/*,.pdf,.txt,.md',
  maxSize = 100 * 1024 * 1024
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<{
    file: File;
    type: 'video' | 'text' | 'pdf';
    url?: string;
  } | null>(null);

  const getFileType = (file: File): 'video' | 'text' | 'pdf' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'text';
  };

  const handleFile = useCallback((file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const type = getFileType(file);
    const url = type === 'video' ? URL.createObjectURL(file) : undefined;

    setPreview({ file, type, url });
  }, [maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = useCallback(() => {
    if (preview) {
      onUpload(preview.file, preview.type);
      setPreview(null);
      if (preview.url) URL.revokeObjectURL(preview.url);
    }
  }, [preview, onUpload]);

  const handleCancel = useCallback(() => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }, [preview]);

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Drag and drop your file here, or
          </p>
          <label className="mt-2 inline-block">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
              Browse Files
            </span>
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleChange}
            />
          </label>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Supported: Videos, PDFs, Text (Max {maxSize / (1024 * 1024)}MB)
          </p>
        </div>
      ) : (
        <div className="border dark:border-gray-700 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {preview.type === 'video' && <Video className="h-8 w-8 text-blue-600" />}
              {preview.type === 'pdf' && <FileText className="h-8 w-8 text-red-600" />}
              {preview.type === 'text' && <FileCheck className="h-8 w-8 text-green-600" />}
              <div>
                <p className="font-medium dark:text-white">{preview.file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(preview.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {preview.type === 'video' && preview.url && (
            <video
              src={preview.url}
              controls
              className="w-full max-h-64 rounded-md mb-4"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload Content
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
