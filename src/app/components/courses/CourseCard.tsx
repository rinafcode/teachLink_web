// CourseCard.tsx
import { Play } from 'lucide-react'; // or your preferred icon library

interface CourseCardProps {
  title: string;
  subtitle: string;
  author: string;
  progress: number;       // 0–100
  timeRemaining: string;  // e.g. "12h remaining"
  imageUrl?: string;      // optional background image
}

export default function CourseCard({
  title = "Web3 UX Design Principles",
  subtitle = "Create intuitive interfaces for decentralized applications",
  author = "Sarah Johnson",
  progress = 68,
  timeRemaining = "12h remaining",
  imageUrl,
}: CourseCardProps) {
  return (
    <div
      className="group relative w-full overflow-hidden rounded-xl bg-[#262f40] border border-gray- shadow-lg transition-all duration-300 hover:shadow-xl"
    >
      {/* Course Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white leading-tight">
          {title}
        </h3>

        {/* Author */}
        <p className="text-sm text-gray-400">
          By {author}
        </p>

        {/* Subtitle/Description */}
        <p className="text-sm text-gray-400 line-clamp-2">
          {subtitle}
        </p>

        {/* Progress section */}
        <div className="mt-1 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white">{progress}% complete</span>
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
              </svg>
              <span>{timeRemaining}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          <Play size={16} className="fill-current" />
          Continue Learning
        </button>
      </div>
    </div>
  );
}