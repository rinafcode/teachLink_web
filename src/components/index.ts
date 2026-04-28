/**
 * Canonical component barrel — all shared UI components are exported from src/components.
 * App-specific components in src/app/components should be migrated here over time.
 * Import from '@/components' rather than '@/app/components' for shared pieces.
 */

export * from './ui/Modal';
export * from './ui/Toast';
export * from './ui/EmptyState';
export * from './shared/EnvGuard';
export * from './errors/ErrorBoundarySystem';
