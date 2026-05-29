import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';
import { useInternationalization } from '@/hooks/useInternationalization';

// Mock the internationalization hook
jest.mock('@/hooks/useInternationalization', () => ({
  useInternationalization: jest.fn(),
}));

describe('Footer Component', () => {
  beforeEach(() => {
    (useInternationalization as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders the brand name', () => {
    render(<Footer />);
    expect(screen.getByText('TeachLink')).toBeInTheDocument();
  });

  it('renders Grant Management section', () => {
    render(<Footer />);
    expect(screen.getByText('Grant Management')).toBeInTheDocument();
  });

  it('renders specific grant links', () => {
    render(<Footer />);
    expect(screen.getByText('Apply for Grants')).toBeInTheDocument();
    expect(screen.getByText('Active Grant Programs')).toBeInTheDocument();
    expect(screen.getByText('Application Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Grant FAQ')).toBeInTheDocument();
    expect(screen.getByText('Manage My Grants')).toBeInTheDocument();
  });

  it('has correct href attributes for grant links', () => {
    render(<Footer />);
    const applyLink = screen.getByText('Apply for Grants').closest('a');
    expect(applyLink).toHaveAttribute('href', '/grants/apply');

    const manageLink = screen.getByText('Manage My Grants').closest('a');
    expect(manageLink).toHaveAttribute('href', '/dashboard/grants');
  });

  it('renders platform links', () => {
    render(<Footer />);
    expect(screen.getByText('navigation.courses')).toBeInTheDocument();
    expect(screen.getByText('navigation.teach')).toBeInTheDocument();
    expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
  });
});
