export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 animate-in fade-in duration-300">
      <div className="text-center space-y-4">
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Please wait...</p>
        </div>
        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
