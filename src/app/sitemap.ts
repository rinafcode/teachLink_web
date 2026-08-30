import type { MetadataRoute } from 'next';
import type { Course, PaginatedResponse, User, Topic } from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teachlink.app';

export const dynamic = 'force-dynamic';

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
  {
    url: `${BASE_URL}/leaderboard`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/release-notes`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
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

async function fetchAllInstructors(): Promise<User[]> {
  const instructors: User[] = [];
  let cursor: string | undefined;

  try {
    do {
      const url = new URL(`${BASE_URL}/api/instructors`);
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) break;

      const json: PaginatedResponse<User> = await res.json();
      instructors.push(...json.data);
      cursor = json.nextCursor;
    } while (cursor);
  } catch {
    // return whatever was collected before the failure
  }

  return instructors;
}

async function fetchAllTopics(): Promise<Topic[]> {
  const topics: Topic[] = [];
  let cursor: string | undefined;

  try {
    do {
      const url = new URL(`${BASE_URL}/api/topics`);
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) break;

      const json: PaginatedResponse<Topic> = await res.json();
      topics.push(...json.data);
      cursor = json.nextCursor;
    } while (cursor);
  } catch {
    // return whatever was collected before the failure
  }

  return topics;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, instructors, topics] = await Promise.all([
    fetchAllCourses(),
    fetchAllInstructors(),
    fetchAllTopics(),
  ]);

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${BASE_URL}/courses/${course.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const instructorRoutes: MetadataRoute.Sitemap = instructors.map((instructor) => ({
    url: `${BASE_URL}/instructors/${instructor.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const topicRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${BASE_URL}/topics/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...STATIC_ROUTES, ...courseRoutes, ...instructorRoutes, ...topicRoutes];
}
