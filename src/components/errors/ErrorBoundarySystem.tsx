'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

export class ErrorBoundarySystem extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error);
    console.error('[ErrorInfo]', errorInfo);

    // Hook for reporting system (we’ll implement next)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '20px' }}>
            <h2>Something went wrong.</h2>
            <p>{this.state.error?.message}</p>

            <button onClick={this.resetError}>
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}