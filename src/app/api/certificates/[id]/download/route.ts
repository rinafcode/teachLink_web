import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { getCertificateById, getCertificateForDownload } from '@/services/certificate-service';
import { generatePDF } from '@/services/pdf-generation';

const logger = createLogger('certificates-download');

/**
 * GET /api/certificates/:id/download
 *
 * Download certificate as PDF.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T6: Served via authenticated API (not direct file URL)
 * ✓ T8: Audit logging of downloads
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Certificate download attempt without auth');
    return authError;
  }

  const certificateId = params.id;
  const userId = request.headers.get('x-user-id') || 'anonymous';

  if (userId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // Fetch certificate
    const certificate = await getCertificateById(certificateId);

    if (!certificate) {
      logger.warn('Certificate not found for download', {
        context: { certificateId, requesterId: userId },
      });

      // T8 MITIGATION: Log failed attempt
      appendAuditLog({
        actorId: userId,
        action: 'update',
        targetType: 'certificate',
        targetId: certificateId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 404,
        metadata: { reason: 'not_found', action: 'download' },
      });

      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // T1 MITIGATION: Ownership verification (IDOR prevention)
    if (certificate.userId !== userId) {
      logger.warn('Unauthorized certificate download attempt', {
        context: {
          requesterId: userId,
          certificateId,
          ownerId: certificate.userId,
        },
      });

      // T8 MITIGATION: Log failed access attempt
      appendAuditLog({
        actorId: userId,
        action: 'update',
        targetType: 'certificate',
        targetId: certificateId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: {
          reason: 'unauthorized_access',
          certificateOwnerId: certificate.userId,
          action: 'download',
        },
      });

      // Return 404 to avoid leaking certificate existence
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if certificate is revoked
    if (certificate.revokedAt) {
      logger.warn('Download of revoked certificate attempted', {
        context: { certificateId, userId },
      });

      appendAuditLog({
        actorId: userId,
        action: 'update',
        targetType: 'certificate',
        targetId: certificateId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 410,
        metadata: { reason: 'certificate_revoked' },
      });

      return NextResponse.json({ error: 'Certificate has been revoked' }, { status: 410 });
    }

    // Generate PDF from certificate data
    const html = generateCertificateHTML(certificate);

    // TODO: Add timeout protection for PDF generation
    // Currently Puppeteer may hang on malicious HTML
    // Implement: Promise.race(generatePDF(html), timeout(30000))
    const pdfBuffer = await generatePDF(html);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation resulted in empty buffer');
    }

    // T8 MITIGATION: Log successful download
    appendAuditLog({
      actorId: userId,
      action: 'update',
      targetType: 'certificate',
      targetId: certificateId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
      metadata: {
        action: 'download',
        pdfSizeBytes: pdfBuffer.length,
      },
    });

    logger.info('Certificate downloaded successfully', {
      context: { certificateId, userId, pdfSizeBytes: pdfBuffer.length },
    });

    // T6 MITIGATION: Serve via authenticated API with proper headers
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const fileName = `Certificate-${certificate.certificateId}.pdf`;

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    logger.error('Certificate download error', {
      context: { certificateId, userId },
      error,
    });

    // T8 MITIGATION: Log error
    appendAuditLog({
      actorId: userId,
      action: 'update',
      targetType: 'certificate',
      targetId: certificateId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to generate certificate PDF' }, { status: 500 });
  }
}

/**
 * Generate HTML for certificate PDF.
 *
 * SECURITY: All fields in the certificate record are already sanitized
 * at generation time, so they can be safely interpolated into HTML.
 *
 * The name and courseName fields have been through input validation
 * which stripped dangerous HTML tags and patterns.
 */
function generateCertificateHTML(cert: any): string {
  const { name, courseName, completionDate, issuedAt } = cert;

  // Format dates
  const completedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const issuedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate HTML with proper escaping
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Certificate</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Georgia', serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .certificate {
          background: white;
          width: 100%;
          max-width: 900px;
          height: 600px;
          padding: 60px 80px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          border: 5px solid #d4af37;
          position: relative;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 2px solid #d4af37;
          pointer-events: none;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .header h1 {
          font-size: 48px;
          color: #667eea;
          margin-bottom: 10px;
          font-weight: normal;
          letter-spacing: 3px;
        }
        .header p {
          font-size: 20px;
          color: #666;
          font-style: italic;
        }
        .body {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
        }
        .body p {
          font-size: 16px;
          color: #333;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .recipient-name {
          font-size: 36px;
          color: #764ba2;
          font-weight: bold;
          margin-bottom: 20px;
          text-decoration: underline;
        }
        .course-name {
          font-size: 18px;
          color: #555;
          margin-bottom: 30px;
          font-style: italic;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: 40px;
          position: relative;
          z-index: 1;
          font-size: 12px;
          color: #666;
        }
        .footer-left, .footer-right {
          text-align: center;
        }
        .line {
          width: 150px;
          height: 1px;
          background: #333;
          margin: 10px auto;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <h1>Certificate of Completion</h1>
          <p>TeachLink</p>
        </div>
        
        <div class="body">
          <p>This is to certify that</p>
          <div class="recipient-name">${escapeHtml(name)}</div>
          <p>has successfully completed the course</p>
          <div class="course-name">${escapeHtml(courseName)}</div>
          <p>Completed on ${completedDate}</p>
        </div>
        
        <div class="footer">
          <div class="footer-left">
            <p>Authorized Signature</p>
            <div class="line"></div>
          </div>
          <div class="footer-right">
            <p>Issued: ${issuedDate}</p>
            <p>Certificate ID: ${cert.certificateId.substring(0, 8)}...</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Extract client IP from request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
}
