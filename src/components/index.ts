/**
 * Canonical component barrel — all shared UI components are exported from src/components.
 * App-specific components in src/app/components should be migrated here over time.
 * Import from '@/components' rather than '@/app/components' for shared pieces.
 */

export * from './ui/Accordion';
export { Badge, badgeVariants } from './ui/Badge';
export type { BadgeProps } from './ui/Badge';
export { Button, buttonVariants } from './ui/Button';
export type { ButtonProps } from './ui/Button';
export { ButtonGroup } from './ui/ButtonGroup';
export type { ButtonGroupProps } from './ui/ButtonGroup';
export * from './ui/Modal';
export * from './ui/Toast';
export * from './ui/EmptyState';
export * from './ui/Quote';
export * from './shared/EnvGuard';
export * from './errors/ErrorBoundarySystem';
export { QRCodeComponent } from './QRCode';
export { ShareModal } from './ShareModal';
export * from './ui/Table';
export { BulkImporter } from './BulkImporter';
export type { BulkImporterProps, TargetFieldDef } from './BulkImporter';
export { Tooltip } from './ui/Tooltip';
export type { TooltipProps, TooltipPlacement } from './ui/Tooltip';
export * from './shared/ReleaseNotes';
