import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdaptiveNavigation, NavLink } from '../AdaptiveNavigation';

const mockLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Teach', href: '/teach' },
];

describe('AdaptiveNavigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  it('renders brand name and desktop links', () => {
    render(<AdaptiveNavigation links={mockLinks} brandName="TestBrand" />);

    expect(screen.getByText('TestBrand')).toBeInTheDocument();

    // Desktop navigation links
    const desktopLinks = screen.getAllByRole('link', { name: /Home|Courses|Teach/ });
    expect(desktopLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('toggles mobile menu on button click and controls body overflow scroll lock', () => {
    render(<AdaptiveNavigation links={mockLinks} />);

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('unset');

    // Open menu
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.style.overflow).toBe('hidden');

    // Close menu
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(document.body.style.overflow).toBe('unset');
  });

  it('closes mobile menu when clicking outside (on the backdrop overlay)', () => {
    render(<AdaptiveNavigation links={mockLinks} />);

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(toggleButton);

    // Backdrop should exist
    const backdrop =
      screen.getByTestId('backdrop') || document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();

    // Click backdrop
    fireEvent.click(backdrop!);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('unset');
  });

  it('closes mobile menu when Escape key is pressed', () => {
    render(<AdaptiveNavigation links={mockLinks} />);

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(toggleButton);
    expect(document.body.style.overflow).toBe('hidden');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('unset');
  });

  it('manages keyboard focus trap and restores focus on close', () => {
    render(<AdaptiveNavigation links={mockLinks} />);

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    toggleButton.focus();

    // Open menu
    fireEvent.click(toggleButton);

    // Initial focus should go to first link
    const drawerLinks = screen.getAllByRole('link', { name: /Home|Courses|Teach/ });
    // First link in mobile drawer is element index 3 (since first 3 are desktop links)
    const mobileHomeLink = drawerLinks[3];
    expect(mobileHomeLink).toHaveFocus();

    // Focus last link and tab forward
    const mobileTeachLink = drawerLinks[5];
    mobileTeachLink.focus();

    // Simulate Tab key down on last link wrapper (focus trap handles Tab)
    const drawerContainer = mobileTeachLink.parentElement;
    fireEvent.keyDown(drawerContainer!, { key: 'Tab', shiftKey: false });
    expect(mobileHomeLink).toHaveFocus();

    // Tab backward (Shift + Tab) on first link
    fireEvent.keyDown(drawerContainer!, { key: 'Tab', shiftKey: true });
    expect(mobileTeachLink).toHaveFocus();

    // Close menu
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggleButton).toHaveFocus();
  });

  it('automatically closes menu and unsets overflow when resized to desktop width', () => {
    render(<AdaptiveNavigation links={mockLinks} />);

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(toggleButton);
    expect(document.body.style.overflow).toBe('hidden');

    // Mock resize to 1024px
    // @ts-ignore
    window.innerWidth = 1024;
    fireEvent(window, new Event('resize'));

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('unset');
  });
});
