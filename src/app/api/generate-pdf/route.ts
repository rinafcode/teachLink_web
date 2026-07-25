import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '../../../services/pdf-generation';
import { withTimeout } from '@/lib/timeout';
import { generateReportHTML, ReportData } from '../../../lib/pdf/templates';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api-generate-pdf');

export async function POST(request: NextRequest) {
  try {
    const { html, options } = await request.json();

    const pdfBuffer = await withTimeout(
      generatePDF(html, options),
      parseInt(process.env.PDF_TIMEOUT_MS || '30000', 10),
      'PDF generation timed out, please retry'
    );
    const pdfBody = new Uint8Array(
      pdfBuffer.buffer as ArrayBuffer,
      pdfBuffer.byteOffset,
      pdfBuffer.byteLength,
    );
    const pdfBlob = new Blob([pdfBody], { type: 'application/pdf' });

    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === 'PDF generation timed out, please retry') {
      return NextResponse.json(
        { 
          error: 'PDF generation timed out, please retry',
          timeout: parseInt(process.env.PDF_TIMEOUT_MS || '30000', 10),
          retry_after: 5
        },
        { status: 504 }
      );
    }
    logger.error('Error generating PDF', { error });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}