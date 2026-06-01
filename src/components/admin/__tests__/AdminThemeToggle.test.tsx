import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme-provider';
import AdminThemeToggle from '../AdminThemeToggle';

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
  });

  it('renders all theme options (Light, Dark, System)', async () => {
    render(
      <ThemeProvider defaultTheme="system">
        <AdminThemeToggle />
      </ThemeProvider>,
    );

    const lightButton = await screen.findByRole('button', { name: /switch to light mode/i });
    const darkButton = await screen.findByRole('button', { name: /switch to dark mode/i });
    const systemButton = await screen.findByRole('button', { name: /switch to system mode/i });

    expect(lightButton).toBeInTheDocument();
    expect(darkButton).toBeInTheDocument();
    expect(systemButton).toBeInTheDocument();
  });

  it('switches between theme options when clicked', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <AdminThemeToggle />
      </ThemeProvider>,
    );

    const darkButton = await screen.findByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(darkButton);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
    expect(document.documentElement).not.toHaveClass('light');

    const lightButton = await screen.findByRole('button', { name: /switch to light mode/i });
    fireEvent.click(lightButton);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('light');
    });
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
