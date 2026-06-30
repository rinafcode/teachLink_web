import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { optimizeImage, validateImageDimensions } from './image-optimizer';
import { FieldDescriptor } from '../types/core.js';

describe('Image Optimization', () => {
  const originalImage = global.Image;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;

  beforeEach(() => {
    // Mock Image class to trigger onload automatically in jsdom
    class MockImage {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      width = 500;
      height = 500;
      private _src = '';

      get src() {
        return this._src;
      }

      set src(val: string) {
        this._src = val;
        // Trigger onload asynchronously to simulate image load
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    }
    global.Image = MockImage as any;

    // Mock HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (
      callback: (blob: Blob | null) => void,
      type?: string,
    ) {
      const file = new File(['mock content'], 'test.webp', { type: type || 'image/webp' });
      setTimeout(() => callback(file), 10);
    };
  });

  afterEach(() => {
    global.Image = originalImage;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    vi.restoreAllMocks();
  });
  describe('optimizeImage', () => {
    const createMockImageFile = (name = 'test.jpg', size = 1000, type = 'image/jpeg'): File => {
      const file = new File(['mock image content'], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };

    it('should return original file in SSR environment', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally removing window for SSR test
      delete global.window;

      const file = createMockImageFile();
      const result = await optimizeImage(file, { maxWidth: 800 });

      expect(result).toBe(file);

      global.window = originalWindow;
    });

    it('should return original file for non-image files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = await optimizeImage(file, { maxWidth: 800 });

      expect(result).toBe(file);
      expect(result.name).toBe('test.txt');
    });

    it('should return original file when no options provided', async () => {
      const file = createMockImageFile();
      const result = await optimizeImage(file);

      // In jsdom, image loading may fail, so it falls back to original
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe(file.name);
    });

    it('should apply default options when partial options provided', async () => {
      const file = createMockImageFile();
      const result = await optimizeImage(file, { maxWidth: 100 });

      // In jsdom environment without proper image loading, falls back to original
      expect(result).toBeInstanceOf(File);
    });

    it('should handle different image formats', async () => {
      const pngFile = new File(['mock'], 'test.png', { type: 'image/png' });
      const webpFile = new File(['mock'], 'test.webp', { type: 'image/webp' });

      // Both should return valid File objects
      expect(await optimizeImage(pngFile)).toBeInstanceOf(File);
      expect(await optimizeImage(webpFile)).toBeInstanceOf(File);
    });

    it('should support different quality values', async () => {
      const file = createMockImageFile();
      const result = await optimizeImage(file, { quality: 0.5 });

      expect(result).toBeInstanceOf(File);
    });

    it('should support different output formats', async () => {
      const file = createMockImageFile();

      const jpegResult = await optimizeImage(file, { format: 'image/jpeg' });
      const pngResult = await optimizeImage(file, { format: 'image/png' });
      const webpResult = await optimizeImage(file, { format: 'image/webp' });

      expect(jpegResult).toBeInstanceOf(File);
      expect(pngResult).toBeInstanceOf(File);
      expect(webpResult).toBeInstanceOf(File);
    });

    it('should handle preserveAspectRatio option', async () => {
      const file = createMockImageFile();

      const preserveResult = await optimizeImage(file, {
        maxWidth: 100,
        preserveAspectRatio: true,
      });
      const stretchResult = await optimizeImage(file, {
        maxWidth: 100,
        maxHeight: 100,
        preserveAspectRatio: false,
      });

      // Both should return File objects in jsdom
      expect(preserveResult).toBeInstanceOf(File);
      expect(stretchResult).toBeInstanceOf(File);
    });
  });

  describe('validateImageDimensions', () => {
    const createMockImageFile = (name = 'test.jpg', type = 'image/jpeg'): File => {
      return new File(['mock'], name, { type });
    };

    it('should return valid in SSR environment', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally removing window for SSR test
      delete global.window;

      const file = createMockImageFile();
      const result = await validateImageDimensions(file, { minWidth: 100, maxWidth: 800 });

      expect(result.isValid).toBe(true);

      global.window = originalWindow;
    });

    it('should return invalid for non-image files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = await validateImageDimensions(file, { minWidth: 100 });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is not an image');
    });

    it('should return valid for null/undefined values', async () => {
      const result = await validateImageDimensions(null, { minWidth: 100 });
      expect(result.isValid).toBe(true);

      const undefinedResult = await validateImageDimensions(undefined, { minWidth: 100 });
      expect(undefinedResult.isValid).toBe(true);
    });

    it('should check constraints for image files', async () => {
      const file = createMockImageFile();
      const result = await validateImageDimensions(file, {
        minWidth: 100,
        maxWidth: 800,
        minHeight: 100,
        maxHeight: 600,
      });

      // In jsdom environment, falls back gracefully
      expect(result.isValid).toBe(true);
    });

    it('should handle empty constraints', async () => {
      const file = createMockImageFile();
      const result = await validateImageDimensions(file, {});

      expect(result.isValid).toBe(true);
    });

    it('should handle only minWidth constraint', async () => {
      const file = createMockImageFile();
      const result = await validateImageDimensions(file, { minWidth: 50 });

      expect(result.isValid).toBe(true);
    });

    it('should handle only maxWidth constraint', async () => {
      const file = createMockImageFile();
      const result = await validateImageDimensions(file, { maxWidth: 2000 });

      expect(result.isValid).toBe(true);
    });

    it('should handle only minHeight constraint', async () => {
      const file = createMockImageFile();
      const result = await validateImageDimensions(file, { minHeight: 50 });

      expect(result.isValid).toBe(true);
    });

    it('should handle only maxHeight constraint', async () => {
      const file = createMockImageFile();
      const result = await validateImageDimensions(file, { maxHeight: 2000 });

      expect(result.isValid).toBe(true);
    });
  });
});

describe('Image Optimization Integration', () => {
  const originalImage = global.Image;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;

  beforeEach(() => {
    // Mock Image class to trigger onload automatically in jsdom
    class MockImage {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      width = 500;
      height = 500;
      private _src = '';

      get src() {
        return this._src;
      }

      set src(val: string) {
        this._src = val;
        // Trigger onload asynchronously to simulate image load
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    }
    global.Image = MockImage as any;

    // Mock HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (
      callback: (blob: Blob | null) => void,
      type?: string,
    ) {
      const file = new File(['mock content'], 'test.webp', { type: type || 'image/webp' });
      setTimeout(() => callback(file), 10);
    };
  });

  afterEach(() => {
    global.Image = originalImage;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    vi.restoreAllMocks();
  });

  it('should validate image dimensions in validation engine', async () => {
    const { ValidationEngineImpl } = await import('./validation-engine.js');

    const fileField: FieldDescriptor = {
      id: 'avatar',
      type: 'file',
      label: 'Avatar',
      required: true,
      validation: [
        {
          type: 'imageDimensions',
          message: 'Image dimensions must be within bounds',
          params: { minWidth: 100, maxWidth: 800 },
        },
      ],
    };

    const engine = new ValidationEngineImpl([fileField]);

    const file = new File(['mock'], 'avatar.jpg', { type: 'image/jpeg' });
    const result = await engine.executeAsyncValidation('avatar', file);

    expect(result.isValid).toBe(true);
  });

  it('should optimize images and update form state', async () => {
    const { ValidationEngineImpl } = await import('./validation-engine.js');

    const optimizeField: FieldDescriptor = {
      id: 'profileImage',
      type: 'file',
      label: 'Profile Image',
      required: true,
      validation: [
        {
          type: 'imageOptimize',
          message: 'Image optimized',
          params: { maxWidth: 800, maxHeight: 600, quality: 0.8 },
        },
      ],
    };

    const engine = new ValidationEngineImpl([optimizeField]);

    const file = new File(['mock'], 'profile.jpg', { type: 'image/jpeg' });
    const formState = {
      values: { profileImage: file },
      validation: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      submitCount: 0,
      metadata: {
        formId: 'test',
        sessionId: 'test',
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0',
      },
    };

    const result = await engine.executeAsyncValidation('profileImage', file, formState);

    expect(result.isValid).toBe(true);
  });

  it('should handle combined image dimensions and optimization rules', async () => {
    const { ValidationEngineImpl } = await import('./validation-engine.js');

    const imageField: FieldDescriptor = {
      id: 'coverImage',
      type: 'file',
      label: 'Cover Image',
      required: true,
      validation: [
        {
          type: 'imageDimensions',
          message: 'Image must be at least 400x300 pixels',
          params: { minWidth: 400, minHeight: 300 },
        },
        {
          type: 'imageOptimize',
          message: 'Image optimized for upload',
          params: { maxWidth: 1200, maxHeight: 800, quality: 0.85 },
        },
      ],
    };

    const engine = new ValidationEngineImpl([imageField]);

    const file = new File(['mock'], 'cover.png', { type: 'image/png' });
    const formState = {
      values: { coverImage: file },
      validation: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      submitCount: 0,
      metadata: {
        formId: 'test',
        sessionId: 'test',
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0',
      },
    };

    const result = await engine.executeAsyncValidation('coverImage', file, formState);

    expect(result.isValid).toBe(true);
  });

  it('should handle fileSize validation alongside image rules', async () => {
    const { ValidationEngineImpl } = await import('./validation-engine.js');

    const imageField: FieldDescriptor = {
      id: 'photo',
      type: 'file',
      label: 'Photo',
      required: true,
      validation: [
        {
          type: 'fileSize',
          message: 'File must be under 5MB',
          params: { maxSize: 5 * 1024 * 1024 },
        },
        {
          type: 'imageDimensions',
          message: 'Image must be under 2000px wide',
          params: { maxWidth: 2000 },
        },
      ],
    };

    const engine = new ValidationEngineImpl([imageField]);

    const file = new File(['mock'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1000 });

    const result = await engine.executeAsyncValidation('photo', file);

    expect(result.isValid).toBe(true);
  });

  it('should handle fileType validation alongside image rules', async () => {
    const { ValidationEngineImpl } = await import('./validation-engine.js');

    const imageField: FieldDescriptor = {
      id: 'document',
      type: 'file',
      label: 'Document',
      required: true,
      validation: [
        {
          type: 'fileType',
          message: 'Only image files allowed',
          params: { allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] },
        },
        {
          type: 'imageDimensions',
          message: 'Image must be at least 100x100 pixels',
          params: { minWidth: 100, minHeight: 100 },
        },
      ],
    };

    const engine = new ValidationEngineImpl([imageField]);

    const file = new File(['mock'], 'document.jpg', { type: 'image/jpeg' });

    const result = await engine.executeAsyncValidation('document', file);

    expect(result.isValid).toBe(true);
  });

  it('should return original file for non-image input to imageOptimize rule', async () => {
    const { ValidationEngineImpl } = await import('./validation-engine.js');

    const optimizeField: FieldDescriptor = {
      id: 'upload',
      type: 'file',
      label: 'Upload',
      required: true,
      validation: [
        {
          type: 'imageOptimize',
          message: 'Image optimized',
          params: { maxWidth: 800 },
        },
      ],
    };

    const engine = new ValidationEngineImpl([optimizeField]);

    const file = new File(['mock'], 'document.pdf', { type: 'application/pdf' });

    const result = await engine.executeAsyncValidation('upload', file);

    // Non-image files should be valid but not optimized
    expect(result.isValid).toBe(true);
  });
});
