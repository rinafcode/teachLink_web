export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="flex gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
