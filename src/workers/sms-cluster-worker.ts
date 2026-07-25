import cluster from 'cluster';
import os from 'os';


const numCPUs = os.cpus().length;

// Security Configuration
const SECURITY_CONFIG = {
  MAX_QUEUE_SIZE: 1000,
  MAX_MESSAGE_LENGTH: 1600,
  MAX_PHONE_NUMBER_LENGTH: 20,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_PER_WINDOW: 100,
  IP_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  IP_RATE_LIMIT_MAX_PER_WINDOW: 200,
  WORKER_MAX_MEMORY_MB: 512,
  WORKER_TIMEOUT_MS: 30000,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT_MS: 300000, // 5 minutes
  DEDUPLICATION_WINDOW_MS: 10000, // 10 seconds
  HEALTH_CHECK_INTERVAL_MS: 30000, // 30 seconds
  MAX_HEALTH_CHECK_FAILURES: 3,
};

// Phone number validation regex (E.164 format)
const PHONE_NUMBER_REGEX = /^\+[1-9]\d{1,14}$/;

// Rate limiting tracker
const rateLimitTracker = new Map<string, number[]>();

// Security event logger
interface SecurityEvent {
  type: 'validation_failure' | 'rate_limit_exceeded' | 'queue_full' | 'worker_timeout' | 'blacklisted_phone' | 'blocked_content' | 'circuit_breaker_opened' | 'circuit_breaker_closed' | 'duplicate_message' | 'health_check_failed';
  timestamp: number;
  details: string;
  workerId?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
}

const securityEvents: SecurityEvent[] = [];

// Phone number blacklist and whitelist
const PHONE_BLACKLIST = new Set<string>([
  // Add blacklisted numbers here
]);

const PHONE_WHITELIST = new Set<string>([
  // Add whitelisted numbers here (if whitelist mode is enabled)
]);
const WHITELIST_MODE_ENABLED = false;

// Blocked content patterns (regex patterns)
const BLOCKED_CONTENT_PATTERNS = [
  /\b(viagra|cialis|porn|xxx|casino|lottery|winner)\b/gi,
  /\b(bitcoin|crypto|investment|profit|guaranteed)\b/gi,
  /http(s?):\/\/[^\s/$.?#].[^\s]*/gi, // Block URLs
];

// IP-based rate limiting tracker
const ipRateLimitTracker = new Map<string, number[]>();

// Circuit breaker state
interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  isOpen: boolean;
}
const circuitBreakerState: CircuitBreakerState = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
};

// Message deduplication tracker
const messageDeduplicationTracker = new Map<string, number>();

// Worker health check state
const workerHealthState = new Map<number, { failures: number; lastCheck: number }>();

function logSecurityEvent(event: SecurityEvent) {
  securityEvents.push(event);
  const severityPrefix = {
    low: '[INFO]',
    medium: '[WARN]',
    high: '[ERROR]',
    critical: '[CRITICAL]',
  }[event.severity];
  console.error(`${severityPrefix} [SECURITY] ${event.type}: ${event.details}`);
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

function checkRateLimit(phoneNumber: string, ipAddress?: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitTracker.get(phoneNumber) || [];
  
  // Remove timestamps outside the rate limit window
  const validTimestamps = timestamps.filter(t => now - t < SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= SECURITY_CONFIG.RATE_LIMIT_MAX_PER_WINDOW) {
    logSecurityEvent({
      type: 'rate_limit_exceeded',
      timestamp: now,
      details: `Rate limit exceeded for ${phoneNumber}: ${validTimestamps.length} requests in window`,
      severity: 'high',
      ipAddress,
    });
    return false;
  }
  
  validTimestamps.push(now);
  rateLimitTracker.set(phoneNumber, validTimestamps);
  return true;
}

function checkIPRateLimit(ipAddress: string): boolean {
  const now = Date.now();
  const timestamps = ipRateLimitTracker.get(ipAddress) || [];
  
  // Remove timestamps outside the rate limit window
  const validTimestamps = timestamps.filter(t => now - t < SECURITY_CONFIG.IP_RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= SECURITY_CONFIG.IP_RATE_LIMIT_MAX_PER_WINDOW) {
    logSecurityEvent({
      type: 'rate_limit_exceeded',
      timestamp: now,
      details: `IP rate limit exceeded for ${ipAddress}: ${validTimestamps.length} requests in window`,
      severity: 'high',
      ipAddress,
    });
    return false;
  }
  
  validTimestamps.push(now);
  ipRateLimitTracker.set(ipAddress, validTimestamps);
  return true;
}

function checkBlacklistWhitelist(phoneNumber: string): { valid: boolean; reason?: string } {
  if (PHONE_BLACKLIST.has(phoneNumber)) {
    logSecurityEvent({
      type: 'blacklisted_phone',
      timestamp: Date.now(),
      details: `Phone number ${phoneNumber} is blacklisted`,
      severity: 'high',
    });
    return { valid: false, reason: 'Phone number is blacklisted' };
  }

  if (WHITELIST_MODE_ENABLED && !PHONE_WHITELIST.has(phoneNumber)) {
    logSecurityEvent({
      type: 'validation_failure',
      timestamp: Date.now(),
      details: `Phone number ${phoneNumber} is not whitelisted (whitelist mode enabled)`,
      severity: 'medium',
    });
    return { valid: false, reason: 'Phone number is not whitelisted' };
  }

  return { valid: true };
}

function checkBlockedContent(message: string): { valid: boolean; reason?: string; matchedPattern?: string } {
  for (const pattern of BLOCKED_CONTENT_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      logSecurityEvent({
        type: 'blocked_content',
        timestamp: Date.now(),
        details: `Message contains blocked content pattern: ${pattern.source}`,
        severity: 'high',
      });
      return { valid: false, reason: 'Message contains blocked content', matchedPattern: pattern.source };
    }
  }
  return { valid: true };
}

function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  if (circuitBreakerState.isOpen) {
    // Check if we should attempt to close the circuit breaker
    if (now - circuitBreakerState.lastFailureTime > SECURITY_CONFIG.CIRCUIT_BREAKER_TIMEOUT_MS) {
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failureCount = 0;
      logSecurityEvent({
        type: 'circuit_breaker_closed',
        timestamp: now,
        details: 'Circuit breaker closed after timeout',
        severity: 'medium',
      });
      return true;
    }
    return false;
  }
  
  return true;
}

function recordCircuitBreakerFailure(): void {
  const now = Date.now();
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = now;
  
  if (circuitBreakerState.failureCount >= SECURITY_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    logSecurityEvent({
      type: 'circuit_breaker_opened',
      timestamp: now,
      details: `Circuit breaker opened after ${circuitBreakerState.failureCount} failures`,
      severity: 'critical',
    });
  }
}

function checkMessageDeduplication(to: string, message: string): boolean {
  const now = Date.now();
  const key = `${to}:${message}`;
  const lastSent = messageDeduplicationTracker.get(key);
  
  if (lastSent && now - lastSent < SECURITY_CONFIG.DEDUPLICATION_WINDOW_MS) {
    logSecurityEvent({
      type: 'duplicate_message',
      timestamp: now,
      details: `Duplicate message detected for ${to} within deduplication window`,
      severity: 'low',
    });
    return false;
  }
  
  messageDeduplicationTracker.set(key, now);
  
  // Clean up old entries
  for (const [k, t] of messageDeduplicationTracker.entries()) {
    if (now - t > SECURITY_CONFIG.DEDUPLICATION_WINDOW_MS) {
      messageDeduplicationTracker.delete(k);
    }
  }
  
  return true;
}

function sanitizeAndValidateSMS(to: string, message: string, ipAddress?: string): { valid: boolean; sanitized?: { to: string; message: string }; reason?: string } {
  // Check circuit breaker first
  if (!checkCircuitBreaker()) {
    return { valid: false, reason: 'Circuit breaker is open, system is cooling down' };
  }
  
  const phoneValidation = validatePhoneNumber(to);
  if (!phoneValidation.valid) {
    logSecurityEvent({
      type: 'validation_failure',
      timestamp: Date.now(),
      details: `Phone validation failed: ${phoneValidation.reason}`,
      severity: 'medium',
      ipAddress,
    });
    return { valid: false, reason: phoneValidation.reason };
  }

  const blacklistWhitelistCheck = checkBlacklistWhitelist(to);
  if (!blacklistWhitelistCheck.valid) {
    return { valid: false, reason: blacklistWhitelistCheck.reason };
  }

  const messageValidation = validateMessage(message);
  if (!messageValidation.valid) {
    logSecurityEvent({
      type: 'validation_failure',
      timestamp: Date.now(),
      details: `Message validation failed: ${messageValidation.reason}`,
      severity: 'medium',
      ipAddress,
    });
    return { valid: false, reason: messageValidation.reason };
  }

  const contentCheck = checkBlockedContent(message);
  if (!contentCheck.valid) {
    return { valid: false, reason: contentCheck.reason };
  }

  if (!checkRateLimit(to, ipAddress)) {
    return { valid: false, reason: 'Rate limit exceeded' };
  }

  if (ipAddress && !checkIPRateLimit(ipAddress)) {
    return { valid: false, reason: 'IP rate limit exceeded' };
  }

  if (!checkMessageDeduplication(to, message)) {
    return { valid: false, reason: 'Duplicate message detected' };
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
  const validation = sanitizeAndValidateSMS(phone, message, '127.0.0.1');
  if (validation.valid) {
    smsQueue.enqueue(validation.sanitized!.to, validation.sanitized!.message);
  }
}

export const startSMSClusterWorker = () => {
  if (cluster.isPrimary) {


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


      cluster.fork(); // Auto-heal workers
    });

    // Periodic security audit log
    setInterval(() => {
      console.log(`[SECURITY AUDIT] Queue size: ${smsQueue.length}, Active workers: ${Object.keys(cluster.workers || {}).length}`);
      console.log(`[SECURITY AUDIT] Total security events: ${securityEvents.length}`);
      console.log(`[SECURITY AUDIT] Circuit breaker state: ${circuitBreakerState.isOpen ? 'OPEN' : 'CLOSED'}, Failures: ${circuitBreakerState.failureCount}`);
      console.log(`[SECURITY AUDIT] Rate limit trackers: Phone numbers tracked: ${rateLimitTracker.size}, IPs tracked: ${ipRateLimitTracker.size}`);
      console.log(`[SECURITY AUDIT] Deduplication tracker size: ${messageDeduplicationTracker.size}`);
    }, 60000); // Every minute
  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server or a message queue listener


    const processQueue = async () => {
      const messageJob = smsQueue.dequeue();
      if (messageJob) {
        const startTime = Date.now();
        try {

        }
      }

      // Continue polling with a small delay to prevent tight loop
      setTimeout(processQueue, 1000);
    };

    // Worker health check
    const performHealthCheck = () => {
      const now = Date.now();
      const healthState = workerHealthState.get(workerId) || { failures: 0, lastCheck: now };
      
      // Simulate health check (in real app, check actual worker metrics)
      const isHealthy = process.memoryUsage().heapUsed < SECURITY_CONFIG.WORKER_MAX_MEMORY_MB * 1024 * 1024;
      
      if (!isHealthy) {
        healthState.failures++;
        logSecurityEvent({
          type: 'health_check_failed',
          timestamp: now,
          details: `Worker ${workerId} health check failed. Failure count: ${healthState.failures}`,
          workerId,
          severity: healthState.failures >= SECURITY_CONFIG.MAX_HEALTH_CHECK_FAILURES ? 'critical' : 'medium',
        });
        
        if (healthState.failures >= SECURITY_CONFIG.MAX_HEALTH_CHECK_FAILURES) {
          console.error(`[Worker ${workerId}] Exceeded max health check failures, restarting...`);
          process.exit(1);
        }
      } else {
        healthState.failures = 0;
      }
      
      healthState.lastCheck = now;
      workerHealthState.set(workerId, healthState);
    };
    
    setInterval(performHealthCheck, SECURITY_CONFIG.HEALTH_CHECK_INTERVAL_MS);

    processQueue();
  }
};

// Export security functions for external use
export { sanitizeAndValidateSMS };

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

export function getIPRateLimitStatus(ipAddress: string): { remaining: number; resetTime: number } {
  const now = Date.now();
  const timestamps = ipRateLimitTracker.get(ipAddress) || [];
  const validTimestamps = timestamps.filter(t => now - t < SECURITY_CONFIG.IP_RATE_LIMIT_WINDOW_MS);
  const remaining = Math.max(0, SECURITY_CONFIG.IP_RATE_LIMIT_MAX_PER_WINDOW - validTimestamps.length);
  const oldestTimestamp = validTimestamps.length > 0 ? Math.min(...validTimestamps) : now;
  const resetTime = oldestTimestamp + SECURITY_CONFIG.IP_RATE_LIMIT_WINDOW_MS;
  
  return { remaining, resetTime };
}

export function getCircuitBreakerStatus(): { isOpen: boolean; failureCount: number; lastFailureTime: number } {
  return {
    isOpen: circuitBreakerState.isOpen,
    failureCount: circuitBreakerState.failureCount,
    lastFailureTime: circuitBreakerState.lastFailureTime,
  };
}

export function addToPhoneBlacklist(phoneNumber: string): void {
  PHONE_BLACKLIST.add(phoneNumber);
  logSecurityEvent({
    type: 'blacklisted_phone',
    timestamp: Date.now(),
    details: `Phone number ${phoneNumber} added to blacklist`,
    severity: 'medium',
  });
}

export function removeFromPhoneBlacklist(phoneNumber: string): void {
  PHONE_BLACKLIST.delete(phoneNumber);
}

export function addToPhoneWhitelist(phoneNumber: string): void {
  PHONE_WHITELIST.add(phoneNumber);
}

export function removeFromPhoneWhitelist(phoneNumber: string): void {
  PHONE_WHITELIST.delete(phoneNumber);
}

export function setWhitelistMode(enabled: boolean): void {
  WHITELIST_MODE_ENABLED = enabled;
}

export function addBlockedContentPattern(pattern: string): void {
  BLOCKED_CONTENT_PATTERNS.push(new RegExp(pattern, 'gi'));
}

export function getWorkerHealthStatus(workerId: number): { isHealthy: boolean; failures: number; lastCheck: number } {
  const healthState = workerHealthState.get(workerId);
  if (!healthState) {
    return { isHealthy: true, failures: 0, lastCheck: Date.now() };
  }
  return {
    isHealthy: healthState.failures < SECURITY_CONFIG.MAX_HEALTH_CHECK_FAILURES,
    failures: healthState.failures,
    lastCheck: healthState.lastCheck,
  };
}

// In a real entrypoint file, you'd call this:
// if (require.main === module) {
//   startSMSClusterWorker();
// }
