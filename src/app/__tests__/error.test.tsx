import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../error';

const mockReportError = vi.fn();
const mockAddBreadcrumb = vi.fn();

vi.mock('@/services/errorReporting', () => ({
  errorReportingService: {
    reportError: (...args: any[]) => mockReportError(...args),
    addBreadcrumb: (...args: any[]) => mockAddBreadcrumb(...args),
  },
}));

describe('ErrorBoundary', () => {
  it('calls reportError when an error is caught', () => {
    const testError = new Error('Test error');
    const reset = vi.fn();

    render(<ErrorBoundary error={testError} reset={reset} />);

    expect(mockReportError).toHaveBeenCalledWith(testError, {
      errorInfo: { componentStack: '' },
    });
  });

  it('calls addBreadcrumb when an error is caught', () => {
    const testError = new Error('Test error');
    const reset = vi.fn();

    render(<ErrorBoundary error={testError} reset={reset} />);

    expect(mockAddBreadcrumb).toHaveBeenCalledWith('error.tsx', {
      errorMessage: 'Test error',
      digest: undefined,
    });
  });

  it('passes digest as metadata when available', () => {
    const testError = new Error('Test error');
    (testError as any).digest = 'abc123';
    const reset = vi.fn();

    render(<ErrorBoundary error={testError} reset={reset} />);

    expect(mockReportError).toHaveBeenCalledWith(testError, {
      errorInfo: { componentStack: '' },
      digest: 'abc123',
    });
  });
});
