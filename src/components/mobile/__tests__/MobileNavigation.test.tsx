import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNavigation } from '../MobileNavigation';

describe('MobileNavigation Component', () => {
  const mockOnNavChange = vi.fn();

  beforeEach(() => {
    mockOnNavChange.mockClear();
  });

  it('renders all navigation items correctly', () => {
    render(<MobileNavigation onNavChange={mockOnNavChange} />);

    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: /navigation tabs/i })).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);

    expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /courses/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
  });

  it('handles initial active tab setting correctly', () => {
    render(<MobileNavigation initialActive="courses" onNavChange={mockOnNavChange} />);

    expect(screen.getByRole('tab', { name: /home/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /courses/i })).toHaveAttribute('aria-selected', 'true');
    
    // Only the active tab should have tabIndex 0, others should have -1
    expect(screen.getByRole('tab', { name: /courses/i })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /home/i })).toHaveAttribute('tabindex', '-1');
  });

  it('triggers onNavChange and updates active tab state on click', async () => {
    const user = userEvent.setup();
    render(<MobileNavigation initialActive="home" onNavChange={mockOnNavChange} />);

    const searchTab = screen.getByRole('tab', { name: /search/i });
    const homeTab = screen.getByRole('tab', { name: /home/i });

    expect(homeTab).toHaveAttribute('aria-selected', 'true');
    expect(searchTab).toHaveAttribute('aria-selected', 'false');

    await user.click(searchTab);

    expect(mockOnNavChange).toHaveBeenCalledTimes(1);
    expect(mockOnNavChange).toHaveBeenCalledWith('search');
    expect(searchTab).toHaveAttribute('aria-selected', 'true');
    expect(homeTab).toHaveAttribute('aria-selected', 'false');
  });

  describe('Keyboard Navigation (WAI-ARIA Tablist Compliance)', () => {
    it('moves focus to the next item when ArrowRight or ArrowDown is pressed', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation initialActive="home" />);

      const homeTab = screen.getByRole('tab', { name: /home/i });
      const searchTab = screen.getByRole('tab', { name: /search/i });

      homeTab.focus();
      expect(document.activeElement).toBe(homeTab);

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(searchTab);

      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /courses/i }));
    });

    it('moves focus to the previous item when ArrowLeft or ArrowUp is pressed', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation initialActive="search" />);

      const searchTab = screen.getByRole('tab', { name: /search/i });
      const homeTab = screen.getByRole('tab', { name: /home/i });

      searchTab.focus();
      expect(document.activeElement).toBe(searchTab);

      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(homeTab);

      // Wrap around to last item
      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /profile/i }));

      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /courses/i }));
    });

    it('moves focus to first and last items on Home and End keys', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation initialActive="search" />);

      const searchTab = screen.getByRole('tab', { name: /search/i });
      const homeTab = screen.getByRole('tab', { name: /home/i });
      const profileTab = screen.getByRole('tab', { name: /profile/i });

      searchTab.focus();
      
      await user.keyboard('{Home}');
      expect(document.activeElement).toBe(homeTab);

      await user.keyboard('{End}');
      expect(document.activeElement).toBe(profileTab);
    });
  });

  describe('Responsive Design Styling', () => {
    it('applies bottom bar classes by default for compact portrait screens', () => {
      render(<MobileNavigation />);

      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      const classList = nav.className;

      expect(classList).toContain('bottom-0');
      expect(classList).toContain('left-0');
      expect(classList).toContain('right-0');
      expect(classList).toContain('min-h-16');
      expect(classList).toContain('w-full');
      expect(classList).toContain('border-t');
      expect(classList).toContain('lg:hidden');
    });

    it('only switches to a side rail at landscape mobile/tablet dimensions', () => {
      render(<MobileNavigation />);

      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      const classList = nav.className;
      const responsiveRailPrefix = '[@media_(min-width:640px)_and_(orientation:landscape)]';
      
      expect(classList).toContain(`${responsiveRailPrefix}:top-0`);
      expect(classList).toContain(`${responsiveRailPrefix}:h-dvh`);
      expect(classList).toContain(`${responsiveRailPrefix}:w-20`);
      expect(classList).toContain(`${responsiveRailPrefix}:border-r`);
    });

    it('has standard safe-area padding for notches and interactive boundaries', () => {
      render(<MobileNavigation />);

      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      const styleAttr = nav.getAttribute('style') || '';

      expect(styleAttr).toContain('padding-bottom: env(safe-area-inset-bottom)');
      expect(styleAttr).toContain('padding-left: env(safe-area-inset-left)');
      expect(styleAttr).toContain('padding-right: env(safe-area-inset-right)');
    });

    it('keeps labels visible in the bottom bar and hides them in the side rail', () => {
      render(<MobileNavigation />);

      const label = screen.getByText('Home');
      const responsiveRailPrefix = '[@media_(min-width:640px)_and_(orientation:landscape)]';

      expect(label.className).toContain('text-[10px]');
      expect(label.className).toContain(`${responsiveRailPrefix}:hidden`);
    });
  });
});
