/**
 * SMS Send API Route
 *
 * Handles SMS delivery requests with built-in logging and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api:sms:send');

interface SendSMSRequest {
  eventType: 'verification-code' | 'security-alert' | 'course-enrollment' | 'account-warning';
  phoneNumber: {
    countryCode: string;
    number: string;
  };
  name?: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const requestId = `api_sms_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  logger.info('SMS send API request received', {
    requestId,
    context: {
      method: 'POST',
    },
  });

  try {
    const body: SendSMSRequest = await request.json();

    // Validate request
    if (!body.eventType || !body.phoneNumber) {
      logger.warn('Invalid SMS send request', {
        requestId,
        context: {
          missingFields: [],
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: eventType, phoneNumber',
        },
        { status: 400 }
      );
    }

    logger.info('SMS send request validated', {
      requestId,
      context: {
        eventType: body.eventType,
        phoneNumber: `+${body.phoneNumber.countryCode}${body.phoneNumber.number}`,
      },
    });

    let result;

    switch (body.eventType) {
      case 'verification-code':
        result = await smsService.sendVerificationCode({
          phoneNumber: body.phoneNumber,
          name: body.name,
          ...(body.data as any),
        });
        break;

      case 'security-alert':
        result = await smsService.sendSecurityAlert({
          phoneNumber: body.phoneNumber,
          name: body.name,
          ...(body.data as any),
        });
        break;

      case 'course-enrollment':
        result = await smsService.sendCourseEnrollment({
          phoneNumber: body.phoneNumber,
          name: body.name,
          ...(body.data as any),
        });
        break;

      case 'account-warning':
        result = await smsService.sendAccountWarning({
          phoneNumber: body.phoneNumber,
          name: body.name,
          ...(body.data as any),
        });
        break;

      default:
        logger.error('Unknown SMS event type', {
          requestId,
          context: {
            eventType: body.eventType,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Unknown event type',
          },
          { status: 400 }
        );
    }

    logger.info('SMS send request processed', {
      requestId,
      context: {
        eventType: body.eventType,
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
      },
    });

    return NextResponse.json(
      {
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
        error: result.error,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    logger.error('SMS send API error', {
      requestId,
      context: {
        method: 'POST',
      },
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
