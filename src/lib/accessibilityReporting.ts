/**
 * Voluntary Product Accessibility Template (VPAT) Reporting Workflow (#412).
 *
 * Provides:
 *  - A typed enumerator of WCAG 2.1 / 2.2 success criteria covered by reports
 *  - A reporter helper to assemble, validate and persist findings
 *  - An exporter that produces a JSON VPAT-AC-style document
 *
 * The module is intentionally framework-free: persistence is delegated to a
 * caller-supplied sink so the workflow runs in any runtime.
 */

export type ConformanceLevel =
  | 'supports'
  | 'partially-supports'
  | 'does-not-support'
  | 'not-applicable';

export type WCAGCriterion = {
  id: string; // e.g. "1.1.1"
  name: string;
  level: 'A' | 'AA' | 'AAA';
};

export interface AccessibilityFinding {
  criterionId: string;
  level: ConformanceLevel;
  remark: string;
  evidenceUrl?: string;
}

export interface VPATReport {
  id: string;
  productName: string;
  version: string;
  generatedAt: string; // ISO datetime
  findings: AccessibilityFinding[];
}

export const VPAT_CDN_CACHE_CONTROL =
  'public, max-age=31536000, s-maxage=31536000, immutable';

const VPAT_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function isValidVPATVersion(version: string): boolean {
  return VPAT_VERSION_PATTERN.test(version);
}

export function getVPATCDNUrl(
  version: string,
  cdnBaseUrl = process.env.NEXT_PUBLIC_VPAT_CDN_URL,
): string {
  if (!isValidVPATVersion(version)) {
    throw new Error('VPAT CDN: version must contain only letters, numbers, dots, underscores, or hyphens');
  }

  const assetPath = `/api/accessibility/vpat/${encodeURIComponent(version)}.json`;
  if (!cdnBaseUrl) return assetPath;

  const base = new URL(cdnBaseUrl);
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new Error('VPAT CDN: base URL must use HTTP or HTTPS');
  }
  base.pathname = `${base.pathname.replace(/\/$/, '')}${assetPath}`;
  base.search = '';
  base.hash = '';
  return base.toString();
}

export function parsePublishedVPATReport(raw: string, version: string): VPATReport | null {
  if (!isValidVPATVersion(version)) return null;

  try {
    const report: unknown = JSON.parse(raw);
    if (!report || typeof report !== 'object') return null;
    const candidate = report as Partial<VPATReport>;
    if (
      typeof candidate.id !== 'string' ||
      !candidate.id.trim() ||
      candidate.version !== version ||
      typeof candidate.productName !== 'string' ||
      typeof candidate.generatedAt !== 'string' ||
      !Array.isArray(candidate.findings)
    ) {
      return null;
    }
    for (const finding of candidate.findings) {
      if (
        !finding ||
        typeof finding !== 'object' ||
        typeof finding.criterionId !== 'string' ||
        !CRITERION_INDEX.has(finding.criterionId) ||
        typeof finding.level !== 'string' ||
        !['supports', 'partially-supports', 'does-not-support', 'not-applicable'].includes(
          finding.level,
        ) ||
        typeof finding.remark !== 'string' ||
        !finding.remark.trim()
      ) {
        return null;
      }
    }
    return candidate as VPATReport;
  } catch {
    return null;
  }
}

export const WCAG_CRITERIA: WCAGCriterion[] = [
  { id: '1.1.1', name: 'Non-text Content', level: 'A' },
  { id: '1.3.1', name: 'Info and Relationships', level: 'A' },
  { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA' },
  { id: '2.1.1', name: 'Keyboard', level: 'A' },
  { id: '2.4.6', name: 'Headings and Labels', level: 'AA' },
  { id: '3.3.1', name: 'Error Identification', level: 'A' },
  { id: '4.1.2', name: 'Name, Role, Value', level: 'A' },
];

const CRITERION_INDEX = new Map<string, WCAGCriterion>(
  WCAG_CRITERIA.map((c) => [c.id, c] as const),
);

export interface BuildReportInput {
  productName: string;
  version: string;
  findings: AccessibilityFinding[];
}

export function buildReport(input: BuildReportInput): VPATReport {
  if (!input.productName.trim()) {
    throw new Error('VPAT report: productName is required');
  }
  if (!input.version.trim()) {
    throw new Error('VPAT report: version is required');
  }
  for (const f of input.findings) {
    if (!CRITERION_INDEX.has(f.criterionId)) {
      throw new Error(`VPAT report: unknown criterion id "${f.criterionId}"`);
    }
    if (!f.remark.trim()) {
      throw new Error(`VPAT report: remark is required for criterion ${f.criterionId}`);
    }
  }
  return {
    id: `vpat-${Date.now().toString(36)}`,
    productName: input.productName.trim(),
    version: input.version.trim(),
    generatedAt: new Date().toISOString(),
    findings: [...input.findings],
  };
}

export type ReportSink = (report: VPATReport) => void | Promise<void>;

export async function submitReport(input: BuildReportInput, sink: ReportSink): Promise<VPATReport> {
  const report = buildReport(input);
  await sink(report);
  return report;
}

export function exportToJSON(report: VPATReport): string {
  return JSON.stringify(report, null, 2);
}
