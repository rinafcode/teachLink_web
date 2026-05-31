import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '../../../services/pdf-generation';
import { generateReportHTML, ReportData } from '../../../lib/pdf/templates';

export async function POST(request: NextRequest) {
  try {
    const body: ReportData = await request.json();

    const html = generateReportHTML(body);
    const pdfBuffer = await generatePDF(html);
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
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
