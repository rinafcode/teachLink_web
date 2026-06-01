'use client';

/**
 * Tooltip Component
 * Accessible, reusable tooltip with anomaly detection integration.
 * Follows WAI-ARIA tooltip pattern (role="tooltip", aria-describedby).
 */

import React, { useState, useRef, useId, useCallback } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** The content shown inside the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** Placement relative to the trigger */
  placement?: TooltipPlacement;
  /** Delay in ms before showing (default 200) */
  delayMs?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Whether the tooltip should allow pointer events for interactive content */
  interactive?: boolean;
  /** Optional extra class for the tooltip bubble */
  className?: string;
  /** Optional zoom scale for the tooltip bubble (1 = normal size) */
  zoomScale?: number;
  /** Called when an anomaly is detected (e.g. rapid open/close) */
  onAnomaly?: (type: string) => void;
}

const PLACEMENT_CLASSES: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const TRANSFORM_ORIGINS: Record<TooltipPlacement, string> = {
  top: 'center bottom',
  bottom: 'center top',
  left: 'right center',
  right: 'left center',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delayMs = 200,
  disabled = false,
  interactive = false,
  className = '',
  zoomScale = 1,
  onAnomaly,
}) => {
  const [visible, setVisible] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openCountRef = useRef(0);
  const windowStartRef = useRef<number>(Date.now());

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hide = useCallback(
    (tooltipHovered = isTooltipHovered) => {
      clearTimer();
      if (interactive) {
        timerRef.current = setTimeout(() => {
          if (!tooltipHovered) {
            setVisible(false);
          }
        }, 100);
      } else {
        setVisible(false);
      }
    },
    [interactive, isTooltipHovered],
  );

  const handleTooltipEnter = useCallback(() => {
    if (!interactive) return;
    clearTimer();
    setIsTooltipHovered(true);
    setVisible(true);
  }, [interactive]);

  const handleTooltipLeave = useCallback(() => {
    if (!interactive) return;
    setIsTooltipHovered(false);
    hide(false);
  }, [interactive, hide]);

  /** Anomaly detection: flag if tooltip opens >5 times in 3 seconds */
  const trackOpen = useCallback(() => {
    const now = Date.now();
    if (now - windowStartRef.current > 3000) {
      openCountRef.current = 0;
      windowStartRef.current = now;
    }
    openCountRef.current += 1;
    if (openCountRef.current > 5) {
      onAnomaly?.('rapid-toggle');
      openCountRef.current = 0;
      windowStartRef.current = now;
    }
  }, [onAnomaly]);

  const show = useCallback(() => {
    if (disabled) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setVisible(true);
      trackOpen();
    }, delayMs);
  }, [disabled, delayMs, trackOpen]);

  const child = React.Children.only(children);
  const normalizedZoom = Math.max(0.5, Math.min(3, zoomScale ?? 1));
  const tooltipStyle = {
    transform: normalizedZoom === 1 ? undefined : `scale(${normalizedZoom})`,
    transformOrigin: TRANSFORM_ORIGINS[placement],
  };

  const tooltipClasses = [
    interactive
      ? 'pointer-events-auto whitespace-normal max-w-[28rem]'
      : 'pointer-events-none whitespace-nowrap',
    'absolute z-50 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700',
    PLACEMENT_CLASSES[placement],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className="relative inline-flex">
      {React.cloneElement(child, {
        'aria-describedby': visible ? tooltipId : undefined,
        onMouseEnter: (e: React.MouseEvent) => {
          show();
          child.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          hide();
          child.props.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          show();
          child.props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          hide();
          child.props.onBlur?.(e);
        },
      })}

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          style={tooltipStyle}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
          onFocus={handleTooltipEnter}
          onBlur={handleTooltipLeave}
          className={tooltipClasses}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
