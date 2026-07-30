import { Skeleton } from '@/components/ui/Skeleton';

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero Section Skeleton */}
      <div className="relative w-full bg-linear-to-br from-[#0066FF] via-[#00C2FF] to-[#0066FF] dark:from-[#0052CC] dark:via-[#0080CC] dark:to-[#0052CC]">
        <div className="h-[300px] sm:h-[400px] lg:h-[500px] w-full relative overflow-hidden">
          <Skeleton className="h-full w-full" animation="wave" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12">
            <div className="max-w-4xl space-y-4">
              <Skeleton height={48} width="75%" className="bg-white/20" animation="wave" />
              <Skeleton height={24} width="100%" className="bg-white/20 max-w-2xl" animation="wave" />
              <div className="flex gap-4">
                <Skeleton height={32} width={80} className="bg-white/10 rounded-full" animation="wave" />
                <Skeleton height={32} width={120} className="bg-white/10 rounded-full" animation="wave" />
                <Skeleton height={32} width={100} className="bg-white/10 rounded-full" animation="wave" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress Skeleton */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6">
              <Skeleton height={24} width={200} className="mb-4" animation="wave" />
              <Skeleton height={12} width="100%" className="mb-2" animation="wave" />
              <div className="flex gap-4 mt-4">
                <Skeleton height={32} width={120} animation="wave" />
                <Skeleton height={32} width={120} animation="wave" />
              </div>
            </div>

            {/* Video Preview Skeleton */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8">
              <Skeleton height={28} width={200} className="mb-4" animation="wave" />
              <Skeleton height={300} width="100%" className="rounded-lg" animation="wave" />
            </div>

            {/* Syllabus Skeleton */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8">
              <Skeleton height={28} width={150} className="mb-6" animation="wave" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton height={20} width="80%" animation="wave" />
                    <Skeleton height={16} width="60%" animation="wave" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Skeleton */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8">
              <Skeleton height={28} width={150} className="mb-6" animation="wave" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex gap-3">
                      <Skeleton height={40} width={40} variant="circle" animation="wave" />
                      <div className="flex-1 space-y-2">
                        <Skeleton height={16} width={120} animation="wave" />
                        <Skeleton height={16} width="100%" animation="wave" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Skeleton */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8">
              <Skeleton height={28} width={150} className="mb-6" animation="wave" />
              <div className="flex gap-4">
                <Skeleton height={80} width={80} variant="circle" animation="wave" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={20} width={150} animation="wave" />
                  <Skeleton height={16} width="100%" animation="wave" />
                  <Skeleton height={16} width="80%" animation="wave" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Enrollment CTA */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 sticky top-4">
              <Skeleton height={32} width="100%" className="mb-4" animation="wave" />
              <Skeleton height={24} width="80%" className="mb-6" animation="wave" />
              <div className="space-y-3 mb-6">
                <Skeleton height={16} width="100%" animation="wave" />
                <Skeleton height={16} width="90%" animation="wave" />
                <Skeleton height={16} width="85%" animation="wave" />
              </div>
              <Skeleton height={48} width="100%" className="rounded-lg" animation="wave" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
