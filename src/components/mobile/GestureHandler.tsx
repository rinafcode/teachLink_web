import React, { HTMLAttributes } from 'react';
import { useMobileGestures } from '../../hooks/useMobileGestures';

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

export const GestureHandler: React.FC<GestureHandlerProps> = ({
  onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
  onPinchIn, onPinchOut, onTap, swipeThreshold,
  children, ...props
}) => {
  const gestureProps = useMobileGestures({
    onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
    onPinchIn, onPinchOut, onTap, swipeThreshold
  });

  return (
    <div {...gestureProps} {...props} style={{ touchAction: 'pan-y', ...props.style }}>
      {children}
    </div>
  );
};
