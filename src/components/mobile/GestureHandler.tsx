import React, { HTMLAttributes, useState, useEffect } from 'react';
import { useMobileGestures } from '../../hooks/useMobileGestures';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface GestureHandlerProps extends HTMLAttributes<HTMLDivElement> {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onTap?: () => void;
  swipeThreshold?: number;
  children: React.ReactNode;
}

type EventHandler = (...args: unknown[]) => unknown;

function composeHandlers(
  gestureHandler?: EventHandler,
  consumerHandler?: EventHandler,
): EventHandler | undefined {
  if (typeof gestureHandler !== 'function') return consumerHandler;
  if (typeof consumerHandler !== 'function') return gestureHandler;
  return (...args: unknown[]) => {
    gestureHandler(...args);
    consumerHandler(...args);
  };
}

function mergeGestureProps<G extends Record<string, unknown>>(
  gestureProps: G,
  consumerProps: HTMLAttributes<HTMLDivElement>,
): HTMLAttributes<HTMLDivElement> & G {
  const merged = {
    ...consumerProps,
    ...gestureProps,
  } as HTMLAttributes<HTMLDivElement> & G;

  (Object.keys(gestureProps) as Array<keyof G>).forEach((key) => {
    const gestureHandler = gestureProps[key];
    const consumerHandler = consumerProps[key as keyof HTMLAttributes<HTMLDivElement>];
    if (typeof gestureHandler === 'function' && typeof consumerHandler === 'function') {
      (merged as Record<string, unknown>)[key as string] = composeHandlers(
        gestureHandler as EventHandler,
        consumerHandler as EventHandler,
      );
    }
  });

  return merged;
}

export const GestureHandler: React.FC<GestureHandlerProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchIn,
  onPinchOut,
  onTap,
  swipeThreshold,
  children,
  ...props
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);

  useEffect(() => {
    // Detect iOS devices (iPhone, iPad, iPod) and iPadOS (MacIntel with touch)
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice =
        /iphone|ipad|ipod/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return isIOSDevice;
    };

    const isIOSBrowser = checkIOS();
    setIsIOS(isIOSBrowser);

    // Disable custom gestures by default on iOS to prevent conflicts with native swipe-to-go-back
    if (isIOSBrowser) {
      setGesturesEnabled(false);
    }
  }, []);

  const toggleGestures = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGesturesEnabled((prev) => !prev);
  };

  const activeGestures = gesturesEnabled
    ? {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        onPinchIn,
        onPinchOut,
        onTap,
        swipeThreshold,
      }
    : { swipeThreshold };

  const gestureProps = useMobileGestures(activeGestures);
  const mergedProps = mergeGestureProps(gestureProps, props);

  const touchActionStyle = gesturesEnabled ? 'pan-y' : 'auto';

  return (
    <div
      {...mergedProps}
      style={{ touchAction: touchActionStyle, position: 'relative', ...props.style }}
    >
      {isIOS && (
        <div className="absolute top-2 right-2 z-50 pointer-events-auto">
          <button
            onClick={toggleGestures}
            className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity border border-gray-600 flex items-center gap-2"
            title={gesturesEnabled ? 'Disable Custom Gestures' : 'Enable Custom Gestures'}
            type="button"
          >
            {gesturesEnabled ? (
              <ToggleRight size={16} className="text-green-400" />
            ) : (
              <ToggleLeft size={16} className="text-red-400" />
            )}
            {gesturesEnabled ? 'Gestures On' : 'Gestures Off'}
          </button>
        </div>
      )}
      {children}
    </div>
  );
};
