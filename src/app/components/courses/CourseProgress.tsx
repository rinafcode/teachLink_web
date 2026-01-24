'use client';

interface CourseProgressProps {
  progress?: number;
  completedLessons?: number;
  totalLessons?: number;
  isEnrolled?: boolean;
}

export default function CourseProgress({
  progress = 0,
  completedLessons = 0,
  totalLessons = 20,
  isEnrolled = false,
}: CourseProgressProps) {
  if (!isEnrolled) return null;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 mb-6 lg:mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">Your Progress</h3>
        <span className="text-2xl font-bold text-[#0066FF] dark:text-[#00C2FF]">{progress}%</span>
      </div>

      <div className="relative w-full h-3 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden mb-3">
        <div
          className="absolute top-0 left-0 h-full bg-linear-to-r from-[#0066FF] to-[#00C2FF] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
        {completedLessons} of {totalLessons} lessons completed
      </p>
    </div>
  );
}
