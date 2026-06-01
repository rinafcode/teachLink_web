/**
 * Image Optimizer and Dimension Validator
 * Provides client-side utilities for image compression, resizing, and constraints validation.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  preserveAspectRatio?: boolean;
}

export interface ImageDimensionConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

/**
 * Optimizes an image file client-side using HTML5 Canvas.
 * Falls back gracefully to the original file in non-browser/SSR environments.
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<File> {
  const {
    maxWidth,
    maxHeight,
    quality = 0.8,
    format = 'image/webp',
    preserveAspectRatio = true,
  } = options;

  // SSR / Node.js Testing Fallback
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof FileReader === 'undefined'
  ) {
    return file;
  }

  // Ignore non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (preserveAspectRatio) {
          if (maxWidth && width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (maxHeight && height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        } else {
          width = maxWidth || width;
          height = maxHeight || height;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to optimized Blob/File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Determine correct file extension
            const extensionMap: Record<string, string> = {
              'image/jpeg': '.jpg',
              'image/png': '.png',
              'image/webp': '.webp',
            };
            const ext = extensionMap[format] || '.webp';
            const originalName = file.name;
            const dotIdx = originalName.lastIndexOf('.');
            const nameWithoutExt = dotIdx !== -1 ? originalName.substring(0, dotIdx) : originalName;
            const newName = `${nameWithoutExt}${ext}`;

            const optimizedFile = new File([blob], newName, {
              type: format,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          format,
          quality,
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates image width and height dimensions asynchronously.
 * Falls back gracefully to true in non-browser/SSR environments.
 */
export function validateImageDimensions(
  file: File | null | undefined,
  constraints: ImageDimensionConstraints,
): Promise<{ isValid: boolean; width?: number; height?: number; error?: string }> {
  // SSR / Node.js Testing Fallback
  if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
    return Promise.resolve({ isValid: true });
  }

  // Handle null/undefined values
  if (!file) {
    return Promise.resolve({ isValid: true });
  }

  // Reject non-image files
  if (!file.type.startsWith('image/')) {
    return Promise.resolve({ isValid: false, error: 'File is not an image' });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;
        const { minWidth, maxWidth, minHeight, maxHeight } = constraints;

        if (minWidth && width < minWidth) {
          resolve({
            isValid: false,
            width,
            height,
            error: `Image width (${width}px) is less than minimum width (${minWidth}px)`,
          });
          return;
        }

        if (maxWidth && width > maxWidth) {
          resolve({
            isValid: false,
            width,
            height,
            error: `Image width (${width}px) exceeds maximum width (${maxWidth}px)`,
          });
          return;
        }

        if (minHeight && height < minHeight) {
          resolve({
            isValid: false,
            width,
            height,
            error: `Image height (${height}px) is less than minimum height (${minHeight}px)`,
          });
          return;
        }

        if (maxHeight && height > maxHeight) {
          resolve({
            isValid: false,
            width,
            height,
            error: `Image height (${height}px) exceeds maximum height (${maxHeight}px)`,
          });
          return;
        }

        resolve({ isValid: true, width, height });
      };

      img.onerror = () => {
        resolve({ isValid: false, error: 'Failed to load image for dimensions check' });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({ isValid: false, error: 'Failed to read image file' });
    };

    reader.readAsDataURL(file);
  });
}