/**
 * Circuit Breaker Implementation for Toast Notifications
 *
 * This utility implements the Circuit Breaker pattern to prevent cascading failures
 * and provide fallback behavior when the toast notification system is overwhelmed.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail fast
 * - HALF_OPEN: Testing if the system has recovered
 */

import { recordCircuitBreakerStateChange } from '@/lib/monitoring/metrics';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close circuit
  timeout: number; // Time in ms before attempting recovery
  monitoringPeriod: number; // Time window for failure counting
  maxConcurrentRequests: number; // Maximum concurrent toast operations
  maxConcurrentHalfOpenProbes: number; // Maximum concurrent recovery probes
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastStateChange?: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  monitoringPeriod: 10000, // 10 seconds
  maxConcurrentRequests: 10,
  maxConcurrentHalfOpenProbes: 1,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private activeRequests: number = 0;
  private activeHalfOpenProbes: number = 0;
  private failureHistory: number[] = [];
  private recoveryDeadline?: number;

  constructor(private config: CircuitBreakerConfig = DEFAULT_CONFIG) {}

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T> | T, fallback?: () => T): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open and timeout has elapsed
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN');
      } else {
        this.totalFailures++;
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }

    // Check concurrent request limit
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      this.totalFailures++;
      if (fallback) {
        return fallback();
      }
      throw new Error('Maximum concurrent requests reached');
    }

    const isHalfOpenProbe = this.state === 'HALF_OPEN';

    if (isHalfOpenProbe && this.activeHalfOpenProbes >= this.config.maxConcurrentHalfOpenProbes) {
      this.totalFailures++;
      if (fallback) {
        return fallback();
      }
      throw new Error('Maximum concurrent half-open probes reached');
    }

    this.activeRequests++;
    if (isHalfOpenProbe) {
      this.activeHalfOpenProbes++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    } finally {
      this.activeRequests--;
      if (isHalfOpenProbe) {
        this.activeHalfOpenProbes--;
      }
    }
  }

  /**
   * Record a successful operation
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.failureHistory = [];

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.successCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  private onFailure(): void {
    this.totalFailures++;
    const now = Date.now();
    this.lastFailureTime = now;

    // Clean up old failures outside monitoring period before recording
    // the current failure so the count represents the active window.
    this.failureHistory = this.failureHistory.filter(
      (time) => now - time < this.config.monitoringPeriod,
    );
    this.failureCount = this.failureHistory.length;
    this.failureHistory.push(now);

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      this.failureCount++;
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.recoveryDeadline) return false;
    return Date.now() >= this.recoveryDeadline;
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    if (previousState === newState) return;

    this.state = newState;
    this.lastStateChange = Date.now();

    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === 'OPEN') {
      this.successCount = 0;
      const recoveryDelay = Math.random() * this.config.timeout;
      this.recoveryDeadline = Date.now() + recoveryDelay;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
    }

    recordCircuitBreakerStateChange(previousState, newState);
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo('CLOSED');
    this.failureHistory = [];
    this.recoveryDeadline = undefined;
    this.lastFailureTime = undefined;
  }

  /**
   * Check if circuit is currently allowing requests
   */
  isClosed(): boolean {
    return this.state === 'CLOSED';
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Create a circuit breaker instance for toast notifications
 */
export function createToastCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  return new CircuitBreaker({ ...DEFAULT_CONFIG, ...config });
}
