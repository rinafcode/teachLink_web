/**
 * Breadcrumbs Component Demo Page
 * Showcases all variants and use cases of the Breadcrumbs component
 */

'use client';

import React, { useState } from 'react';
import { Breadcrumbs, AnimatedBreadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import {
  Home,
  Folder,
  FileText,
  Settings,
  User,
  ChevronRight,
  Slash,
  ArrowRight,
} from 'lucide-react';

export default function BreadcrumbsDemoPage() {
  const [clickedItem, setClickedItem] = useState<string>('');

  const basicItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', current: true },
  ];

  const itemsWithIcons: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Documents', href: '/docs', icon: <Folder className="w-4 h-4" /> },
    { label: 'Report.pdf', current: true, icon: <FileText className="w-4 h-4" /> },
  ];

  const longPathItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Level 1', href: '/level1' },
    { label: 'Level 2', href: '/level2' },
    { label: 'Level 3', href: '/level3' },
    { label: 'Level 4', href: '/level4' },
    { label: 'Level 5', href: '/level5' },
    { label: 'Current Page', current: true },
  ];

  const interactiveItems: BreadcrumbItem[] = [
    {
      label: 'All Data',
      href: '#',
      onClick: (e) => {
        e.preventDefault();
        setClickedItem('All Data');
      },
    },
    { label: 'Filtered View', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold mb-2">Breadcrumbs Component</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Material Design breadcrumb navigation with full accessibility support
          </p>
        </header>

        {/* Basic Example */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Basic Breadcrumbs</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Simple breadcrumb navigation with links and current page indicator
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <Breadcrumbs items={basicItems} />
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', current: true }
  ]}
/>`}</code>
          </pre>
        </section>

        {/* With Home Icon */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">With Home Icon</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Display a home icon for the first breadcrumb item
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <Breadcrumbs items={basicItems} showHomeIcon />
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`<Breadcrumbs items={items} showHomeIcon />`}</code>
          </pre>
        </section>

        {/* With Custom Icons */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">With Custom Icons</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add custom icons to each breadcrumb item
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <Breadcrumbs items={itemsWithIcons} />
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`<Breadcrumbs
  items={[
    { label: 'Home', href: '/', icon: <Home /> },
    { label: 'Documents', href: '/docs', icon: <Folder /> },
    { label: 'Report.pdf', current: true, icon: <FileText /> }
  ]}
/>`}</code>
          </pre>
        </section>

        {/* Custom Separators */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Custom Separators</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Use different separator styles</p>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Slash Separator
              </h3>
              <Breadcrumbs items={basicItems} separator={<Slash className="w-4 h-4" />} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Arrow Separator
              </h3>
              <Breadcrumbs items={basicItems} separator={<ArrowRight className="w-4 h-4" />} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Text Separator
              </h3>
              <Breadcrumbs
                items={basicItems}
                separator={<span className="text-gray-400 mx-1">/</span>}
              />
            </div>
          </div>
        </section>

        {/* Collapsed Breadcrumbs */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Collapsed Breadcrumbs</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Automatically collapse long paths with ellipsis
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Full Path (No Limit)
              </h3>
              <Breadcrumbs items={longPathItems} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Collapsed (maxItems=4)
              </h3>
              <Breadcrumbs items={longPathItems} maxItems={4} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Collapsed (maxItems=3)
              </h3>
              <Breadcrumbs items={longPathItems} maxItems={3} />
            </div>
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`<Breadcrumbs items={longPathItems} maxItems={3} />
// Displays: Home > ... > Level 5 > Current Page`}</code>
          </pre>
        </section>

        {/* Interactive Breadcrumbs */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Interactive Breadcrumbs</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Handle click events for custom navigation behavior
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <Breadcrumbs items={interactiveItems} />
            {clickedItem && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Clicked: <strong>{clickedItem}</strong>
                </p>
              </div>
            )}
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`<Breadcrumbs
  items={[
    {
      label: 'All Data',
      href: '#',
      onClick: (e) => {
        e.preventDefault();
        handleBackToOverview();
      }
    },
    { label: 'Filtered View', current: true }
  ]}
/>`}</code>
          </pre>
        </section>

        {/* Animated Breadcrumbs */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Animated Breadcrumbs</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Smooth fade-in animation using Framer Motion
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <AnimatedBreadcrumbs items={basicItems} />
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`<AnimatedBreadcrumbs items={items} />`}</code>
          </pre>
        </section>

        {/* Real-world Examples */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Real-world Examples</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Common use cases in production applications
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                E-commerce Product Page
              </h3>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Electronics', href: '/electronics' },
                  { label: 'Laptops', href: '/electronics/laptops' },
                  { label: 'MacBook Pro 16"', current: true },
                ]}
              />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                User Settings
              </h3>
              <Breadcrumbs
                showHomeIcon
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
                  { label: 'Profile', current: true, icon: <User className="w-4 h-4" /> },
                ]}
              />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Documentation Site
              </h3>
              <Breadcrumbs
                separator={<span className="text-gray-400 mx-2">›</span>}
                items={[
                  { label: 'Docs', href: '/docs' },
                  { label: 'Components', href: '/docs/components' },
                  { label: 'Navigation', href: '/docs/components/navigation' },
                  { label: 'Breadcrumbs', current: true },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Accessibility Features</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Built-in accessibility support following WCAG 2.1 guidelines
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>
                  Semantic HTML with{' '}
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                    &lt;nav&gt;
                  </code>{' '}
                  and{' '}
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                    &lt;ol&gt;
                  </code>{' '}
                  elements
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>ARIA labels for screen readers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                    aria-current="page"
                  </code>{' '}
                  for current page indication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>Keyboard navigation support (Tab, Enter)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>Focus indicators for keyboard users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>
                  Separators hidden from screen readers with{' '}
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                    aria-hidden
                  </code>
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            For more information, see the{' '}
            <a
              href="/src/components/ui/Breadcrumbs.md"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              component documentation
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
