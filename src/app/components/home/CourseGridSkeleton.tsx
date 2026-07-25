export function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[#262f40] overflow-hidden">
          <div className="h-48 bg-gray-700" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-2 bg-gray-700 rounded-full w-full" />
            <div className="h-10 bg-gray-700 rounded-lg w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
