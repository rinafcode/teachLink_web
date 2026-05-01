import React from 'react';

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Mobile-first responsive grid system that seamlessly adapts from 320px to 4K
 */
export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = 'md',
  className = '',
  ...props
}: ResponsiveGridProps) {
  // Tailwind gap mappings
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  // Tailwind doesn't support dynamic string interpolation for grid-cols in purge/JIT,
  // so we map the expected values to their explicit utility classes.
  const getColClass = (breakpoint: string, cols?: number) => {
    if (!cols) return '';
    const prefix = breakpoint === 'mobile' ? '' : `${breakpoint}:`;
    return `${prefix}grid-cols-${cols}`;
  };

  const gridClasses = [
    'grid',
    getColClass('mobile', columns.mobile),
    getColClass('md', columns.tablet),
    getColClass('lg', columns.desktop),
    getColClass('xl', columns.large),
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
}