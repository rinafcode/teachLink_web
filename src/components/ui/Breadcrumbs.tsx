/**
 * Breadcrumbs Component
 * Material Design breadcrumb navigation component
 *
 * Features:
 * - Material Design 3 styling
 * - Accessible navigation with ARIA labels
 * - Responsive design with mobile overflow handling
 * - Dark mode support
 * - Customizable separators
 * - Support for icons
 * - Keyboard navigation
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** URL to navigate to (optional for current page) */
  href?: string;
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Whether this is the current page */
  current?: boolean;
  /** Optional click handler (for custom navigation) */
  onClick?: (e: React.MouseEvent) => void;
}

export interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator component (defaults to ChevronRight) */
  separator?: React.ReactNode;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Maximum items to show before collapsing (0 = no limit) */
  maxItems?: number;
  /** Custom className for the nav element */
  className?: string;
  /** Aria label for the navigation */
  ariaLabel?: string;
}

/**
 * Material Design Breadcrumbs Component
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Analytics', current: true }
 *   ]}
 * />
 * ```
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = <ChevronRight className="w-4 h-4" aria-hidden="true" />,
  showHomeIcon = false,
  maxItems = 0,
  className = '',
  ariaLabel = 'Breadcrumb navigation',
}) => {
  // Handle collapsed breadcrumbs if maxItems is set
  const displayItems = React.useMemo(() => {
    if (maxItems === 0 || items.length <= maxItems) {
      return items;
    }

    // Always show first and last items, collapse middle
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));

    return [firstItem, { label: '...', href: undefined, current: false }, ...lastItems];
  }, [items, maxItems]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={`breadcrumbs ${className}`} role="navigation">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCollapsed = item.label === '...';

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {/* Breadcrumb Item */}
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-md
                    text-gray-600 dark:text-gray-400
                    hover:text-gray-900 dark:hover:text-gray-100
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    transition-colors duration-200
                    ${isCollapsed ? 'cursor-default pointer-events-none' : ''}
                  `}
                  aria-current={item.current ? 'page' : undefined}
                  onClick={item.onClick}
                >
                  {index === 0 && showHomeIcon && <Home className="w-4 h-4" aria-hidden="true" />}
                  {item.icon && <span className="inline-flex">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-md
                    ${
                      item.current
                        ? 'text-gray-900 dark:text-gray-100 font-semibold'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {index === 0 && showHomeIcon && <Home className="w-4 h-4" aria-hidden="true" />}
                  {item.icon && <span className="inline-flex">{item.icon}</span>}
                  <span className={item.current ? 'font-semibold' : 'font-medium'}>
                    {item.label}
                  </span>
                </span>
              )}

              {/* Separator */}
              {!isLast && (
                <span
                  className="text-gray-400 dark:text-gray-600 flex items-center"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Animated Breadcrumbs with fade-in effect
 */
export const AnimatedBreadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Breadcrumbs {...props} />
    </motion.div>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';
AnimatedBreadcrumbs.displayName = 'AnimatedBreadcrumbs';
