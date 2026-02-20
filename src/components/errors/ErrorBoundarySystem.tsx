'use client';

/**
 * Error Boundary System Component
 * Catches React component errors and provides graceful degradation
 */

import React, { ReactNode, Component, ErrorInfo, ReactElement } from 'react';
import { errorReportingService } from '@/services/errorReporting';
import { UserFriendlyErrorDisplay } from './UserFriendlyErrorDisplay';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  isolationLevel?: 'component' | 'section' | 'page';
  retryable?: boolean;
  isolationId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components
 */
export class ErrorBoundarySystem extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error information
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Report error
    errorReportingService.addBreadcrumb('errorBoundary', {
      isolationId: this.props.isolationId,
      isolationLevel: this.props.isolationLevel,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
    });

    // Send error report asynchronously
    errorReportingService
      .reportError(error, {
        isolationId: this.props.isolationId,
        isolationLevel: this.props.isolationLevel,
        componentStack: errorInfo.componentStack,
        errorCount: this.state.errorCount + 1,
      })
      .catch(console.error);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught:', error, errorInfo);
    }

    // Auto-reset errors after a delay for temporary failures
    this.scheduleReset();
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error boundary when children change
    if (prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private scheduleReset = (): void => {
    // Only auto-reset for certain error counts to prevent infinite loops
    if (this.state.errorCount > 3) {
      return;
    }

    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    // Reset after 30 seconds
    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 30000);
  };

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    errorReportingService.addBreadcrumb('errorBoundaryReset', {
      isolationId: this.props.isolationId,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return (this.props.fallback as any)(this.state.error, this.resetErrorBoundary);
        }
        return this.props.fallback;
      }

      // Use default error display
      return (
        <div
          className="p-4 border border-red-200 bg-red-50 rounded-lg"
          role="region"
          aria-label="Error occurred"
        >
          <UserFriendlyErrorDisplay
            error={this.state.error}
            title="Something went wrong"
            onRetry={this.resetErrorBoundary}
            onDismiss={this.resetErrorBoundary}
            showDetails={this.props.showDetails}
            severity="error"
          />

          {this.props.showDetails && this.state.errorInfo?.componentStack && (
            <details className="mt-4 text-xs text-gray-600 cursor-pointer">
              <summary>Component Stack</summary>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto text-xs">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          {this.state.errorCount > 1 && (
            <p className="text-xs text-gray-600 mt-3">
              Error occurred {this.state.errorCount} times
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for easy usage with functional components
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundarySystem {...props} />;
};

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Create a custom error boundary for a specific component
 */
export function createErrorBoundary(
  displayName: string,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const CustomErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
    <ErrorBoundary {...options}>{children}</ErrorBoundary>
  );

  CustomErrorBoundary.displayName = displayName;

  return CustomErrorBoundary;
}

export default ErrorBoundarySystem;
