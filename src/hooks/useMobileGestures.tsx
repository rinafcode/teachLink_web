import { useState, TouchEvent, useCallback } from 'react';
import { calculateSwipeDirection, calculateDistance } from '../utils/mobileUtils';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onTap?: () => void;
  swipeThreshold?: number;
}

export const useMobileGestures = (handlers: GestureHandlers) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const dist = calculateDistance(
        e.touches[0].clientX,
        e.touches[0].clientY,
        e.touches[1].clientX,
        e.touches[1].clientY,
      );
      setInitialPinchDistance(dist);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && touchStart) {
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const isTap =
          Math.abs(touchEnd.x - touchStart.x) < 10 && Math.abs(touchEnd.y - touchStart.y) < 10;

        if (isTap && handlers.onTap) {
          handlers.onTap();
        } else {
          const direction = calculateSwipeDirection(
            touchStart.x,
            touchStart.y,
            touchEnd.x,
            touchEnd.y,
            handlers.swipeThreshold || 50,
          );

          if (direction === 'LEFT' && handlers.onSwipeLeft) handlers.onSwipeLeft();
          if (direction === 'RIGHT' && handlers.onSwipeRight) handlers.onSwipeRight();
          if (direction === 'UP' && handlers.onSwipeUp) handlers.onSwipeUp();
          if (direction === 'DOWN' && handlers.onSwipeDown) handlers.onSwipeDown();
        }
      }
      setTouchStart(null);
      setInitialPinchDistance(null);
    },
    [touchStart, handlers],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance !== null) {
        const currentDistance = calculateDistance(
          e.touches[0].clientX,
          e.touches[0].clientY,
          e.touches[1].clientX,
          e.touches[1].clientY,
        );

        const pinchThreshold = 20;
        if (currentDistance - initialPinchDistance > pinchThreshold && handlers.onPinchOut) {
          handlers.onPinchOut();
          setInitialPinchDistance(currentDistance); // Reset to detect continuous pinch
        } else if (initialPinchDistance - currentDistance > pinchThreshold && handlers.onPinchIn) {
          handlers.onPinchIn();
          setInitialPinchDistance(currentDistance);
        }
      }
    },
    [initialPinchDistance, handlers],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
