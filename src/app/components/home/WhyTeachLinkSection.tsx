export function WhyTeachLinkSection({ t }: { t: (key: string) => string }) {
  return (
    <div className="px-4 py-16 md:px-8 bg-gray-800/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">{t('home.whyTitle')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">&#127760;</div>
            <h3 className="text-xl font-semibold mb-3">{t('home.featureOfflineTitle')}</h3>
            <p className="text-gray-400">{t('home.featureOfflineDescription')}</p>
          </div>

          <div className="text-center p-6">
            <div className="text-4xl mb-4">&#9889;</div>
            <h3 className="text-xl font-semibold mb-3">{t('home.featureCrossPlatformTitle')}</h3>
            <p className="text-gray-400">{t('home.featureCrossPlatformDescription')}</p>
          </div>

          <div className="text-center p-6">
            <div className="text-4xl mb-4">&#128274;</div>
            <h3 className="text-xl font-semibold mb-3">{t('home.featureWeb3Title')}</h3>
            <p className="text-gray-400">{t('home.featureWeb3Description')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
