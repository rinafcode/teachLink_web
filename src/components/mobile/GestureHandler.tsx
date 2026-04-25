import React, { HTMLAttributes, useState, useEffect } from 'react';
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
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
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
    setGesturesEnabled(prev => !prev);
  };

  const activeGestures = gesturesEnabled ? {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchIn,
    onPinchOut,
    onTap,
    swipeThreshold,
  } : { swipeThreshold };

  const gestureProps = useMobileGestures(activeGestures);

  const touchActionStyle = gesturesEnabled ? 'pan-y' : 'auto';

  return (
    <div {...gestureProps} {...props} style={{ touchAction: touchActionStyle, position: 'relative', ...props.style }}>
      {isIOS && (
        <div className="absolute top-2 right-2 z-50 pointer-events-auto">
          <button
            onClick={toggleGestures}
            className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity border border-gray-600 flex items-center gap-2"
            title={gesturesEnabled ? "Disable Custom Gestures" : "Enable Custom Gestures"}
            type="button"
          >
            <div className={`w-2 h-2 rounded-full ${gesturesEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {gesturesEnabled ? "Gestures On" : "Gestures Off"}
          </button>
        </div>
      )}
      {children}
    </div>
  );
};
