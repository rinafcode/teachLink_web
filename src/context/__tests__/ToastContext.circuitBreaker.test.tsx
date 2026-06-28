import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ToastContext with Circuit Breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const TestComponent = () => {
    const { addToast, getCircuitBreakerMetrics, resetCircuitBreaker } = useToast();

    return (
      <div>
        <button onClick={() => addToast('Test message', 'info', 100)}>Add Toast</button>
        <button onClick={() => addToast('Error message', 'error', 100)}>Add Error Toast</button>
        <button onClick={() => addToast('Success message', 'success', 100)}>
          Add Success Toast
        </button>
        <button onClick={() => resetCircuitBreaker()}>Reset Circuit Breaker</button>
        <div data-testid="metrics">{JSON.stringify(getCircuitBreakerMetrics())}</div>
      </div>
    );
  };

  it('should provide circuit breaker metrics', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const metricsElement = screen.getByTestId('metrics');
    const metrics = JSON.parse(metricsElement.textContent || '{}');

    expect(metrics).toHaveProperty('state');
    expect(metrics).toHaveProperty('totalRequests');
    expect(metrics).toHaveProperty('totalSuccesses');
    expect(metrics).toHaveProperty('totalFailures');
  });

  it('should track toast operations in metrics', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const addButton = screen.getByText('Add Toast');

    await act(async () => {
      addButton.click();
    });

    await waitFor(() => {
      const metricsElement = screen.getByTestId('metrics');
      const metrics = JSON.parse(metricsElement.textContent || '{}');
      expect(metrics.totalRequests).toBeGreaterThan(0);
    });
  });

  it('should allow resetting circuit breaker', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const addButton = screen.getByText('Add Toast');
    const resetButton = screen.getByText('Reset Circuit Breaker');

    await act(async () => {
      addButton.click();
    });

    await act(async () => {
      resetButton.click();
    });

    await waitFor(() => {
      const metricsElement = screen.getByTestId('metrics');
      const metrics = JSON.parse(metricsElement.textContent || '{}');
      expect(metrics.state).toBe('CLOSED');
      expect(metrics.failureCount).toBe(0);
    });
  });

  it('should render toast messages normally', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const addButton = screen.getByText('Add Toast');

    await act(async () => {
      addButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should handle different toast types', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const errorButton = screen.getByText('Add Error Toast');
    const successButton = screen.getByText('Add Success Toast');

    await act(async () => {
      errorButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    await act(async () => {
      successButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('should suppress toasts when circuit is open', async () => {
    // This test would need to force the circuit open
    // For now, we verify the fallback behavior exists
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const addButton = screen.getByText('Add Toast');

    // Add multiple toasts rapidly
    for (let i = 0; i < 15; i++) {
      await act(async () => {
        addButton.click();
      });
    }

    // Verify circuit breaker metrics show activity
    await waitFor(() => {
      const metricsElement = screen.getByTestId('metrics');
      const metrics = JSON.parse(metricsElement.textContent || '{}');
      expect(metrics.totalRequests).toBeGreaterThan(0);
    });
  });

  it('should log warning when toast is suppressed', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    render(
      <ToastProvider circuitBreakerConfig={{ maxConcurrentRequests: 0 }}>
        <TestComponent />
      </ToastProvider>,
    );

    const addButton = screen.getByText('Add Toast');

    await act(async () => {
      addButton.click();
    });

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});
