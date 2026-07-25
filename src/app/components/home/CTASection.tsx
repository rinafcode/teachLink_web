import Link from 'next/link';

export function CTASection({ t }: { t: (key: string) => string }) {
  return (
    <div className="px-4 py-16 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('home.ctaTitle')}</h2>
        <p className="text-xl text-gray-300 mb-8">{t('home.ctaSubtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
          >
            {t('home.ctaPrimary')}
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-colors"
          >
            {t('home.ctaSecondary')}
          </Link>
        </div>
      </div>
    </div>
  );
}
