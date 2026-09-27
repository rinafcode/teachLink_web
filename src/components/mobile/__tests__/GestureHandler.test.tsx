import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps, TouchEvent } from 'react';
import { GestureHandler } from '../GestureHandler';

function renderHandler(props: Partial<ComponentProps<typeof GestureHandler>> = {}) {
  return render(
    <GestureHandler data-testid="gesture-root" {...props}>
      {props.children ?? 'Content'}
    </GestureHandler>,
  );
}

function getRoot() {
  return screen.getByTestId('gesture-root');
}

function swipe(startX: number, startY: number, endX: number, endY: number) {
  const root = getRoot();
  fireEvent.touchStart(root, { touches: [{ clientX: startX, clientY: startY }] });
  fireEvent.touchEnd(root, { changedTouches: [{ clientX: endX, clientY: endY }] });
}

function pinch(
  startTouches: Array<{ clientX: number; clientY: number }>,
  moveTouches: Array<{ clientX: number; clientY: number }>,
) {
  const root = getRoot();
  fireEvent.touchStart(root, { touches: startTouches });
  fireEvent.touchMove(root, { touches: moveTouches });
}

describe('GestureHandler', () => {
  describe('baseline gestures', () => {
    it('fires onSwipeLeft when horizontal movement exceeds the threshold', () => {
      const onSwipeLeft = vi.fn();
      renderHandler({ onSwipeLeft });

      swipe(200, 50, 100, 50);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('fires onSwipeRight when horizontal movement exceeds the threshold', () => {
      const onSwipeRight = vi.fn();
      renderHandler({ onSwipeRight });

      swipe(100, 50, 200, 50);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('fires onPinchOut when two-finger distance increases past the threshold', () => {
      const onPinchOut = vi.fn();
      renderHandler({ onPinchOut });

      pinch(
        [
          { clientX: 0, clientY: 0 },
          { clientX: 40, clientY: 0 },
        ],
        [
          { clientX: 0, clientY: 0 },
          { clientX: 80, clientY: 0 },
        ],
      );

      expect(onPinchOut).toHaveBeenCalledTimes(1);
    });

    it('fires onPinchIn when two-finger distance decreases past the threshold', () => {
      const onPinchIn = vi.fn();
      renderHandler({ onPinchIn });

      pinch(
        [
          { clientX: 0, clientY: 0 },
          { clientX: 80, clientY: 0 },
        ],
        [
          { clientX: 0, clientY: 0 },
          { clientX: 40, clientY: 0 },
        ],
      );

      expect(onPinchIn).toHaveBeenCalledTimes(1);
    });

    it('fires onTap when movement stays under 10px', () => {
      const onTap = vi.fn();
      const onSwipeLeft = vi.fn();
      renderHandler({ onTap, onSwipeLeft });

      swipe(100, 50, 102, 51);

      expect(onTap).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('overlapping consumer handlers', () => {
    it('calls both consumer onTouchStart and onSwipeLeft', () => {
      const onTouchStart = vi.fn();
      const onSwipeLeft = vi.fn();
      renderHandler({ onTouchStart, onSwipeLeft });

      swipe(200, 50, 100, 50);

      expect(onTouchStart).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('calls both consumer onTouchEnd and onSwipeRight', () => {
      const onTouchEnd = vi.fn();
      const onSwipeRight = vi.fn();
      renderHandler({ onTouchEnd, onSwipeRight });

      swipe(100, 50, 200, 50);

      expect(onTouchEnd).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('calls both consumer onTouchMove and onPinchOut', () => {
      const onTouchMove = vi.fn();
      const onPinchOut = vi.fn();
      renderHandler({ onTouchMove, onPinchOut });

      pinch(
        [
          { clientX: 0, clientY: 0 },
          { clientX: 40, clientY: 0 },
        ],
        [
          { clientX: 0, clientY: 0 },
          { clientX: 80, clientY: 0 },
        ],
      );

      expect(onTouchMove).toHaveBeenCalledTimes(1);
      expect(onPinchOut).toHaveBeenCalledTimes(1);
    });

    it('still detects a swipe when the consumer onTouchStart calls preventDefault', () => {
      const onTouchStart = vi.fn((event: TouchEvent) => {
        event.preventDefault();
      });
      const onSwipeLeft = vi.fn();
      renderHandler({ onTouchStart, onSwipeLeft });

      swipe(200, 50, 100, 50);

      expect(onTouchStart).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('non-event props', () => {
    it('applies className, data-testid, and merged style', () => {
      renderHandler({
        className: 'custom-class',
        style: { backgroundColor: 'red' },
      });

      const root = getRoot();
      expect(root).toHaveClass('custom-class');
      expect(root).toHaveAttribute('data-testid', 'gesture-root');
      const style = root.getAttribute('style') ?? '';
      expect(style).toMatch(/position:\s*relative/);
      expect(style).toMatch(/background-color:\s*red/);
    });
  });
});
