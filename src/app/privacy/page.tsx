/**
 * Privacy Policy Page
 * Displays the privacy policy with i18n support and accessibility guidelines
 */

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';

/**
 * Generate metadata for the Privacy Policy page
 */
export const metadata: Metadata = {
  title: 'Privacy Policy | TeachLink',
  description:
    'Learn about how TeachLink collects, uses, and protects your personal information. Our privacy practices are designed to protect your data and respect your rights.',
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
};

/**
 * Privacy Policy Page Component
 */
export default async function PrivacyPolicyPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('i18n:language')?.value ?? 'en';

  return (
    <main
      className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8"
      role="main"
      aria-label="Privacy Policy"
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Last updated:{' '}
            <time dateTime="2024-01-01" className="font-semibold">
              January 1, 2024
            </time>
          </p>
          <nav className="mt-8 flex flex-wrap gap-4" aria-label="Table of contents">
            <a href="#introduction" className="text-blue-600 hover:text-blue-700 underline">
              Introduction
            </a>
            <a
              href="#information-collection"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Information Collection
            </a>
            <a href="#information-use" className="text-blue-600 hover:text-blue-700 underline">
              Information Use
            </a>
            <a href="#data-security" className="text-blue-600 hover:text-blue-700 underline">
              Data Security
            </a>
            <a href="#your-rights" className="text-blue-600 hover:text-blue-700 underline">
              Your Rights
            </a>
            <a href="#contact" className="text-blue-600 hover:text-blue-700 underline">
              Contact Us
            </a>
          </nav>
        </header>

        {/* Privacy Policy Content */}
        <article className="prose prose-lg max-w-none dark:prose-invert">
          <PrivacyPolicyContent locale={locale} />
        </article>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600">
            This privacy policy applies to all users of TeachLink. If you have questions about this
            privacy policy or our privacy practices, please contact us at{' '}
            <a href="mailto:privacy@teachlink.com" className="text-blue-600 hover:underline">
              privacy@teachlink.com
            </a>
            .
          </p>
          <p className="mt-4 text-sm text-gray-600">
            We may update this privacy policy from time to time. Any changes will be posted on this
            page, and we will notify you by updating the &quot;Last updated&quot; date above.
          </p>
        </footer>
      </div>
    </main>
  );
}
