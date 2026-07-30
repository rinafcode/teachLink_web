export default function StudyGroupsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}