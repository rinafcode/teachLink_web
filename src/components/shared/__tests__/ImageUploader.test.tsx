import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import ImageUploader from '../ImageUploader';

describe('ImageUploader', () => {
  let originalCreateElement: typeof document.createElement;

  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string, options?: ElementCreationOptions) => {
        if (tagName === 'video') {
          const video = originalCreateElement('video');
          Object.defineProperty(video, 'duration', { value: 10 });
          Object.defineProperty(video, 'videoWidth', { value: 640 });
          Object.defineProperty(video, 'videoHeight', { value: 480 });

          // Simulate video load and seek events automatically
          setTimeout(() => {
            if (video.onloadeddata) (video.onloadeddata as Function)();
            setTimeout(() => {
              if (video.onseeked) (video.onseeked as Function)();
            }, 0);
          }, 0);
          return video;
        }

        if (tagName === 'canvas') {
          const canvas = originalCreateElement('canvas');
          canvas.getContext = vi.fn(
            () =>
              ({
                drawImage: vi.fn(),
              } as any),
          );
          canvas.toBlob = vi.fn((callback) => {
            callback(new Blob(['mock-image-data'], { type: 'image/jpeg' }));
          });
          return canvas;
        }
        return originalCreateElement(tagName, options);
      },
    );
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<ImageUploader onImageSelect={vi.fn()} />);
    expect(screen.getByText('Upload New Picture')).toBeInTheDocument();
  });

  it('handles image upload correctly without video extraction', async () => {
    const onImageSelect = vi.fn();
    const user = userEvent.setup();
    render(<ImageUploader onImageSelect={onImageSelect} />);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(onImageSelect).toHaveBeenCalledWith(file);
  });

  it('extracts frame when video is uploaded', async () => {
    const onImageSelect = vi.fn();
    const user = userEvent.setup();
    render(<ImageUploader onImageSelect={onImageSelect} />);

    const file = new File(['video-data'], 'video.mp4', { type: 'video/mp4' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(onImageSelect).toHaveBeenCalled();
    });

    const selectedFile = onImageSelect.mock.calls[0][0];
    expect(selectedFile.name).toBe('video.jpg');
    expect(selectedFile.type).toBe('image/jpeg');
  });
});
