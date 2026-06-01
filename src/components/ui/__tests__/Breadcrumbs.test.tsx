/**
 * Breadcrumbs Component Tests
 * Tests for Material Design breadcrumb navigation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs, AnimatedBreadcrumbs, type BreadcrumbItem } from '../Breadcrumbs';
import { Home, Folder, FileText } from 'lucide-react';

describe('Breadcrumbs', () => {
  const basicItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', current: true },
  ];

  describe('Rendering', () => {
    it('renders breadcrumb items correctly', () => {
      render(<Breadcrumbs items={basicItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('renders nothing when items array is empty', () => {
      const { container } = render(<Breadcrumbs items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <Breadcrumbs items={basicItems} className="custom-breadcrumbs" />,
      );
      expect(container.querySelector('.custom-breadcrumbs')).toBeInTheDocument();
    });

    it('renders home icon when showHomeIcon is true', () => {
      const { container } = render(<Breadcrumbs items={basicItems} showHomeIcon />);
      // Check for Home icon in the first item
      const homeIcon = container.querySelector('svg');
      expect(homeIcon).toBeInTheDocument();
    });

    it('renders custom icons for items', () => {
      const itemsWithIcons: BreadcrumbItem[] = [
        { label: 'Home', href: '/', icon: <Home data-testid="home-icon" /> },
        { label: 'Folder', href: '/folder', icon: <Folder data-testid="folder-icon" /> },
        { label: 'File', current: true, icon: <FileText data-testid="file-icon" /> },
      ];

      render(<Breadcrumbs items={itemsWithIcons} />);

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders links for items with href', () => {
      render(<Breadcrumbs items={basicItems} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });

      expect(homeLink).toHaveAttribute('href', '/');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('does not render link for current page', () => {
      render(<Breadcrumbs items={basicItems} />);

      const analyticsText = screen.getByText('Analytics');
      expect(analyticsText.tagName).not.toBe('A');
    });

    it('marks current page with aria-current', () => {
      render(<Breadcrumbs items={basicItems} />);

      const currentItem = screen.getByText('Analytics').parentElement;
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation role and aria-label', () => {
      render(<Breadcrumbs items={basicItems} />);

      const nav = screen.getByRole('navigation', { name: /breadcrumb navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('uses custom aria-label when provided', () => {
      render(<Breadcrumbs items={basicItems} ariaLabel="Custom navigation" />);

      const nav = screen.getByRole('navigation', { name: /custom navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('renders ordered list for breadcrumb items', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />);

      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
    });

    it('hides separators from screen readers', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />);

      const separators = container.querySelectorAll('[aria-hidden="true"]');
      // Should have separators (one less than items count)
      expect(separators.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation on links', async () => {
      const user = userEvent.setup();
      render(<Breadcrumbs items={basicItems} />);

      const homeLink = screen.getByRole('link', { name: /home/i });

      await user.tab();
      expect(homeLink).toHaveFocus();
    });
  });

  describe('Separators', () => {
    it('renders default ChevronRight separator', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />);

      // Should have 2 separators for 3 items
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });

    it('renders custom separator', () => {
      const customSeparator = <span data-testid="custom-sep">/</span>;
      render(<Breadcrumbs items={basicItems} separator={customSeparator} />);

      const separators = screen.getAllByTestId('custom-sep');
      expect(separators).toHaveLength(2); // 3 items = 2 separators
    });

    it('does not render separator after last item', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />);

      const listItems = container.querySelectorAll('li');
      const lastItem = listItems[listItems.length - 1];

      // Last item should not contain a separator
      const separatorInLast = lastItem.querySelector('[aria-hidden="true"]');
      expect(separatorInLast).toBeNull();
    });
  });

  describe('Collapsed Breadcrumbs', () => {
    const manyItems: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Level 1', href: '/level1' },
      { label: 'Level 2', href: '/level2' },
      { label: 'Level 3', href: '/level3' },
      { label: 'Level 4', href: '/level4' },
      { label: 'Current', current: true },
    ];

    it('shows all items when maxItems is 0', () => {
      render(<Breadcrumbs items={manyItems} maxItems={0} />);

      manyItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });

    it('collapses middle items when maxItems is set', () => {
      render(<Breadcrumbs items={manyItems} maxItems={3} />);

      // Should show first item, ellipsis, and last 2 items
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Level 4')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();

      // Middle items should not be visible
      expect(screen.queryByText('Level 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Level 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
    });

    it('does not collapse when items count is less than maxItems', () => {
      render(<Breadcrumbs items={basicItems} maxItems={5} />);

      basicItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies current page styling', () => {
      render(<Breadcrumbs items={basicItems} />);

      const currentItem = screen.getByText('Analytics').closest('span');
      expect(currentItem).toHaveClass('font-semibold');
    });

    it('applies hover styles to links', () => {
      render(<Breadcrumbs items={basicItems} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveClass('hover:bg-gray-100');
    });

    it('applies focus-visible styles for keyboard navigation', () => {
      render(<Breadcrumbs items={basicItems} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('AnimatedBreadcrumbs', () => {
    it('renders with animation wrapper', () => {
      const { container } = render(<AnimatedBreadcrumbs items={basicItems} />);

      // Should render breadcrumbs inside motion.div
      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('passes all props to Breadcrumbs component', () => {
      render(
        <AnimatedBreadcrumbs items={basicItems} showHomeIcon ariaLabel="Animated navigation" />,
      );

      const nav = screen.getByRole('navigation', { name: /animated navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single item breadcrumb', () => {
      const singleItem: BreadcrumbItem[] = [{ label: 'Home', current: true }];
      render(<Breadcrumbs items={singleItem} />);

      expect(screen.getByText('Home')).toBeInTheDocument();

      // Should not have any separators
      const { container } = render(<Breadcrumbs items={singleItem} />);
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBe(0);
    });

    it('handles items without href', () => {
      const itemsNoHref: BreadcrumbItem[] = [
        { label: 'Home' },
        { label: 'Dashboard' },
        { label: 'Analytics', current: true },
      ];

      render(<Breadcrumbs items={itemsNoHref} />);

      // All should be rendered as spans, not links
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('handles very long breadcrumb labels', () => {
      const longLabelItems: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        {
          label: 'This is a very long breadcrumb label that might overflow',
          href: '/long',
        },
        { label: 'Current', current: true },
      ];

      render(<Breadcrumbs items={longLabelItems} />);

      expect(
        screen.getByText('This is a very long breadcrumb label that might overflow'),
      ).toBeInTheDocument();
    });
  });
});
