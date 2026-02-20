/**
 * Error Handling System - Central Export File
 * Provides easy access to all error handling utilities, components, and hooks
 */

// Error Utilities
export {
  ErrorType,
  type ErrorInfo,
  classifyError,
  isRetryable,
  getUserFriendlyMessage,
  getActionSuggestion,
  retryWithBackoff,
  formatErrorForLogging,
  TypedError,
} from '@/utils/errorUtils';

// Error Reporting Service
export { errorReportingService, type ErrorReport, type BreadcrumbEntry } from '@/services/errorReporting';

// Error Recovery Mechanism
export {
  errorRecoveryMechanism,
  useErrorRecovery,
  type RecoveryOptions,
  type RecoveryState,
} from '@/components/errors/ErrorRecoveryMechanism';

// Error Display Components
export {
  UserFriendlyErrorDisplay,
  MultipleErrorsDisplay,
  InlineError,
  ErrorToast,
  type ErrorDisplayProps,
  type MultipleErrorsDisplayProps,
  type InlineErrorProps,
  type ErrorToastProps,
} from '@/components/errors/UserFriendlyErrorDisplay';

// Error Boundary System
export {
  ErrorBoundarySystem,
  ErrorBoundary,
  withErrorBoundary,
  createErrorBoundary,
  type ErrorBoundaryProps,
} from '@/components/errors/ErrorBoundarySystem';

// Error Handling Hooks
export {
  useErrorHandling,
  useFormErrorHandling,
  useAsyncOperations,
  type UseErrorHandlingState,
  type UseErrorHandlingOptions,
} from '@/hooks/useErrorHandling';

// Re-export commonly used patterns
export { type ReactNode } from 'react';
