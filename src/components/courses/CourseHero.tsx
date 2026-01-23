import Image from 'next/image';

interface CourseHeroProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  instructor?: string;
  rating?: number;
  enrolledStudents?: number;
}

export default function CourseHero({
  title = "Advanced Web Development",
  description = "Master modern web development with this comprehensive course covering frontend and backend technologies.",
  imageUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
  instructor = "John Doe",
  rating = 4.8,
  enrolledStudents = 1234
}: CourseHeroProps) {
  return (
    <div className="relative w-full bg-linear-to-br from-[#0066FF] via-[#00C2FF] to-[#0066FF] dark:from-[#0052CC] dark:via-[#0080CC] dark:to-[#0052CC]">
      <div className="h-[300px] sm:h-[400px] lg:h-[500px] w-full relative overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover mix-blend-overlay opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 lg:mb-4 text-white leading-tight">{title}</h1>
            <p className="text-base sm:text-lg lg:text-xl mb-4 lg:mb-6 text-white/90 max-w-2xl leading-relaxed">{description}</p>
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm sm:text-base">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-yellow-400">★</span>
                <span className="text-white font-medium">{rating}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="text-white font-medium">{enrolledStudents.toLocaleString()} students</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">{instructor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 