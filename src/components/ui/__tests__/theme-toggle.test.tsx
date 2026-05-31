import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme-provider';
import { errorReportingService } from '@/services/errorReporting';
import { ThemeToggle } from '../theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    document.documentElement.classList.remove('light', 'dark');
    window.localStorage.clear();
    errorReportingService.clearBreadcrumbs();
  });

  it('switches from light to dark mode when clicked', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const toggle = await screen.findByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
    expect(document.documentElement).not.toHaveClass('light');
  });

  it('renders an accessible fallback when theme context is unavailable', async () => {
    const preventExpectedBoundaryError = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', preventExpectedBoundaryError);

    render(<ThemeToggle />);

    const fallback = await screen.findByRole('button', { name: /theme toggle unavailable/i });

    window.removeEventListener('error', preventExpectedBoundaryError);
    expect(fallback).toBeDisabled();
    expect(fallback).toHaveAttribute('title', 'Theme toggle unavailable');
    expect(errorReportingService.getBreadcrumbs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'errorBoundary',
          details: expect.objectContaining({
            isolationId: 'theme-toggle',
            isolationLevel: 'component',
          }),
        }),
      ]),
    );
  });
});
