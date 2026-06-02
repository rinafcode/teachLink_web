'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { dataWarehouse } from '@/lib/dataWarehouse';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  initialImageUrl?: string;
  className?: string;
}

function ImageUploader({ onImageSelect, initialImageUrl, className = '' }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);

        onImageSelect(file);
      }
    },
    [onImageSelect],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        type="button"
        aria-label="Change profile picture"
        onClick={handleClick}
        className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-gray-100 p-0 transition-colors hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Profile Preview"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={previewUrl.startsWith('blob:')}
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
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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

export default memo(ImageUploader);
