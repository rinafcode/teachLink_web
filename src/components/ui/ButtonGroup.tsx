'use client';

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  Children,
  cloneElement,
  isValidElement,
} from 'react';
import { cn } from '@/lib/utils';

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  'aria-label'?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  className,
  'aria-label': ariaLabel = 'Button group',
}: ButtonGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const items = Children.toArray(children).filter(isValidElement);
  const itemCount = items.length;
  const isHorizontal = orientation === 'horizontal';
  const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
  const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const buttons = container.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    buttons.forEach((btn, i) => {
      btn.tabIndex = i === focusIndex ? 0 : -1;
    });
  }, [focusIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const buttons = container.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      let currentIndex = Array.from(buttons).findIndex((btn) => btn.tabIndex === 0);
      if (currentIndex === -1) currentIndex = 0;

      let newIndex = currentIndex;

      if (e.key === nextKey) {
        e.preventDefault();
        newIndex = (currentIndex + 1) % buttons.length;
      } else if (e.key === prevKey) {
        e.preventDefault();
        newIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = buttons.length - 1;
      }

      if (newIndex !== currentIndex) {
        buttons[currentIndex].tabIndex = -1;
        buttons[newIndex].tabIndex = 0;
        buttons[newIndex].focus();
        setFocusIndex(newIndex);
      }
    },
    [nextKey, prevKey],
  );

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
            tabIndex: index === 0 ? 0 : -1,
          });
        }
        return child;
      })}
    </div>
  );
}
