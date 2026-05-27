import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigation } from '../MobileNavigation';

// Mock framer-motion to avoid animation timing issues in test
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('MobileNavigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items with proper roles', () => {
    render(<MobileNavigation />);

    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(nav).toBeInTheDocument();

    const tablist = screen.getByRole('tablist', { name: /navigation tabs/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveAttribute('aria-label', 'Home');
    expect(tabs[1]).toHaveAttribute('aria-label', 'Search');
    expect(tabs[2]).toHaveAttribute('aria-label', 'Courses');
    expect(tabs[3]).toHaveAttribute('aria-label', 'Profile');
  });

  it('handles active tab state and calls onNavChange on click', () => {
    const handleNavChange = vi.fn();
    render(<MobileNavigation initialActive="home" onNavChange={handleNavChange} />);

    const homeTab = screen.getByRole('tab', { name: 'Home' });
    const searchTab = screen.getByRole('tab', { name: 'Search' });

    expect(homeTab).toHaveAttribute('aria-selected', 'true');
    expect(homeTab).toHaveAttribute('tabIndex', '0');
    expect(searchTab).toHaveAttribute('aria-selected', 'false');
    expect(searchTab).toHaveAttribute('tabIndex', '-1');

    fireEvent.click(searchTab);

    expect(handleNavChange).toHaveBeenCalledWith('search');
    expect(homeTab).toHaveAttribute('aria-selected', 'false');
    expect(searchTab).toHaveAttribute('aria-selected', 'true');
    expect(searchTab).toHaveAttribute('tabIndex', '0');
  });

  it('supports keyboard navigation via Arrow Keys, Home, and End', () => {
    render(<MobileNavigation initialActive="home" />);

    const tablist = screen.getByRole('tablist');
    const homeTab = screen.getByRole('tab', { name: 'Home' });
    const searchTab = screen.getByRole('tab', { name: 'Search' });
    const profileTab = screen.getByRole('tab', { name: 'Profile' });

    // Focus home and trigger ArrowRight
    homeTab.focus();
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(searchTab).toHaveAttribute('aria-selected', 'true');

    // Trigger End key
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(profileTab).toHaveAttribute('aria-selected', 'true');

    // Trigger Home key
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(homeTab).toHaveAttribute('aria-selected', 'true');

    // Trigger ArrowLeft
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(profileTab).toHaveAttribute('aria-selected', 'true');
  });
});
