/**
 * Standalone sitemap generator — writes public/sitemap.xml at build time.
 * Run with: npx tsx scripts/generate-sitemap.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

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
];

async function fetchAllCourseIds(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;

  try {
    do {
      const url = new URL(`${BASE_URL}/api/courses`);
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString());
      if (!res.ok) break;

      const json = await res.json();
      const page: { id: string }[] = Array.isArray(json) ? json : (json.data ?? []);
      ids.push(...page.map((c) => c.id));
      cursor = json.nextCursor;
    } while (cursor);
  } catch {
    console.warn('Could not fetch courses — only static routes will be included.');
  }

  return ids;
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

async function main() {
  const courseIds = await fetchAllCourseIds();

  const courseRoutes: SitemapEntry[] = courseIds.map((id) => ({
    url: `${BASE_URL}/courses/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const allEntries = [...STATIC_ROUTES, ...courseRoutes];
  const xml = toXml(allEntries);

  const publicDir = join(process.cwd(), 'public');
  mkdirSync(publicDir, { recursive: true });

  const outputPath = join(publicDir, 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');

  console.log(`Sitemap written to ${outputPath} — ${allEntries.length} URL(s) included.`);
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
