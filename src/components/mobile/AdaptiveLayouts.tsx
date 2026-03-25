import React, { ReactNode, useEffect, useState } from 'react';
import { isMobileDevice } from '../../utils/mobileUtils';

interface AdaptiveLayoutProps {
  mobileView: ReactNode;
  desktopView: ReactNode;
  breakpoint?: number;
}

export const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({ 
  mobileView, 
  desktopView, 
  breakpoint = 768 
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(true); // Default to mobile for mobile-first approach

  useEffect(() => {
    const checkIsMobile = () => {
      // Use both utility and explicit window width for precise responsive switching
      const mobileByWidth = window.innerWidth <= breakpoint;
      setIsMobile(mobileByWidth || isMobileDevice());
    };

    checkIsMobile(); // Initial check
    
    // Performance optimization: debounce resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkIsMobile, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return <>{isMobile ? mobileView : desktopView}</>;
};

// Also export a container that changes layout direction, padding, etc., based on sizing
export const AdaptiveContainer: React.FC<{children: React.ReactNode; className?: string}> = ({
  children,
  className = ''
}) => {
  // Mobile-first container: stacked by default, becomes flex-row on md screens
  return (
    <div className={`flex flex-col md:flex-row w-full p-4 md:p-8 gap-4 md:gap-8 ${className}`}>
      {children}
    </div>
  );
};
