'use client';

import React from 'react';
import { AccessibilityProvider } from '@/app/components/accessibility/AccessibilityProvider';
import { AccessibleFormExample } from '@/app/components/accessibility/examples/AccessibleFormExample';
import { ModalExampleUsage } from '@/app/components/accessibility/examples/AccessibleModalExample';
import { AccessibleProgress } from '@/app/components/accessibility/ScreenReaderOptimizer';

/**
 * Demo page showcasing all accessibility features
 */
export default function AccessibilityDemoPage() {
  return (
    <AccessibilityProvider
      enableNavigator={true}
      enableScreenReader={true}
      enableContrastChecker={true}
      enableTester={true}
      autoCheckContrast={false}
      autoCheckAccessibility={false}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Skip Link Target */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to main content
        </a>

        {/* Header */}
        <header role="banner" className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Accessibility Features Demo
            </h1>
            <p className="mt-2 text-gray-600">
              WCAG 2.1 AA Compliant Components and Tools
            </p>
          </div>
        </header>

        {/* Main Navigation */}
        <nav
          id="main-navigation"
          role="navigation"
          aria-label="Main navigation"
          className="bg-white border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex space-x-8 py-4">
              <li>
                <a
                  href="#overview"
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                >
                  Overview
                </a>
              </li>
              <li>
                <a
                  href="#form-example"
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                >
                  Form Example
                </a>
              </li>
              <li>
                <a
                  href="#modal-example"
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                >
                  Modal Example
                </a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 py-8">
          {/* Overview Section */}
          <section id="overview" aria-labelledby="overview-heading" className="mb-12">
            <h2 id="overview-heading" className="text-2xl font-bold mb-4">
              Overview
            </h2>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <p>
                This page demonstrates comprehensive accessibility features ensuring WCAG 2.1 AA
                compliance. Use the floating buttons on the right to access:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Accessibility Navigator</strong> (bottom) - Keyboard navigation and skip
                  links
                </li>
                <li>
                  <strong>Color Contrast Checker</strong> (middle) - Validate color contrast ratios
                </li>
                <li>
                  <strong>Accessibility Tester</strong> (top) - Automated accessibility testing
                </li>
              </ul>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Progress Example</h3>
                <AccessibleProgress value={75} max={100} label="Course completion" />
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-lg font-semibold mb-2">Keyboard Navigation Tips</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex">
                    <dt className="font-medium w-32">Tab</dt>
                    <dd>Move to next focusable element</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium w-32">Shift + Tab</dt>
                    <dd>Move to previous focusable element</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium w-32">Enter / Space</dt>
                    <dd>Activate buttons and links</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium w-32">Escape</dt>
                    <dd>Close dialogs and menus</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Form Example Section */}
          <section id="form-example" aria-labelledby="form-heading" className="mb-12">
            <h2 id="form-heading" className="text-2xl font-bold mb-4">
              Accessible Form Example
            </h2>
            <div className="bg-white rounded-lg shadow p-6">
              <AccessibleFormExample />
            </div>
          </section>

          {/* Modal Example Section */}
          <section id="modal-example" aria-labelledby="modal-heading" className="mb-12">
            <h2 id="modal-heading" className="text-2xl font-bold mb-4">
              Accessible Modal Example
            </h2>
            <div className="bg-white rounded-lg shadow p-6">
              <ModalExampleUsage />
            </div>
          </section>

          {/* Features List */}
          <section aria-labelledby="features-heading" className="mb-12">
            <h2 id="features-heading" className="text-2xl font-bold mb-4">
              Implemented Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Keyboard Navigation</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Full keyboard accessibility</li>
                  <li>✓ Skip links for quick navigation</li>
                  <li>✓ Focus trap for modals</li>
                  <li>✓ Visible focus indicators</li>
                  <li>✓ Logical tab order</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Screen Reader Support</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ ARIA labels and descriptions</li>
                  <li>✓ Live regions for announcements</li>
                  <li>✓ Semantic HTML structure</li>
                  <li>✓ Accessible form labels</li>
                  <li>✓ Status messages</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Color Contrast</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ WCAG AA compliance (4.5:1)</li>
                  <li>✓ Automated contrast checking</li>
                  <li>✓ Visual contrast indicators</li>
                  <li>✓ Large text support (3:1)</li>
                  <li>✓ Detailed reports</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Testing & Validation</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Automated accessibility checks</li>
                  <li>✓ Issue severity classification</li>
                  <li>✓ WCAG criteria mapping</li>
                  <li>✓ Exportable reports</li>
                  <li>✓ Real-time validation</li>
                </ul>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer id="footer" role="contentinfo" className="bg-gray-800 text-white mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <p className="text-center">
              © 2024 Accessible Learning Platform. WCAG 2.1 AA Compliant.
            </p>
          </div>
        </footer>
      </div>
    </AccessibilityProvider>
  );
}
