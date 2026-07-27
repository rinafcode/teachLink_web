import cluster from 'cluster';
import { 
  startSMSClusterWorker, 
  sanitizeAndValidateSMS, 
  getSecurityEvents,
  getQueueSize,
  getRateLimitStatus 
} from '../sms-cluster-worker';

jest.mock('cluster', () => ({
  isPrimary: true,
  fork: jest.fn(),
  on: jest.fn(),
}));

jest.mock('os', () => ({
  cpus: () => new Array(4).fill({}),
}));

describe('SMS Cluster Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear security events before each test
    const events = getSecurityEvents();
    events.length = 0;
  });

  describe('Cluster Management', () => {
    it('should fork a worker for each CPU if primary', () => {
      Object.defineProperty(cluster, 'isPrimary', { value: true, configurable: true });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      startSMSClusterWorker();

      expect(cluster.fork).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Setting up cluster with 4 workers'),
      );

      consoleSpy.mockRestore();
    });

    it('should bind an exit handler to auto-heal workers', () => {
      Object.defineProperty(cluster, 'isPrimary', { value: true, configurable: true });

      startSMSClusterWorker();

      expect(cluster.on).toHaveBeenCalledWith('exit', expect.any(Function));
    });

    it('should execute worker logic if not primary', () => {
      Object.defineProperty(cluster, 'isPrimary', { value: false, configurable: true });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      startSMSClusterWorker();

      expect(cluster.fork).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Worker'));

      consoleSpy.mockRestore();
    });

    it('should set worker resource limits', () => {
      Object.defineProperty(cluster, 'isPrimary', { value: true, configurable: true });

      startSMSClusterWorker();

      expect(cluster.fork).toHaveBeenCalledWith(
        expect.objectContaining({
          WORKER_ID: expect.any(Number),
          NODE_OPTIONS: expect.stringContaining('--max-old-space-size=512'),
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate correct phone numbers', () => {
      const result = sanitizeAndValidateSMS('+15551234567', 'Test message');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should reject invalid phone number format', () => {
      const result = sanitizeAndValidateSMS('5551234567', 'Test message');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid phone number format');
    });

    it('should reject phone numbers that are too long', () => {
      const result = sanitizeAndValidateSMS('+155512345678901234567', 'Test message');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too long');
    });

    it('should reject non-string phone numbers', () => {
      const result = sanitizeAndValidateSMS(1234567890 as any, 'Test message');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must be a string');
    });

    it('should reject empty messages', () => {
      const result = sanitizeAndValidateSMS('+15551234567', '');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('cannot be empty');
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(2000);
      const result = sanitizeAndValidateSMS('+15551234567', longMessage);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too long');
    });

    it('should sanitize message content', () => {
      const result = sanitizeAndValidateSMS('+15551234567', '<script>alert("xss")</script>');
      expect(result.valid).toBe(true);
      expect(result.sanitized?.message).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow messages within rate limit', () => {
      for (let i = 0; i < 50; i++) {
        const result = sanitizeAndValidateSMS('+15551234567', `Test message ${i}`);
        expect(result.valid).toBe(true);
      }
    });

    it('should enforce rate limit after threshold', () => {
      // Send 100 messages (should hit the limit)
      for (let i = 0; i < 100; i++) {
        sanitizeAndValidateSMS('+15551234567', `Test message ${i}`);
      }

      // 101st message should be rate limited
      const result = sanitizeAndValidateSMS('+15551234567', 'Test message 100');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Rate limit exceeded');
    });

    it('should track rate limit status correctly', () => {
      for (let i = 0; i < 50; i++) {
        sanitizeAndValidateSMS('+15551234567', `Test message ${i}`);
      }

      const status = getRateLimitStatus('+15551234567');
      expect(status.remaining).toBeLessThanOrEqual(50);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('Security Event Logging', () => {
    it('should log validation failures', () => {
      sanitizeAndValidateSMS('invalid', 'Test message');
      const events = getSecurityEvents();
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].type).toBe('validation_failure');
    });

    it('should log rate limit exceeded events', () => {
      for (let i = 0; i < 101; i++) {
        sanitizeAndValidateSMS('+15551234567', `Test message ${i}`);
      }
      
      const events = getSecurityEvents();
      const rateLimitEvents = events.filter(e => e.type === 'rate_limit_exceeded');
      expect(rateLimitEvents.length).toBeGreaterThan(0);
    });

    it('should limit security event history size', () => {
      // Generate more than 1000 events
      for (let i = 0; i < 1100; i++) {
        sanitizeAndValidateSMS(`+155512345${i % 100}`, `Test message ${i}`);
      }
      
      const events = getSecurityEvents();
      expect(events.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Queue Management', () => {
    it('should return current queue size', () => {
      const size = getQueueSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });
});
