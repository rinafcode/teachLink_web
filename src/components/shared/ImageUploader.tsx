'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  initialImageUrl?: string;
  className?: string;
}

export default function ImageUploader({
  onImageSelect,
  initialImageUrl,
  className = '',
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      try {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.crossOrigin = 'anonymous';
        video.muted = true;

        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => {
            // Seek to 1s or midway if shorter
            video.currentTime = Math.min(1, video.duration / 2);
          };
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error('Failed to load video'));
        });

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const objectUrl = URL.createObjectURL(blob);
                setPreviewUrl(objectUrl);
                const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                });
                onImageSelect(optimizedFile);
              }
            },
            'image/jpeg',
            0.85,
          );
        }
        URL.revokeObjectURL(video.src);
      } catch (error) {
        console.error('Video optimization failed:', error);
      }
    } else if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onImageSelect(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        onClick={handleClick}
        className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-gray-100 hover:border-blue-500 transition-colors group"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Profile Preview"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={previewUrl.startsWith('data:') || previewUrl.startsWith('blob:')}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">
            Change
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Upload New Picture
      </button>
    </div>
  );
}
