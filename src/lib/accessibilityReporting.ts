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
