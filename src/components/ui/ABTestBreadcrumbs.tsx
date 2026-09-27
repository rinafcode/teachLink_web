import React from 'react';
import { Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem } from './Breadcrumbs';
import { useABTest } from '@/hooks/useABTest';

export interface ABTestBreadcrumbsProps extends BreadcrumbsProps {
  experimentId?: string;
}

const VARIANT_CLASSES = {
  standard: {
    container: 'text-sm gap-1',
    item: 'px-2 py-1',
  },
  compact: {
    container: 'text-xs gap-0.5',
    item: 'px-1.5 py-0.5',
  },
  minimal: {
    container: 'text-sm gap-1.5',
    item: 'px-2 py-0.5',
  },
};

export function ABTestBreadcrumbs({
  experimentId = 'breadcrumbs_layout',
  className = '',
  items,
  ...props
}: ABTestBreadcrumbsProps) {
  const { variant, trackExposure } = useABTest({
    experimentId,
    variants: [
      { id: 'standard', label: 'Standard Breadcrumbs', weight: 50 },
      { id: 'compact', label: 'Compact Breadcrumbs', weight: 30 },
      { id: 'minimal', label: 'Minimal Breadcrumbs', weight: 20 },
    ],
  });

  const variantClasses = VARIANT_CLASSES[variant.id as keyof typeof VARIANT_CLASSES] || VARIANT_CLASSES.standard;

  const enhancedItems = items.map((item) => ({
    ...item,
    className: [item.className, variantClasses.item].filter(Boolean).join(' '),
  }));

  const exposureTracked = React.useRef(false);

  React.useEffect(() => {
    if (!exposureTracked.current) {
      trackExposure();
      exposureTracked.current = true;
    }
  }, [trackExposure]);

  return (
    <Breadcrumbs
      {...props}
      items={enhancedItems}
      className={`${variantClasses.container} ${className}`}
    />
  );
}

ABTestBreadcrumbs.displayName = 'ABTestBreadcrumbs';
