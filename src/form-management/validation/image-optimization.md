# Form Validation - Image Optimization

This module provides client-side image optimization and validation for form file uploads.

## Features

### Image Optimization (`optimizeImage`)

- **Client-side compression** using HTML5 Canvas
- **Resizing** with configurable max dimensions
- **Format conversion** support (JPEG, PNG, WebP)
- **Quality control** (0.0 to 1.0)
- **Aspect ratio preservation** option
- **SSR fallback** - returns original file in server environments

### Image Dimension Validation (`validateImageDimensions`)

- **Width constraints** (minWidth, maxWidth)
- **Height constraints** (minHeight, maxHeight)
- **Error messages** with actual vs expected dimensions
- **SSR fallback** - returns valid in server environments

## Usage

### Basic Image Validation

```typescript
import { ValidationEngineImpl } from './validation-engine.js';

const fieldDescriptor = {
  id: 'avatar',
  type: 'file',
  label: 'Avatar',
  required: true,
  validation: [
    {
      type: 'imageDimensions',
      message: 'Image must be between 100x100 and 800x600 pixels',
      params: {
        minWidth: 100,
        maxWidth: 800,
        minHeight: 100,
        maxHeight: 600,
      },
    },
  ],
};

const engine = new ValidationEngineImpl([fieldDescriptor]);
const result = await engine.executeAsyncValidation('avatar', file);
```

### Image Optimization

```typescript
import { optimizeImage, validateImageDimensions } from './image-optimizer.js';

// Optimize an image
const optimizedFile = await optimizeImage(file, {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8,
  format: 'image/webp',
  preserveAspectRatio: true,
});

// Validate dimensions
const validation = await validateImageDimensions(file, {
  minWidth: 100,
  minHeight: 100,
});
```

### Combined Validation and Optimization

```typescript
// Field with both dimension validation and optimization
const imageField = {
  id: 'profileImage',
  type: 'file',
  label: 'Profile Image',
  required: true,
  validation: [
    {
      type: 'imageDimensions',
      message: 'Image must be at least 200x200 pixels',
      params: { minWidth: 200, minHeight: 200 },
    },
    {
      type: 'imageOptimize',
      message: 'Image optimized',
      params: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
    },
  ],
};
```

## Performance Considerations

- Image processing happens asynchronously on the main thread
- Large images may cause UI blocking - consider showing a loading indicator
- WebP format provides the best compression ratio for modern browsers
- The optimized file replaces the original in form state automatically

## Browser Support

- Requires browser environment with Canvas support
- Falls back gracefully to original file in SSR/Node.js environments
- WebP format support varies by browser (fallback to JPEG/PNG recommended)