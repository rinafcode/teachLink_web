# Form Validation - Image Optimization

This module provides client-side image optimization, dimension validation, and task queue management for form file uploads.

## Features

### Image Optimization (`optimizeImage`)

- **Client-side compression** using HTML5 Canvas
- **Resizing** with configurable max dimensions
- **Format conversion** support (JPEG, PNG, WebP)
- **Quality control** (0.0 to 1.0)
- **Aspect ratio preservation** option
- **SSR fallback** - returns original file in server environments
- **Progress Tracking** - optional `onProgress` callback to track FileReader, Image loading, and Canvas compression progress.

### Image Dimension Validation (`validateImageDimensions`)

- **Width constraints** (minWidth, maxWidth)
- **Height constraints** (minHeight, maxHeight)
- **Error messages** with actual vs expected dimensions
- **SSR fallback** - returns valid in server environments

### Task Management (`ImageOptimizationTaskManager`)

- **Concurrency control** - limit the number of active optimization tasks running in parallel.
- **Queueing mechanism** - tasks are executed in FIFO order.
- **Cancellation support** - cancel specific pending/processing tasks, or abort all active tasks.
- **State monitoring** - subscribe to status/progress transitions.
- **Promise API** - easily await task outcomes.

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
  onProgress: (progress) => {
    console.log(`Optimization progress: ${progress}%`);
  },
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

### Task Manager Usage

```typescript
import { ImageOptimizationTaskManager } from './image-optimization-task-manager.js';

// Instantiate with max 2 concurrent operations
const manager = new ImageOptimizationTaskManager({ maxConcurrentTasks: 2 });

// Subscribe to task updates
const unsubscribe = manager.subscribe((task, state) => {
  console.log(`Task ${task.id} status: ${task.status}, progress: ${task.progress}%`);
  console.log(`Queue state - Active: ${state.activeCount}, Pending: ${state.pendingCount}`);
});

// Enqueue image files
const taskId1 = manager.enqueue(file1, { maxWidth: 800 });
const taskId2 = manager.enqueue(file2, { maxWidth: 1024 });

// Await completion of a specific task
try {
  const optimizedFile = await manager.waitForTask(taskId1);
  // Do something with optimized file
} catch (error) {
  console.error('Task failed or cancelled:', error);
}

// Cancel a task if needed
manager.cancel(taskId2);

// Unsubscribe when done
unsubscribe();
```

## Performance Considerations

- Image processing happens asynchronously on the main thread
- Concurrency limit in `ImageOptimizationTaskManager` prevents freezing the browser/UI during batch uploads
- WebP format provides the best compression ratio for modern browsers
- The optimized file replaces the original in form state automatically

## Browser Support

- Requires browser environment with Canvas support
- Falls back gracefully to original file in SSR/Node.js environments
- WebP format support varies by browser (fallback to JPEG/PNG recommended)
