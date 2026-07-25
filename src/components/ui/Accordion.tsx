'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccordionVariant = 'default' | 'bordered' | 'ghost';
export type AccordionSize = 'sm' | 'md' | 'lg';

/** Shape stored in the registry for each AccordionItem. */
interface AccordionItemEntry {
  id: string;
  /** Programmatically open or close this item. */
  setOpen: (open: boolean) => void;
}

/** Value exposed by AccordionContext to every descendant. */
interface AccordionContextValue {
  /** Currently open item ids. */
  openIds: Set<string>;
  /** Whether only one item may be open at a time. */
  exclusive: boolean;
  /** Variant forwarded to items. */
  variant: AccordionVariant;
  /** Size forwarded to items. */
  size: AccordionSize;
  /** Called by AccordionItem on mount to register itself. */
  register: (entry: AccordionItemEntry) => void;
  /** Called by AccordionItem on unmount to unregister itself. */
  unregister: (id: string) => void;
  /** Toggle the open state of an item. */
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error('Accordion sub-components must be used inside <Accordion>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// AccordionItem context (so Trigger and Content can find their shared id)
// ---------------------------------------------------------------------------

interface AccordionItemContextValue {
  itemId: string;
  triggerId: string;
  contentId: string;
  isOpen: boolean;
  toggle: () => void;
}

const AccordionItemContext = createContext<AccordionItemContextValue | undefined>(undefined);

function useAccordionItemContext(): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) {
    throw new Error('AccordionTrigger and AccordionContent must be used inside <AccordionItem>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Accordion (root)
// ---------------------------------------------------------------------------

export interface AccordionProps {
  children: React.ReactNode;
  /**
   * When `true` only one item can be open at a time.
   * @default false
   */
  exclusive?: boolean;
  /**
   * Ids of items that should be open on first render (uncontrolled).
   * Pass an empty array to start fully collapsed.
   */
  defaultOpenIds?: string[];
  /**
   * Controlled open ids. When provided the component becomes fully controlled
   * and `onOpenChange` must be used to update the value.
   */
  openIds?: string[];
  /** Called whenever the set of open ids changes (controlled mode). */
  onOpenChange?: (ids: string[]) => void;
  variant?: AccordionVariant;
  size?: AccordionSize;
  className?: string;
}

/**
 * Accordion root component.
 *
 * Maintains a **registration system** — each `AccordionItem` registers itself
 * on mount and unregisters on unmount, giving the root full awareness of all
 * items and enabling features like exclusive (single-open) mode and
 * programmatic control via `openIds` / `onOpenChange`.
 */
export function Accordion({
  children,
  exclusive = false,
  defaultOpenIds = [],
  openIds: controlledOpenIds,
  onOpenChange,
  variant = 'default',
  size = 'md',
  className,
}: AccordionProps) {
  const isControlled = controlledOpenIds !== undefined;

  // Registry: id → entry (kept in a ref so mutations don't trigger re-renders)
  const registryRef = useRef<Map<string, AccordionItemEntry>>(new Map());

  // Uncontrolled open state
  const [uncontrolledOpenIds, setUncontrolledOpenIds] = useState<Set<string>>(
    () => new Set(defaultOpenIds),
  );

  const openIds: Set<string> = useMemo(
    () => (isControlled ? new Set(controlledOpenIds) : uncontrolledOpenIds),
    [isControlled, controlledOpenIds, uncontrolledOpenIds],
  );

  const setOpenIds = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      if (isControlled) {
        // Derive next value and call the consumer's handler
        const next = updater(new Set(controlledOpenIds));
        onOpenChange?.(Array.from(next));
      } else {
        setUncontrolledOpenIds((prev) => {
          const next = updater(prev);
          onOpenChange?.(Array.from(next));
          return next;
        });
      }
    },
    [isControlled, controlledOpenIds, onOpenChange],
  );

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (exclusive) next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [exclusive, setOpenIds],
  );

  const register = useCallback((entry: AccordionItemEntry) => {
    registryRef.current.set(entry.id, entry);
  }, []);

  const unregister = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  const contextValue = useMemo<AccordionContextValue>(
    () => ({ openIds, exclusive, variant, size, register, unregister, toggle }),
    [openIds, exclusive, variant, size, register, unregister, toggle],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        className={cn('w-full', className)}
        // Expose the registry size as a data attribute (useful for testing / debugging)
        data-accordion-items={registryRef.current.size}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}
Accordion.displayName = 'Accordion';

// ---------------------------------------------------------------------------
// AccordionItem
// ---------------------------------------------------------------------------

export interface AccordionItemProps {
  children: React.ReactNode;
  /**
   * Stable identifier for this item.
   * Auto-generated via `useId` when omitted.
   */
  id?: string;
  /** Disable interaction for this item. */
  disabled?: boolean;
  className?: string;
}

/**
 * Registers itself with the parent `Accordion` on mount and unregisters on
 * unmount.  Provides its own context so `AccordionTrigger` and
 * `AccordionContent` can share the item id without prop-drilling.
 */
export function AccordionItem({
  children,
  id: externalId,
  disabled = false,
  className,
}: AccordionItemProps) {
  const { openIds, variant, register, unregister, toggle } = useAccordionContext();
  const autoId = useId();
  const itemId = externalId ?? autoId;

  const triggerId = `${itemId}-trigger`;
  const contentId = `${itemId}-content`;
  const isOpen = openIds.has(itemId);

  // Register / unregister with the root
  const handleToggle = useCallback(() => {
    if (!disabled) toggle(itemId);
  }, [disabled, itemId, toggle]);

  React.useEffect(() => {
    register({ id: itemId, setOpen: (open) => (open ? toggle(itemId) : toggle(itemId)) });
    return () => unregister(itemId);
    // register/unregister are stable refs — intentionally omit toggle to avoid
    // re-registering on every toggle call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, register, unregister]);

  const itemContextValue = useMemo<AccordionItemContextValue>(
    () => ({ itemId, triggerId, contentId, isOpen, toggle: handleToggle }),
    [itemId, triggerId, contentId, isOpen, handleToggle],
  );

  const variantClasses: Record<AccordionVariant, string> = {
    default: 'border-b border-gray-200 dark:border-gray-700',
    bordered: 'border border-gray-200 dark:border-gray-700 rounded-lg mb-2 overflow-hidden',
    ghost: '',
  };

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <div
        className={cn(variantClasses[variant], disabled && 'opacity-50', className)}
        data-accordion-item={itemId}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}
AccordionItem.displayName = 'AccordionItem';

// ---------------------------------------------------------------------------
// AccordionTrigger
// ---------------------------------------------------------------------------

export interface AccordionTriggerProps {
  children: React.ReactNode;
  /** Hide the default chevron icon. */
  hideIcon?: boolean;
  /** Replace the default chevron with a custom icon. */
  icon?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<AccordionSize, string> = {
  sm: 'py-2 text-sm',
  md: 'py-3 text-base',
  lg: 'py-4 text-lg',
};

export function AccordionTrigger({
  children,
  hideIcon = false,
  icon,
  className,
}: AccordionTriggerProps) {
  const { triggerId, contentId, isOpen, toggle } = useAccordionItemContext();
  const { size } = useAccordionContext();

  return (
    <button
      id={triggerId}
      type="button"
      aria-expanded={isOpen}
      aria-controls={contentId}
      onClick={toggle}
      className={cn(
        'flex w-full items-center justify-between px-4 font-medium text-gray-900',
        'transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-blue-500 dark:text-gray-100 dark:hover:bg-gray-800',
        sizeClasses[size],
        className,
      )}
    >
      <span>{children}</span>
      {!hideIcon && (
        <span
          aria-hidden="true"
          className={cn(
            'ml-2 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400',
            isOpen && 'rotate-180',
          )}
        >
          {icon ?? <ChevronDown size={18} />}
        </span>
      )}
    </button>
  );
}
AccordionTrigger.displayName = 'AccordionTrigger';

// ---------------------------------------------------------------------------
// AccordionContent
// ---------------------------------------------------------------------------

export interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const { triggerId, contentId, isOpen } = useAccordionItemContext();
  const { size } = useAccordionContext();

  const paddingClasses: Record<AccordionSize, string> = {
    sm: 'px-4 pb-2 text-sm',
    md: 'px-4 pb-4 text-sm',
    lg: 'px-4 pb-5 text-base',
  };

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!isOpen}
      className={cn(
        'text-gray-700 dark:text-gray-300',
        paddingClasses[size],
        !isOpen && 'hidden',
        className,
      )}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
    </div>
  );
}
AccordionContent.displayName = 'AccordionContent';
