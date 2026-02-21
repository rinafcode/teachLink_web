import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

export interface PerformanceMetrics {
  renderTime: number;
  rerenderTime: number;
  memoryUsage?: number;
}

export interface MockApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

export interface WaitForOptions {
  timeout?: number;
  interval?: number;
}

// custom render
/**
 * Wraps RTL render with providers and returns userEvent setup.
 * Usage: const { user, getByRole } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { wrapper?: (props: { children: ReactNode }) => ReactElement }
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  const result = render(ui, { ...options });
  return { ...result, user };
}

// Mock Factories
/**
 * Creates a typed mock API response for fetch mocking.
 */
export function createMockResponse<T>(data: T, status = 200): MockApiResponse<T> {
  return { data, status, ok: status >= 200 && status < 300 };
}

export function mockFetch<T>(data: T, status = 200) {
  const mockResponse: MockApiResponse<T> = createMockResponse(data, status);
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: mockResponse.ok,
    status: mockResponse.status,
    json: vi.fn().mockResolvedValue(mockResponse.data),
    text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse.data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
    clone: vi.fn(),
  } as unknown as Response);
}

/**
 * Mocks fetch to reject with an error.
 */
export function mockFetchError(message = 'Network error') {
  return vi.spyOn(global, 'fetch').mockRejectedValue(new Error(message));
}

/**
 * Creates a fake TestUser object with optional overrides.
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  };
}

// Performance Helpers 

/**
 * Measures how long a synchronous or async callback takes.
 */
export async function measureExecutionTime(fn: () => void | Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/**
 * Asserts that a callback completes within a given time budget (ms).
 */
export async function expectWithinBudget(
  fn: () => void | Promise<void>,
  budgetMs: number
): Promise<void> {
  const elapsed = await measureExecutionTime(fn);
  if (elapsed > budgetMs) {
    throw new Error(
      `Performance budget exceeded: expected ≤${budgetMs}ms but got ${elapsed.toFixed(2)}ms`
    );
  }
}

// Async Utilities

/**
 * Waits for a predicate to return true, polling at a given interval.
 */
export async function waitForCondition(
  predicate: () => boolean | Promise<boolean>,
  { timeout = 3000, interval = 50 }: WaitForOptions = {}
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`waitForCondition timed out after ${timeout}ms`);
}

/**
 * Flushes all pending promises in the microtask queue.
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// LocalStorage Helpers

export const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

export function setupLocalStorageMock(): void {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// Event Helpers

/**
 * Creates a synthetic File object for upload tests.
 */
export function createMockFile(name = 'test.txt', content = 'hello', type = 'text/plain'): File {
  return new File([content], name, { type });
}

/**
 * Simulates a window resize event.
 */
export function simulateResize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}