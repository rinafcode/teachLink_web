export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
};

export const calculateSwipeDirection = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold = 50,
): 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null => {
  const diffX = endX - startX;
  const diffY = endY - startY;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (Math.abs(diffX) > threshold) {
      return diffX > 0 ? 'RIGHT' : 'LEFT';
    }
  } else {
    // Vertical swipe
    if (Math.abs(diffY) > threshold) {
      return diffY > 0 ? 'DOWN' : 'UP';
    }
  }
  return null;
};

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
