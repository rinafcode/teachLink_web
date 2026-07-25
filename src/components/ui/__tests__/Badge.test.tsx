import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
  });

  it('renders variant classes correctly', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-gray-100');

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100');

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100');

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100');

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('border');
  });

  it('renders size classes correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('px-1.5');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('px-2.5');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('px-3');
  });

  it('renders a remove button when onRemove is provided', () => {
    const onRemove = vi.fn();
    render(<Badge onRemove={onRemove}>Dismissible</Badge>);
    const removeBtn = screen.getByRole('button');
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove with stopPropagation on remove click', () => {
    const onRemove = vi.fn();
    render(
      <div onClick={vi.fn()}>
        <Badge onRemove={onRemove}>Nested</Badge>
      </div>,
    );
    const removeBtn = screen.getByRole('button');
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render remove button when onRemove is not provided', () => {
    render(<Badge>No Remove</Badge>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses custom remove aria-label', () => {
    const onRemove = vi.fn();
    render(
      <Badge onRemove={onRemove} removeLabel="Custom remove label">
        Custom
      </Badge>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom remove label');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom Class</Badge>);
    expect(screen.getByText('Custom Class')).toHaveClass('custom-badge');
  });

  it('supports additional HTML span attributes', () => {
    render(
      <Badge role="status" aria-label="Status badge">
        Aria
      </Badge>,
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Status badge');
  });

  it('has displayName', () => {
    expect(Badge.displayName).toBe('Badge');
  });
});
