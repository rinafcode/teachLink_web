/**
 * Export Notification Service
 * Handles email notifications for export completion
 */

import { EmailMessage } from '@/lib/email/types';
import { ExportNotification } from './types';

export class ExportNotificationService {
  /**
   * Send export completion notification
   */
  async sendExportNotification(notification: ExportNotification): Promise<void> {
    const message = this.buildNotificationEmail(notification);

    // In production, this would use the email queue
    // For now, we'll log it
    console.log('Export notification:', message);

    // Uncomment when email service is configured:
    // const { EmailQueue } = await import('@/lib/email/queue');
    // const { emailProvider } = await import('@/lib/email/provider');
    // const queue = new EmailQueue(emailProvider);
    // await queue.enqueue(message);
  }

  /**
   * Build email message for export notification
   */
  private buildNotificationEmail(notification: ExportNotification): EmailMessage {
    const { status, email, fileName, downloadUrl, error } = notification;

    let subject: string;
    let html: string;
    let text: string;

    if (status === 'completed' && downloadUrl) {
      subject = `Export Ready: ${fileName}`;
      html = this.buildSuccessEmailHTML(fileName!, downloadUrl);
      text = this.buildSuccessEmailText(fileName!, downloadUrl);
    } else if (status === 'failed') {
      subject = `Export Failed: ${fileName || 'Unknown'}`;
      html = this.buildFailureEmailHTML(fileName, error);
      text = this.buildFailureEmailText(fileName, error);
    } else {
      subject = `Export Status: ${status}`;
      html = `<p>Your export is currently ${status}.</p>`;
      text = `Your export is currently ${status}.`;
    }

    return {
      to: { email },
      subject,
      html,
      text,
    };
  }

  private buildSuccessEmailHTML(fileName: string, downloadUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Export Complete</h1>
    </div>
    <div class="content">
      <p>Your data export has been completed successfully!</p>
      <p><strong>File:</strong> ${fileName}</p>
      <p>Click the button below to download your file:</p>
      <p style="text-align: center;">
        <a href="${downloadUrl}" class="button">Download Export</a>
      </p>
      <p><small>This link will expire in 7 days.</small></p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Export Scheduler.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildSuccessEmailText(fileName: string, downloadUrl: string): string {
    return `
Export Complete

Your data export has been completed successfully!

File: ${fileName}

Download your file here: ${downloadUrl}

This link will expire in 7 days.

---
This is an automated message from the Export Scheduler.
    `.trim();
  }

  private buildFailureEmailHTML(fileName: string | undefined, error: string | undefined): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .error { background-color: #ffebee; border-left: 4px solid #f44336; padding: 12px; margin: 16px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✗ Export Failed</h1>
    </div>
    <div class="content">
      <p>Unfortunately, your data export could not be completed.</p>
      ${fileName ? `<p><strong>File:</strong> ${fileName}</p>` : ''}
      ${error ? `<div class="error"><strong>Error:</strong> ${error}</div>` : ''}
      <p>Please try again or contact support if the problem persists.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Export Scheduler.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildFailureEmailText(fileName: string | undefined, error: string | undefined): string {
    return `
Export Failed

Unfortunately, your data export could not be completed.

${fileName ? `File: ${fileName}` : ''}
${error ? `Error: ${error}` : ''}

Please try again or contact support if the problem persists.

---
This is an automated message from the Export Scheduler.
    `.trim();
  }
}

export const notificationService = new ExportNotificationService();
