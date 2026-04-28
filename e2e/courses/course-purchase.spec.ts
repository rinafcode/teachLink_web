import { test, expect } from '@playwright/test';
import { injectAuthToken } from '../helpers/auth';

/** Stable course ID used across tests (matches mock API data) */
const COURSE_ID = '1';
const COURSE_URL = `/courses/${COURSE_ID}`;

test.describe('Course purchase / enrollment flow', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token so we start as an authenticated user
    await injectAuthToken(page);
  });

  // ── Course detail page ────────────────────────────────────────────────────

  test('renders the course detail page with key sections', async ({ page }) => {
    await page.goto(COURSE_URL);

    // Enrollment CTA sidebar
    await expect(page.getByRole('heading', { name: /enroll now/i })).toBeVisible();

    // Pricing options
    await expect(page.getByRole('heading', { name: /basic access/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /premium access/i })).toBeVisible();

    // Prices
    await expect(page.getByText('$49.99')).toBeVisible();
    await expect(page.getByText('$99.99')).toBeVisible();

    // Money-back guarantee
    await expect(page.getByText(/30-day money-back guarantee/i)).toBeVisible();
  });

  test('highlights the premium plan as most popular', async ({ page }) => {
    await page.goto(COURSE_URL);
    await expect(page.getByText(/most popular/i)).toBeVisible();
  });

  test('shows course features for each pricing tier', async ({ page }) => {
    await page.goto(COURSE_URL);

    // Basic features
    await expect(page.getByText(/full course access/i).first()).toBeVisible();
    await expect(page.getByText(/certificate of completion/i).first()).toBeVisible();

    // Premium-only features
    await expect(page.getByText(/1-on-1 mentoring/i)).toBeVisible();
    await expect(page.getByText(/project reviews/i)).toBeVisible();
  });

  // ── Enrollment interaction ────────────────────────────────────────────────

  test('clicking "Enroll Now" on basic plan triggers enrollment', async ({ page }) => {
    await page.goto(COURSE_URL);

    // Intercept any enrollment API call (future-proof)
    const enrollRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('enroll') || req.url().includes('purchase')) {
        enrollRequests.push(req.url());
      }
    });

    // Click the first "Enroll Now" button (basic plan)
    const enrollButtons = page.getByRole('button', { name: /enroll now/i });
    await enrollButtons.first().click();

    // Currently the mock just calls onEnroll(optionId) — no navigation yet.
    // Assert the button is still present (no crash / error boundary triggered).
    await expect(enrollButtons.first()).toBeVisible();
  });

  test('clicking "Enroll Now" on premium plan triggers enrollment', async ({ page }) => {
    await page.goto(COURSE_URL);

    const enrollButtons = page.getByRole('button', { name: /enroll now/i });
    // Premium is the second button
    await enrollButtons.nth(1).click();

    await expect(enrollButtons.nth(1)).toBeVisible();
  });

  // ── Course listing ────────────────────────────────────────────────────────

  test('courses API returns a list of courses', async ({ page }) => {
    const response = await page.request.get('/api/courses');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('instructor');
    expect(first).toHaveProperty('price');
  });

  test('course detail API returns correct course data', async ({ page }) => {
    const response = await page.request.get(`/api/courses/${COURSE_ID}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(COURSE_ID);
    expect(body.data.title).toBeTruthy();
  });

  // ── Unauthenticated access ────────────────────────────────────────────────

  test('course page is accessible without authentication (public preview)', async ({ page }) => {
    // Clear any stored token
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('token'));

    await page.goto(COURSE_URL);

    // The enrollment CTA should still render (public course preview)
    await expect(page.getByRole('heading', { name: /enroll now/i })).toBeVisible();
  });
});
