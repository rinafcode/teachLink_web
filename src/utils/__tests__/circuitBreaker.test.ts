import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, createToastCircuitBreaker, CircuitState, CircuitBreakerConfig } from '../circuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let config: CircuitBreakerConfig;

  beforeEach(() => {
    config = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 5000,
      maxConcurrentRequests: 5,
    };
    circuitBreaker = new CircuitBreaker(config);
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.isClosed()).toBe(true);
    });

    it('should have zero metrics initially', () => {
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalFailures).toBe(0);
      expect(metrics.totalSuccesses).toBe(0);
    });
  });

  describe('Successful Operations', () => {
    it('should execute successful operations', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should handle synchronous operations', async () => {
      const operation = vi.fn().mockReturnValue('sync');
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('sync');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should remain CLOSED after successful operations', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      await circuitBreaker.execute(operation);
      await circuitBreaker.execute(operation);
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Failed Operations', () => {
    it('should track failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('test error');
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalFailures).toBe(1);
      expect(metrics.failureCount).toBe(1);
    });

    it('should open circuit after failure threshold is reached', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Fail enough times to reach threshold
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.isClosed()).toBe(false);
    });

    it('should reject immediately when circuit is OPEN', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      // Try to execute again
      await expect(circuitBreaker.execute(vi.fn())).rejects.toThrow('Circuit breaker is OPEN');
      
      // Operation should not be called
      expect(operation).toHaveBeenCalledTimes(config.failureThreshold);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback when circuit is OPEN', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      const fallback = vi.fn().mockReturnValue('fallback');
      
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      const result = await circuitBreaker.execute(vi.fn(), fallback);
      
      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should use fallback on operation failure', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      const fallback = vi.fn().mockReturnValue('fallback');
      
      const result = await circuitBreaker.execute(operation, fallback);
      
      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery (HALF_OPEN state)', () => {
    it('should transition to HALF_OPEN after timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, config.timeout + 100));
      
      // Next operation should transition to HALF_OPEN
      const successOperation = vi.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successOperation);
      
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, config.timeout + 100));
      
      // Execute successful operations
      const successOperation = vi.fn().mockResolvedValue('success');
      for (let i = 0; i < config.successThreshold; i++) {
        await circuitBreaker.execute(successOperation);
      }
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, config.timeout + 100));
      
      // Execute one success to go to HALF_OPEN
      const successOperation = vi.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successOperation);
      
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      
      // Fail again
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Concurrent Request Limit', () => {
    it('should limit concurrent requests', async () => {
      const slowOperation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const promises = [];
      for (let i = 0; i < config.maxConcurrentRequests + 2; i++) {
        promises.push(circuitBreaker.execute(slowOperation));
      }
      
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected');
      
      expect(failures.length).toBeGreaterThan(0);
    });

    it('should use fallback when concurrent limit reached', async () => {
      const slowOperation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      const fallback = vi.fn().mockReturnValue('fallback');
      
      const promises = [];
      for (let i = 0; i < config.maxConcurrentRequests + 2; i++) {
        promises.push(circuitBreaker.execute(slowOperation, fallback));
      }
      
      const results = await Promise.all(promises);
      
      expect(results.some(r => r === 'fallback')).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('should track all metrics correctly', async () => {
      const successOp = vi.fn().mockResolvedValue('success');
      const failOp = vi.fn().mockRejectedValue(new Error('error'));
      
      // Mix of successes and failures
      await circuitBreaker.execute(successOp);
      await circuitBreaker.execute(successOp);
      await expect(circuitBreaker.execute(failOp)).rejects.toThrow();
      await circuitBreaker.execute(successOp);
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.totalSuccesses).toBe(3);
      expect(metrics.totalFailures).toBe(1);
      expect(metrics.failureCount).toBe(1);
    });

    it('should include last failure time', async () => {
      const failOp = vi.fn().mockRejectedValue(new Error('error'));
      
      await expect(circuitBreaker.execute(failOp)).rejects.toThrow();
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.lastFailureTime).toBeDefined();
      expect(metrics.lastFailureTime).toBeGreaterThan(Date.now() - 1000);
    });

    it('should include last state change time', async () => {
      const failOp = vi.fn().mockRejectedValue(new Error('error'));
      
      await expect(circuitBreaker.execute(failOp)).rejects.toThrow();
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.lastStateChange).toBeDefined();
    });
  });

  describe('Reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      const failOp = vi.fn().mockRejectedValue(new Error('error'));
      
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(failOp)).rejects.toThrow();
      }
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.isClosed()).toBe(true);
    });

    it('should reset all metrics', async () => {
      const failOp = vi.fn().mockRejectedValue(new Error('error'));
      
      // Generate some activity
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(failOp)).rejects.toThrow();
      }
      
      circuitBreaker.reset();
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.lastFailureTime).toBeUndefined();
    });
  });

  describe('createToastCircuitBreaker', () => {
    it('should create circuit breaker with default config', () => {
      const cb = createToastCircuitBreaker();
      expect(cb).toBeInstanceOf(CircuitBreaker);
      expect(cb.getState()).toBe('CLOSED');
    });

    it('should create circuit breaker with custom config', () => {
      const customConfig = {
        failureThreshold: 10,
        successThreshold: 5,
        timeout: 30000,
        monitoringPeriod: 20000,
        maxConcurrentRequests: 20,
      };
      const cb = createToastCircuitBreaker(customConfig);
      expect(cb).toBeInstanceOf(CircuitBreaker);
    });
  });

  describe('Failure History Cleanup', () => {
    it('should clean up old failures outside monitoring period', async () => {
      const failOp = vi.fn().mockRejectedValue(new Error('error'));
      
      // Generate failures
      for (let i = 0; i < config.failureThreshold; i++) {
        await expect(circuitBreaker.execute(failOp)).rejects.toThrow();
      }
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      circuitBreaker.reset();
      
      // Set a very short monitoring period
      const shortConfig = { ...config, monitoringPeriod: 100 };
      const shortCircuitBreaker = new CircuitBreaker(shortConfig);
      
      // Generate failures
      for (let i = 0; i < config.failureThreshold - 1; i++) {
        await expect(shortCircuitBreaker.execute(failOp)).rejects.toThrow();
      }
      
      // Wait for monitoring period to pass
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // One more failure should not open circuit since old ones are cleaned up
      await expect(shortCircuitBreaker.execute(failOp)).rejects.toThrow();
      
      expect(shortCircuitBreaker.getState()).toBe('CLOSED');
    });
  });
});
