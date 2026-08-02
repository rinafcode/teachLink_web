import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { PrivilegedContainer } from '@/components/shared/PrivilegedContainer';
import { UserRole } from '@/types/api';
import { EDITOR_MIN_ROLE } from '@/lib/auth/editorAccess';
import { EditorWorkspace } from './EditorWorkspace';

export const metadata: Metadata = {
  title: 'Post Editor | TeachLink',
  description: 'Create and edit privileged post content with a secure editor workspace.',
  openGraph: {
    title: 'Post Editor | TeachLink',
    description: 'Create and edit privileged post content with a secure editor workspace.',
    type: 'website',
    siteName: 'TeachLink',
  },
  twitter: {
    card: 'summary',
    site: '@teachlink',
    title: 'Post Editor | TeachLink',
    description: 'Create and edit privileged post content with a secure editor workspace.',
  },
};

function fallback() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          Privileged container
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
          Post editor access is restricted.
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
          Only instructors and admins can open the editor workspace.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function RestrictedEditorFallback() {
  return fallback();
}

export default async function EditorPage() {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get('user-role')?.value;
  const userRole = Object.values(UserRole).includes(roleCookie as UserRole)
    ? (roleCookie as UserRole)
    : null;

  return (
    <PrivilegedContainer
      userRole={userRole}
      requiredRole={EDITOR_MIN_ROLE}
      fallback={<RestrictedEditorFallback />}
      className="min-h-screen"
    >
      <EditorWorkspace />
    </PrivilegedContainer>
  );
}
