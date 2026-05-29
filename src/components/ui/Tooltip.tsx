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
  /** Optional extra class for the tooltip bubble */
  className?: string;
  /** Called when an anomaly is detected (e.g. rapid open/close) */
  onAnomaly?: (type: string) => void;
}

const PLACEMENT_CLASSES: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delayMs = 200,
  disabled = false,
  className = '',
  onAnomaly,
}) => {
  const [visible, setVisible] = useState(false);
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

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, []);

  const child = React.Children.only(children);

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
          className={[
            'pointer-events-none absolute z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700',
            PLACEMENT_CLASSES[placement],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
