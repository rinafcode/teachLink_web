'use client';

import Link from 'next/link';
import { useInternationalization } from '@/hooks/useInternationalization';
import CourseCard from '../courses/CourseCard';

export default function HomeContent() {
  const { t, language, changeLanguage, isLoading } = useInternationalization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="px-4 py-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-400">
              {t('i18n.currentLanguage')}: <span className="text-white">{language}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                disabled={isLoading || language === 'en'}
                className="px-3 py-1.5 rounded-md border border-gray-600 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('ar')}
                disabled={isLoading || language === 'ar'}
                className="px-3 py-1.5 rounded-md border border-gray-600 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                AR
              </button>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {t('home.heroTitlePrefix')} <span className="text-blue-400">TeachLink</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">{t('home.heroSubtitle')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Link
              href="/dashboard"
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl mb-3">🖥️</div>
              <h3 className="text-xl font-semibold mb-2">{t('home.navDesktopTitle')}</h3>
              <p className="text-gray-400">{t('home.navDesktopDescription')}</p>
            </Link>

            <Link
              href="/mobile-app"
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-xl font-semibold mb-2">{t('home.navMobileTitle')}</h3>
              <p className="text-gray-400">{t('home.navMobileDescription')}</p>
            </Link>

            <Link
              href="/courses/1"
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-xl font-semibold mb-2">{t('home.navCatalogTitle')}</h3>
              <p className="text-gray-400">{t('home.navCatalogDescription')}</p>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-10 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('home.featuredTitle')}</h2>

          <div
            className="
            grid grid-cols-1 
            md:grid-cols-2 
            lg:grid-cols-3 
            gap-6 xl:gap-8
          "
          >
            <CourseCard
              title="Web3 UX Design Principles"
              subtitle="Create intuitive interfaces for decentralized applications"
              author="Sarah Johnson"
              progress={68}
              timeRemaining="12h remaining"
              courseHref="/courses/web3-ux-design"
              imageUrl="https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg"
            />

            <CourseCard
              title="Smart Contract Security Best Practices"
              subtitle="Learn to secure your Cairo smart contracts against vulnerabilities"
              author="Michael Chen"
              progress={45}
              timeRemaining="12h remaining"
              courseHref="/courses/smart-contract-security"
              imageUrl="https://static.vecteezy.com/system/resources/previews/053/715/379/non_2x/abstract-green-digital-rain-with-matrix-code-in-futuristic-cyber-background-perfect-for-technology-and-data-themed-visuals-png.png"
            />

            <CourseCard
              title="Scaling DAPps on Starknet"
              subtitle="Techniques for building scalable decentralized applications"
              author="Alex Rivera"
              progress={12}
              timeRemaining="12h remaining"
              courseHref="/courses/scaling-dapps-starknet"
              imageUrl="https://thumbs.dreamstime.com/b/futuristic-laptop-glowing-digital-waves-emerging-screen-dark-setting-399809314.jpg"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-16 md:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">{t('home.whyTitle')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-3">{t('home.featureOfflineTitle')}</h3>
              <p className="text-gray-400">{t('home.featureOfflineDescription')}</p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">{t('home.featureCrossPlatformTitle')}</h3>
              <p className="text-gray-400">{t('home.featureCrossPlatformDescription')}</p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3">{t('home.featureWeb3Title')}</h3>
              <p className="text-gray-400">{t('home.featureWeb3Description')}</p>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
