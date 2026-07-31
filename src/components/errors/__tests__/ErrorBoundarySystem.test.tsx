import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundarySystem } from '../ErrorBoundarySystem';

const ThrowError = () => {
  throw new Error('Test production stack trace leak');
};

describe('ErrorBoundarySystem production safety', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = (globalThis as any).spyOn
      ? (globalThis as any).spyOn(console, 'error').mockImplementation(() => {})
      : (console.error = () => {});
  });

  afterEach(() => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalEnv },
      writable: true,
    });
    if (consoleSpy && typeof consoleSpy.mockRestore === 'function') {
      consoleSpy.mockRestore();
    }
  });

  it('does not display error details or stack traces when NODE_ENV is production', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true,
    });

    render(
      <ErrorBoundarySystem>
        <ThrowError />
      </ErrorBoundarySystem>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText('Test production stack trace leak')).not.toBeInTheDocument();
  });

  it('displays error details when NODE_ENV is development', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true,
    });

    render(
      <ErrorBoundarySystem>
        <ThrowError />
      </ErrorBoundarySystem>
    );

    expect(screen.getByText('Test production stack trace leak')).toBeInTheDocument();
  });
});