import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import {
  generateCertificate,
  CertificateServiceError,
} from '@/services/certificate-service';
import type { ApiResponse } from '@/types/api';

export const runtime = 'edge';

interface GenerateCertificateRequest {
  userId: string;
  courseId: string;
  userName: string;
  courseTitle: string;
}

export async function POST(request: Request) {
  edgeLog('info', '/api/certificates/generate', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = (await request.json()) as GenerateCertificateRequest;

    // Validate required fields
    if (!body.userId || !body.courseId || !body.userName || !body.courseTitle) {
      return addHeaders(
        NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: userId, courseId, userName, courseTitle',
          },
          { status: 400 }
        )
      );
    }

    // Generate certificate with progress validation
    const certificate = await generateCertificate({
      userId: body.userId,
      courseId: body.courseId,
      userName: body.userName,
      courseTitle: body.courseTitle,
      completionDate: new Date().toISOString(),
    });

    return addHeaders(
      NextResponse.json({
        success: true,
        message: 'Certificate generated successfully',
        data: certificate,
      })
    );
  } catch (error) {
    if (error instanceof CertificateServiceError) {
      // Handle specific certificate service errors
      if (error.statusCode === 403) {
        return addHeaders(
          NextResponse.json(
            {
              success: false,
              error: 'Course not completed',
            },
            { status: 403 }
          )
        );
      }

      if (error.statusCode === 404) {
        return addHeaders(
          NextResponse.json(
            {
              success: false,
              error: 'Course progress not found',
            },
            { status: 404 }
          )
        );
      }

      // Other certificate service errors
      return addHeaders(
        NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: error.statusCode }
        )
      );
    }

    // Generic error handling
    edgeLog('error', '/api/certificates/generate', 'Unexpected error', error);
    return addHeaders(
      NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        },
        { status: 500 }
      )
    );
  }
}
