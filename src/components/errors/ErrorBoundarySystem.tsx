'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorReportingService } from '@/services/errorReporting';
import { UserFriendlyErrorDisplay } from './UserFriendlyErrorDisplay';

export type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  errorCount?: number;
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
    this.setState({
      hasError: true,
      error,
      errorInfo,
      errorCount: (this.state.errorCount ?? 0) + 1,
    });

    // Report breadcrumb if service available
    if (typeof errorReportingService?.addBreadcrumb === 'function') {
      errorReportingService.addBreadcrumb('errorBoundary', {
        isolationId: this.props.isolationId,
        isolationLevel: this.props.isolationLevel,
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
      });
    }

    // Hook for reporting system
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
          <>
            <div style={{ padding: '20px' }}>
              <h2>Something went wrong.</h2>
              <p>{this.state.error?.message}</p>

              <button onClick={this.resetError}>Try Again</button>
            </div>
            <UserFriendlyErrorDisplay
              error={this.state.error}
              title="Application Error"
              onRetry={this.resetError}
              showDetails={true}
              severity="error"
            />
          </>
        )
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundarySystem {...props} />;
};

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
