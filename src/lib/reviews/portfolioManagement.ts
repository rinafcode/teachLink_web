export interface ReviewPortfolioItem {
  id: string;
  title: string;
  url: string;
  type: 'project' | 'repository' | 'case-study' | 'certificate';
  description?: string;
}

const SAFE_PORTFOLIO_PROTOCOLS = new Set(['https:', 'http:']);

export function isSafePortfolioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SAFE_PORTFOLIO_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function normalizePortfolioItems(items: ReviewPortfolioItem[] = []): ReviewPortfolioItem[] {
  const seen = new Set<string>();

  return items
    .filter((item) => item.title.trim() && isSafePortfolioUrl(item.url))
    .filter((item) => {
      const key = `${item.type}:${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      ...item,
      title: item.title.trim(),
      description: item.description?.trim() || undefined,
    }));
}

export function getPortfolioSummary(items: ReviewPortfolioItem[] = []): string {
  const normalized = normalizePortfolioItems(items);
  if (normalized.length === 0) return 'No portfolio evidence attached';
  if (normalized.length === 1) return '1 portfolio item attached';
  return `${normalized.length} portfolio items attached`;
}
