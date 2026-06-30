import {
  type CourseListConfig,
  type CourseEntry,
  courseListConfigSchema,
  createDefaultCourseListConfig,
} from './types';

let currentConfig: CourseListConfig | null = null;

export function getCourseListConfig(): CourseListConfig {
  if (!currentConfig) {
    currentConfig = createDefaultCourseListConfig();
  }
  return currentConfig;
}

export function setCourseListConfig(config: CourseListConfig): void {
  const parsed = courseListConfigSchema.safeParse(config);
  if (parsed.success) {
    currentConfig = parsed.data;
  }
}

export function resetCourseListConfig(): void {
  currentConfig = createDefaultCourseListConfig();
}

export function getAllCourses(): CourseEntry[] {
  return getCourseListConfig().courses;
}

export function getFeaturedCourses(max?: number): CourseEntry[] {
  const config = getCourseListConfig();
  const featured = config.courses.filter((c) => c.featured);
  const limit = max ?? config.maxFeaturedCourses;
  return featured.slice(0, limit);
}

export function getCourseById(id: string): CourseEntry | undefined {
  return getCourseListConfig().courses.find((c) => c.id === id);
}

export function getCoursesByCategory(category: string): CourseEntry[] {
  return getCourseListConfig().courses.filter(
    (c) => c.category.toLowerCase() === category.toLowerCase(),
  );
}

export function getCoursesByTag(tag: string): CourseEntry[] {
  const lowerTag = tag.toLowerCase();
  return getCourseListConfig().courses.filter((c) =>
    c.tags.some((t) => t.toLowerCase() === lowerTag),
  );
}

export interface PaginatedCourses {
  data: CourseEntry[];
  total: number;
  nextCursor?: string;
}

export function getPaginatedCourses(
  limit: number = 10,
  cursor?: string,
  options?: {
    featured?: boolean;
    sortBy?: CourseListConfig['sortBy'];
    sortOrder?: CourseListConfig['sortOrder'];
  },
): PaginatedCourses {
  const config = getCourseListConfig();
  const sortBy = options?.sortBy ?? config.sortBy;
  const sortOrder = options?.sortOrder ?? config.sortOrder;
  const limitNum = Math.min(Math.max(1, limit), 100);

  let sorted = [...config.courses];
  if (options?.featured !== undefined) {
    sorted = sorted.filter((c) => c.featured === options.featured);
  }
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'progress':
        cmp = a.progress - b.progress;
        break;
      case 'duration':
        cmp = a.duration.localeCompare(b.duration);
        break;
      case 'category':
        cmp = a.category.localeCompare(b.category);
        break;
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const page = sorted.slice(startIndex, startIndex + limitNum);
  const nextIndex = startIndex + limitNum;
  const nextCursor = nextIndex < sorted.length ? String(nextIndex) : undefined;

  return {
    data: page,
    total: sorted.length,
    nextCursor,
  };
}
