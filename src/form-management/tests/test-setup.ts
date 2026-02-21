/**
 * Test Setup for Form Management System
 * 
 * This file configures the testing environment for property-based testing
 * using fast-check and unit testing with Vitest.
 */

import { beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Configure fast-check for consistent property-based testing
export const testConfig = {
  // Minimum 100 iterations per property test as specified in design document
  numRuns: 100,
  // Enable verbose mode for better debugging
  verbose: false,
  // Set seed for reproducible tests (can be overridden)
  seed: 42,
  // Configure shrinking for minimal failing examples
  maxSkipsPerRun: 100,
};

// Global test setup
beforeEach(() => {
  // Reset any global state before each test
});

afterEach(() => {
  // Clean up after each test
});

// Export fast-check for use in tests
export { fc };