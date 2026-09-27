import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ABTestBreadcrumbs } from '../ABTestBreadcrumbs';
import type { BreadcrumbItem } from '../Breadcrumbs';

describe('ABTestBreadcrumbs', () => {
  let localStorageData: Record<string, string> = {};

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', current: true },
  ];

  beforeEach(() => {
    localStorageData = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageData[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageData[key] = value;
      }),
      clear: vi.fn(() => {
        for (const key in localStorageData) delete localStorageData[key];
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageData[key];
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders breadcrumb items', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-render';
    localStorageData['ab_test_breadcrumbs_layout'] = '2500';
    render(<ABTestBreadcrumbs items={items} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('applies standard variant classes by default', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-standard';
    localStorageData['ab_test_breadcrumbs_layout'] = '2500';
    const { container } = render(<ABTestBreadcrumbs items={items} />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('text-sm', 'gap-1');
  });

  it('applies compact variant classes when bucket falls in compact range', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-compact';
    localStorageData['ab_test_breadcrumbs_layout'] = '6500';
    const { container } = render(<ABTestBreadcrumbs items={items} />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('text-xs', 'gap-0.5');
  });

  it('applies minimal variant classes when bucket falls in minimal range', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-minimal';
    localStorageData['ab_test_breadcrumbs_layout'] = '9000';
    const { container } = render(<ABTestBreadcrumbs items={items} />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('text-sm', 'gap-1.5');
  });

  it('tracks exposure on render', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    localStorageData['ab_test_anon_id'] = 'test-user-exposure';
    localStorageData['ab_test_breadcrumbs_layout'] = '2500';

    render(<ABTestBreadcrumbs items={items} />);

    await waitFor(() => {
      expect(localStorageData['ab_test_breadcrumbs_layout_exposed']).toBeTruthy();
    });

    const exposure = JSON.parse(localStorageData['ab_test_breadcrumbs_layout_exposed']);
    expect(exposure.variantId).toBe('standard');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.any(CustomEvent),
    );
  });

  it('uses a custom experimentId when provided', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    localStorageData['ab_test_anon_id'] = 'test-user-custom';
    localStorageData['ab_test_custom_experiment'] = '2500';

    render(<ABTestBreadcrumbs items={items} experimentId="custom_experiment" />);

    await waitFor(() => {
      expect(localStorageData['ab_test_custom_experiment_exposed']).toBeTruthy();
    });

    const exposure = JSON.parse(localStorageData['ab_test_custom_experiment_exposed']);
    expect(exposure.variantId).toBe('standard');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.any(CustomEvent),
    );
  });

  it('passes additional props through to Breadcrumbs', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-props';
    localStorageData['ab_test_breadcrumbs_layout'] = '2500';
    render(<ABTestBreadcrumbs items={items} ariaLabel="Custom navigation" showHomeIcon />);

    const nav = screen.getByRole('navigation', { name: /custom navigation/i });
    expect(nav).toBeInTheDocument();
  });
});
