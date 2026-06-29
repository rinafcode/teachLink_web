import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme-provider';
import { errorReportingService } from '@/services/errorReporting';
import AdminThemeToggle from '../AdminThemeToggle';
import { ThemeContext } from '@/contexts/ThemeContext';

describe('AdminThemeToggle', () => {
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

  it('switches between theme preferences (light, dark, system)', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <AdminThemeToggle />
      </ThemeProvider>,
    );

    // Initial check (should have active status or class depending on selection)
    const darkBtn = await screen.findByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(darkBtn);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  it('renders an accessible visual fallback when context is missing', async () => {
    const preventExpectedBoundaryError = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', preventExpectedBoundaryError);

    render(<AdminThemeToggle />);

    const fallbackContainer = await screen.findByLabelText(
      'Admin theme toggle temporarily unavailable',
    );
    expect(fallbackContainer).toBeInTheDocument();

    const fallbackButtons = screen.getAllByRole('button', { name: /mode toggle unavailable/i });
    expect(fallbackButtons).toHaveLength(3);
    fallbackButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    window.removeEventListener('error', preventExpectedBoundaryError);

    expect(errorReportingService.getBreadcrumbs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'errorBoundary',
          details: expect.objectContaining({
            isolationId: 'admin-theme-toggle',
            isolationLevel: 'component',
          }),
        }),
      ]),
    );
  });

  it('safely catches and logs errors inside event handler without crashing', async () => {
    const spyReport = vi.spyOn(errorReportingService, 'reportError').mockResolvedValue({} as any);

    const ThrowingProvider = ({ children }: { children: React.ReactNode }) => {
      const mockValue = {
        theme: 'light' as const,
        resolvedTheme: 'light' as const,
        setTheme: () => {
          throw new Error('Theme change failed');
        },
      };

      return <ThemeContext.Provider value={mockValue}>{children}</ThemeContext.Provider>;
    };

    render(
      <ThrowingProvider>
        <AdminThemeToggle />
      </ThrowingProvider>,
    );

    const darkBtn = await screen.findByRole('button', { name: /switch to dark mode/i });

    expect(() => fireEvent.click(darkBtn)).not.toThrow();

    expect(spyReport).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'AdminThemeToggle',
        action: 'handleSelectTheme',
        selectedTheme: 'dark',
      }),
    );

    spyReport.mockRestore();
  });
});
