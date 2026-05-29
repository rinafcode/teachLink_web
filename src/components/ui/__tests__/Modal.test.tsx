import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Modal } from '../Modal';
import '@testing-library/jest-dom';

// Mock the hooks to avoid testing their specific behaviors here
vi.mock('@/hooks/useAccessibility', () => ({
  useFocusTrap: () => ({ current: null }),
  useScreenReaderAnnouncement: () => vi.fn(),
}));

const ThrowErrorComponent = () => {
  throw new Error('Test child error');
};

describe('Modal component with Disaster Recovery', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    // Suppress console.error for expected React errors during testing
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children correctly when no error is thrown', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div data-testid="child-content">Normal Content</div>
      </Modal>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('catches errors in children using ErrorBoundary and prevents app crash', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Error Modal">
        <ThrowErrorComponent />
      </Modal>,
    );

    // ErrorBoundarySystem displays "Something went wrong." or "Application Error"
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>,
    );

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
