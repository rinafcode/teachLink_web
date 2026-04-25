'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorReportingService } from '@/services/errorReporting';
import { UserFriendlyErrorDisplay } from './UserFriendlyErrorDisplay';

export type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
};

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolationId?: string;
  isolationLevel?: string;
};

export class ErrorBoundarySystem extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    errorReportingService.addBreadcrumb('errorBoundary', {
      isolationId: this.props.isolationId,
      isolationLevel: this.props.isolationLevel,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
    });
    // Hook for reporting system
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <UserFriendlyErrorDisplay
            error={this.state.error}
            title="Application Error"
            onRetry={this.resetError}
            showDetails={true}
            severity="error"
          />
        )
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
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
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
  options?: Omit<ErrorBoundaryProps, 'children'>,
) {
  const CustomErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
    <ErrorBoundary {...options}>{children}</ErrorBoundary>
  );

  CustomErrorBoundary.displayName = displayName;

  return CustomErrorBoundary;
}

export default ErrorBoundarySystem;
