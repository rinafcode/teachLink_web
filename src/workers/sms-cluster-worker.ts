import cluster from 'cluster';
import os from 'os';
import { sendSMS } from '../utils/notificationUtils'; // Assuming we have this or we'll mock it
import { sanitizeString } from '../lib/security';

const numCPUs = os.cpus().length;

// Security Configuration
const SECURITY_CONFIG = {
  MAX_QUEUE_SIZE: 1000,
  MAX_MESSAGE_LENGTH: 1600,
  MAX_PHONE_NUMBER_LENGTH: 20,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_PER_WINDOW: 100,
  WORKER_MAX_MEMORY_MB: 512,
  WORKER_TIMEOUT_MS: 30000,
};

// Phone number validation regex (E.164 format)
const PHONE_NUMBER_REGEX = /^\+[1-9]\d{1,14}$/;

// Rate limiting tracker
const rateLimitTracker = new Map<string, number[]>();

// Security event logger
interface SecurityEvent {
  type: 'validation_failure' | 'rate_limit_exceeded' | 'queue_full' | 'worker_timeout';
  timestamp: number;
  details: string;
  workerId?: number;
}

const securityEvents: SecurityEvent[] = [];

function logSecurityEvent(event: SecurityEvent) {
  securityEvents.push(event);
  console.error(`[SECURITY] ${event.type}: ${event.details}`);
  if (securityEvents.length > 1000) {
    securityEvents.shift(); // Keep only last 1000 events
  }
}

// Mock Queue implementation with security controls
class SMSQueue {
  private messages: { to: string; message: string; timestamp: number }[] = [];

  enqueue(to: string, message: string): boolean {
    if (this.messages.length >= SECURITY_CONFIG.MAX_QUEUE_SIZE) {
      logSecurityEvent({
        type: 'queue_full',
        timestamp: Date.now(),
        details: `Queue rejected message. Current size: ${this.messages.length}`,
      });
      return false;
    }
    this.messages.push({ to, message, timestamp: Date.now() });
    return true;
  }

  dequeue() {
    return this.messages.shift();
  }

  get length() {
    return this.messages.length;
  }
}

const smsQueue = new SMSQueue();

// Input validation and sanitization
function validatePhoneNumber(phone: string): { valid: boolean; reason?: string } {
  if (typeof phone !== 'string') {
    return { valid: false, reason: 'Phone number must be a string' };
  }
  if (phone.length > SECURITY_CONFIG.MAX_PHONE_NUMBER_LENGTH) {
    return { valid: false, reason: 'Phone number too long' };
  }
  if (!PHONE_NUMBER_REGEX.test(phone)) {
    return { valid: false, reason: 'Invalid phone number format (must be E.164)' };
  }
  return { valid: true };
}

function validateMessage(message: string): { valid: boolean; reason?: string } {
  if (typeof message !== 'string') {
    return { valid: false, reason: 'Message must be a string' };
  }
  if (message.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
    return { valid: false, reason: 'Message too long' };
  }
  if (message.trim().length === 0) {
    return { valid: false, reason: 'Message cannot be empty' };
  }
  return { valid: true };
}

function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitTracker.get(phoneNumber) || [];
  
  // Remove timestamps outside the rate limit window
  const validTimestamps = timestamps.filter(t => now - t < SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= SECURITY_CONFIG.RATE_LIMIT_MAX_PER_WINDOW) {
    logSecurityEvent({
      type: 'rate_limit_exceeded',
      timestamp: now,
      details: `Rate limit exceeded for ${phoneNumber}: ${validTimestamps.length} requests in window`,
    });
    return false;
  }
  
  validTimestamps.push(now);
  rateLimitTracker.set(phoneNumber, validTimestamps);
  return true;
}

function sanitizeAndValidateSMS(to: string, message: string): { valid: boolean; sanitized?: { to: string; message: string }; reason?: string } {
  const phoneValidation = validatePhoneNumber(to);
  if (!phoneValidation.valid) {
    logSecurityEvent({
      type: 'validation_failure',
      timestamp: Date.now(),
      details: `Phone validation failed: ${phoneValidation.reason}`,
    });
    return { valid: false, reason: phoneValidation.reason };
  }

  const messageValidation = validateMessage(message);
  if (!messageValidation.valid) {
    logSecurityEvent({
      type: 'validation_failure',
      timestamp: Date.now(),
      details: `Message validation failed: ${messageValidation.reason}`,
    });
    return { valid: false, reason: messageValidation.reason };
  }

  if (!checkRateLimit(to)) {
    return { valid: false, reason: 'Rate limit exceeded' };
  }

  // Sanitize message content
  const sanitizedMessage = sanitizeString(message);

  return {
    valid: true,
    sanitized: { to, message: sanitizedMessage },
  };
}

// Seed queue for demonstration (with validation)
for (let i = 0; i < 50; i++) {
  const phone = `+155512345${i.toString().padStart(2, '0')}`;
  const message = `Test message ${i}`;
  const validation = sanitizeAndValidateSMS(phone, message);
  if (validation.valid) {
    smsQueue.enqueue(validation.sanitized!.to, validation.sanitized!.message);
  }
}

export const startSMSClusterWorker = () => {
  if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    console.log(`Setting up cluster with ${numCPUs} workers for SMS processing...`);
    console.log(`Security config: Max queue size=${SECURITY_CONFIG.MAX_QUEUE_SIZE}, Rate limit=${SECURITY_CONFIG.RATE_LIMIT_MAX_PER_WINDOW}/min`);

    // Fork workers with resource limits
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork({
        WORKER_ID: i,
        NODE_OPTIONS: `--max-old-space-size=${SECURITY_CONFIG.WORKER_MAX_MEMORY_MB}`,
      });

      // Set worker timeout
      setTimeout(() => {
        if (worker.isConnected()) {
          logSecurityEvent({
            type: 'worker_timeout',
            timestamp: Date.now(),
            details: `Worker ${worker.process.pid} exceeded timeout, restarting`,
            workerId: i,
          });
          worker.kill();
        }
      }, SECURITY_CONFIG.WORKER_TIMEOUT_MS);
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      logSecurityEvent({
        type: 'worker_timeout',
        timestamp: Date.now(),
        details: `Worker ${worker.process.pid} exited unexpectedly. Code: ${code}, Signal: ${signal}`,
      });
      console.log('Starting a new worker...');
      cluster.fork(); // Auto-heal workers
    });

    // Periodic security audit log
    setInterval(() => {
      console.log(`[SECURITY AUDIT] Queue size: ${smsQueue.length}, Active workers: ${Object.keys(cluster.workers || {}).length}`);
      console.log(`[SECURITY AUDIT] Total security events: ${securityEvents.length}`);
    }, 60000); // Every minute
  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server or a message queue listener
    const workerId = process.env.WORKER_ID ? parseInt(process.env.WORKER_ID) : process.pid;
    console.log(`Worker ${process.pid} (ID: ${workerId}) started for SMS processing`);

    const processQueue = async () => {
      const messageJob = smsQueue.dequeue();
      if (messageJob) {
        const startTime = Date.now();
        try {
          console.log(`[Worker ${process.pid}] Processing SMS for ${messageJob.to}...`);
          
          // Validate before processing (double-check)
          const validation = sanitizeAndValidateSMS(messageJob.to, messageJob.message);
          if (!validation.valid) {
            console.error(`[Worker ${process.pid}] Validation failed: ${validation.reason}`);
            return;
          }

          // Note: In a real app we'd use sendSMS(messageJob.to, messageJob.message)
          // For now we just mock the delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100));
          
          const processingTime = Date.now() - startTime;
          console.log(`[Worker ${process.pid}] Successfully sent SMS to ${messageJob.to} in ${processingTime}ms`);
        } catch (error) {
          console.error(`[Worker ${process.pid}] Failed to send SMS:`, error);
          logSecurityEvent({
            type: 'validation_failure',
            timestamp: Date.now(),
            details: `SMS processing failed for ${messageJob.to}: ${error}`,
            workerId,
          });
        }
      }

      // Continue polling with a small delay to prevent tight loop
      setTimeout(processQueue, 1000);
    };

    processQueue();
  }
};

// Export security functions for external use
export { sanitizeAndValidateSMS, getSecurityEvents };

export function getSecurityEvents(): SecurityEvent[] {
  return [...securityEvents];
}

export function getQueueSize(): number {
  return smsQueue.length;
}

export function getRateLimitStatus(phoneNumber: string): { remaining: number; resetTime: number } {
  const now = Date.now();
  const timestamps = rateLimitTracker.get(phoneNumber) || [];
  const validTimestamps = timestamps.filter(t => now - t < SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS);
  const remaining = Math.max(0, SECURITY_CONFIG.RATE_LIMIT_MAX_PER_WINDOW - validTimestamps.length);
  const oldestTimestamp = validTimestamps.length > 0 ? Math.min(...validTimestamps) : now;
  const resetTime = oldestTimestamp + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS;
  
  return { remaining, resetTime };
}

// In a real entrypoint file, you'd call this:
// if (require.main === module) {
//   startSMSClusterWorker();
// }
