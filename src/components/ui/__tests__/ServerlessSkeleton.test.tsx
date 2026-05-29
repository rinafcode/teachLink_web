import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServerlessPageSkeleton } from '../ServerlessSkeleton';
import { Skeleton } from '../Skeleton';

describe('ServerlessPageSkeleton', () => {
  it('renders an accessible server streaming status region', () => {
    render(<ServerlessPageSkeleton variant="dashboard" label="Loading dashboard" />);

    const region = screen.getByRole('status', { name: /loading dashboard/i });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading dashboard')).toHaveClass('sr-only');
  });

  it('renders the search skeleton layout with hidden decorative placeholders', () => {
    render(<ServerlessPageSkeleton variant="search" label="Loading search results" />);

    expect(screen.getByRole('status', { name: /loading search results/i })).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(10);
  });
});

describe('Skeleton', () => {
  it('does not require client-side state to render placeholder dimensions', () => {
    render(<Skeleton width={48} height={48} variant="circle" animation="none" />);

    const placeholder = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(placeholder).toHaveClass('rounded-full');
    expect(placeholder.style.width).toBe('48px');
    expect(placeholder.style.height).toBe('48px');
  });
});
