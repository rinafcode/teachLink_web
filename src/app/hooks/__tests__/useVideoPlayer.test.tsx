import { renderHook, act } from '@testing-library/react';
import { useVideoPlayer } from '../useVideoPlayer';
import { RefObject } from 'react';
import { vi } from 'vitest';

describe('useVideoPlayer maxRetries option', () => {
  // Mock a simple video element
  const createVideoMock = () => {
    const video = document.createElement('video') as HTMLVideoElement;
    video.play = vi.fn().mockRejectedValue(new Error('play failed'));
    video.src = 'test.mp4';
    return video;
  };

  const videoRef = { current: createVideoMock() } as RefObject<HTMLVideoElement>;

  it('should respect maxRetries option', () => {
    const { result } = renderHook(() => useVideoPlayer(videoRef, { maxRetries: 1 }));

    // Initial state
    expect(result.current.maxRetries).toBe(1);
    expect(result.current.retryCount).toBe(0);

    // First retry should work
    act(() => {
      result.current.retry();
    });
    expect(result.current.retryCount).toBe(1);

    // Second retry should not increase because maxRetries is 1
    act(() => {
      result.current.retry();
    });
    expect(result.current.retryCount).toBe(1);
  });
});
