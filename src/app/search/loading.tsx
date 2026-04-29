export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse mb-6">
          <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>

        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          ))}
        </div>

        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />

        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
