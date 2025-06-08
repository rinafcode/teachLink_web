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
  imageUrl = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3",
  instructor = "John Doe",
  rating = 4.8,
  enrolledStudents = 1234
}: CourseHeroProps) {
  return (
    <div className="relative">
      <div className="h-[400px] w-full relative">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-lg mb-4 max-w-2xl">{description}</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <span className="text-yellow-400 mr-2">★</span>
              <span>{rating}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">👤</span>
              <span>{enrolledStudents} students</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">👨‍🏫</span>
              <span>Instructor: {instructor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 