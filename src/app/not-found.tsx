'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-20 text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 rounded-3xl border border-white/10 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            404 error
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Page not found</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            The page you were looking for doesn&apos;t exist or may have moved. You can return to
            the home page or head back to the previous screen.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go back home
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 font-medium text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
