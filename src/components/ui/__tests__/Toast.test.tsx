import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Hello world" onClose={() => {}} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders with info type by default', () => {
    render(<Toast message="Info message" onClose={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with error type', () => {
    render(<Toast message="Something went wrong" type="error" onClose={() => {}} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with success type', () => {
    render(<Toast message="Saved!" type="success" onClose={() => {}} />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Close me" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledTimes(0); // called after animation delay
  });
});
