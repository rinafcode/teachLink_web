"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  initialImageUrl?: string;
  className?: string;
}

export default function ImageUploader({
  onImageSelect,
  initialImageUrl,
  className = "",
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Pass file to parent
      onImageSelect(file);
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
          <img
            src={previewUrl}
            alt="Profile Preview"
            className="w-full h-full object-cover"
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
