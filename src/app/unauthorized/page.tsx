import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unauthorized | TeachLink',
  description: 'You do not have permission to access this page.',
};

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          Access restricted
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
          You need elevated access to open this area.
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
          The post editor is reserved for instructors and admins so publishing tools stay in the
          right hands.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go to login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
