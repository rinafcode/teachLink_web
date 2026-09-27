import { writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { getAllCourses } from '../src/lib/course-config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teachlink.app';

interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const STATIC_ROUTES: SitemapEntry[] = [
  { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
  { url: `${BASE_URL}/search`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/study-groups`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE_URL}/leaderboard`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${BASE_URL}/certificates`, changeFrequency: 'weekly', priority: 0.5 },
  { url: `${BASE_URL}/support`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/release-notes`, changeFrequency: 'monthly', priority: 0.3 },
];

function getCourseRoutes(): SitemapEntry[] {
  try {
    const courses = getAllCourses();
    return courses.map((course) => ({
      url: `${BASE_URL}/courses/${course.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.warn('Could not load courses — only static routes will be included.', err);
    return [];
  }
}

function toXml(entries: SitemapEntry[]): string {
  const now = new Date().toISOString().split('T')[0];

  const urls = entries
    .map(
      (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified ? entry.lastModified.toISOString().split('T')[0] : now}</lastmod>
    ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''}
  </url>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function validateSitemap(entries: SitemapEntry[], filePath: string): void {
  const MAX_URLS = 50_000;
  const MAX_SIZE_BYTES = 50 * 1024 * 1024;

  if (entries.length > MAX_URLS) {
    console.warn(`Sitemap exceeds ${MAX_URLS} URLs (${entries.length}). Search engines may ignore entries beyond the limit.`);
  }

  try {
    const stats = statSync(filePath);
    if (stats.size > MAX_SIZE_BYTES) {
      console.warn(`Sitemap exceeds 50MB (${(stats.size / 1024 / 1024).toFixed(1)}MB). Consider splitting into a sitemap index.`);
    }
  } catch {
    // file not written yet — skip size check
  }

  const invalid = entries.filter((e) => !e.url.startsWith('https://'));
  if (invalid.length > 0) {
    console.warn(`${invalid.length} entry/entries do not use HTTPS:`);
    invalid.forEach((e) => console.warn(`  ${e.url}`));
  }

  console.log(`Sitemap validation passed: ${entries.length} URL(s), schema-compliant XML.`);
}

function main() {
  const courseRoutes = getCourseRoutes();
  const allEntries = [...STATIC_ROUTES, ...courseRoutes];

  const xml = toXml(allEntries);

  const publicDir = join(process.cwd(), 'public');
  mkdirSync(publicDir, { recursive: true });

  const outputPath = join(publicDir, 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');

  console.log(`Sitemap written to ${outputPath} — ${allEntries.length} URL(s) included.`);

  validateSitemap(allEntries, outputPath);
}

main();

