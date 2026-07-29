import type { MetadataRoute } from 'next';
import type { Course, PaginatedResponse } from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teachlink.app';

export const revalidate = 3600; // regenerate every hour

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/study-groups`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
];

async function fetchAllCourses(): Promise<Course[]> {
  const courses: Course[] = [];
  let cursor: string | undefined;

  try {
    do {
      const url = new URL(`${BASE_URL}/api/courses`);
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) break;

      const json: PaginatedResponse<Course> = await res.json();
      courses.push(...json.data);
      cursor = json.nextCursor;
    } while (cursor);
  } catch {
    // return whatever was collected before the failure
  }

  return courses;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await fetchAllCourses();

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${BASE_URL}/courses/${course.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...STATIC_ROUTES, ...courseRoutes];
}
