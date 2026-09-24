/**
 * Regression tests for the Cache-Control header rules in `next.config.ts` (#326).
 *
 * Next applies *every* matching header rule in array order and a later rule wins
 * for the same key, so an unscoped catch-all `source` on the HTML
 * `max-age=0, must-revalidate` rule silently clobbered the long-lived
 * `Cache-Control` set for `/_next/static/**` (immutable) and `/static/**` (7 days).
 *
 * These tests compile the real rules with Next's own route builder + matcher (no
 * re-implementation of Next semantics) and assert that exactly one
 * `Cache-Control` rule matches any given path.
 */
import { describe, expect, it } from "vitest";
import { buildCustomRoute } from "next/dist/lib/build-custom-route";
import { getRouteMatcher } from "next/dist/shared/lib/router/utils/route-matcher";
import nextConfig from "./next.config";

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const IMMUTABLE = "public, max-age=31536000, immutable";
const WEEK = "public, max-age=604800, stale-while-revalidate=86400";
const REVALIDATE = "public, max-age=0, must-revalidate";

async function getHeaderRules(): Promise<HeaderRule[]> {
  const rules = await nextConfig.headers!();
  return rules as unknown as HeaderRule[];
}

/** Compile a rule the way Next does, and return a pathname matcher. */
function matcherFor(source: string) {
  const route = buildCustomRoute("header", { source, headers: [] });
  const re = new RegExp(route.regex, "i");
  return getRouteMatcher({ re, groups: {} });
}

/** Which rules would set Cache-Control for `pathname`, in array order. */
async function cacheControlRulesFor(pathname: string): Promise<string[]> {
  const rules = await getHeaderRules();
  return rules
    .filter((rule) => matcherFor(rule.source)(pathname) !== false)
    .filter((rule) =>
      rule.headers.some((header) => header.key === "Cache-Control"),
    )
    .map(
      (rule) =>
        rule.headers.find((header) => header.key === "Cache-Control")!.value,
    );
}

async function effectiveCacheControl(
  pathname: string,
): Promise<string | undefined> {
  const matches = await cacheControlRulesFor(pathname);
  return matches[matches.length - 1];
}

const PAGES = [
  "/",
  "/dashboard",
  "/courses/react",
  "/instructor/classes",
  "/profile",
  "/api/health",
];
const NEXT_ASSETS = [
  "/_next/static/chunks/main-app-a1b2c3.js",
  "/_next/static/css/4e5f6a7b.css",
  "/_next/static/media/logo.abc123.svg",
];
const PUBLIC_ASSETS = ["/static/img/logo.png", "/static/fonts/inter.woff2"];

describe("next.config headers() – Cache-Control scoping (#326)", () => {
  it("does not let the HTML rule overlap static asset routes", async () => {
    const paths = [
      ...PAGES,
      ...NEXT_ASSETS,
      ...PUBLIC_ASSETS,
      "/favicon.ico",
      "/_next/image",
    ];

    for (const pathname of paths) {
      const matches = await cacheControlRulesFor(pathname);
      expect(
        matches.length,
        `${pathname} matched ${matches.length} Cache-Control rules`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it.each(NEXT_ASSETS)(
    "keeps hashed assets immutable: %s",
    async (pathname) => {
      await expect(effectiveCacheControl(pathname)).resolves.toBe(IMMUTABLE);
    },
  );

  it.each(PUBLIC_ASSETS)(
    "keeps public assets cached for 7 days: %s",
    async (pathname) => {
      await expect(effectiveCacheControl(pathname)).resolves.toBe(WEEK);
    },
  );

  it.each(PAGES)("revalidates HTML pages: %s", async (pathname) => {
    await expect(effectiveCacheControl(pathname)).resolves.toBe(REVALIDATE);
  });

  it("scopes the HTML rule instead of using a bare catch-all source", async () => {
    const rules = await getHeaderRules();
    const htmlRule = rules.find((rule) =>
      rule.headers.some((header) => header.value === REVALIDATE),
    );

    expect(htmlRule, "no rule sets the HTML revalidation header").toBeDefined();
    // A catch-all like '/(.*)' or '/:path*' matches every URL, including assets.
    expect(htmlRule!.source).not.toBe("/:path*");
    expect(htmlRule!.source).not.toBe("/(.*)");
    expect(
      matcherFor(htmlRule!.source)("/_next/static/chunks/main-abc123.js"),
    ).toBe(false);
    expect(matcherFor(htmlRule!.source)("/static/img/logo.png")).toBe(false);
  });

  it("still revalidates routes that merely share a prefix with the excluded ones", async () => {
    // Guards against an over-broad exclusion such as `(?!static)` or `(?!_next)`.
    await expect(effectiveCacheControl("/static-assets/app.js")).resolves.toBe(
      REVALIDATE,
    );
    await expect(effectiveCacheControl("/_nextjs/config")).resolves.toBe(
      REVALIDATE,
    );
    await expect(effectiveCacheControl("/statistics")).resolves.toBe(
      REVALIDATE,
    );
  });

  it("leaves Next-owned /_next routes to Next defaults", async () => {
    // /_next/image and /_next/data get their Cache-Control from Next itself;
    // overriding it with must-revalidate would defeat the image CDN cache.
    await expect(
      effectiveCacheControl("/_next/image"),
    ).resolves.toBeUndefined();
    await expect(
      effectiveCacheControl("/_next/data/abc123/index.json"),
    ).resolves.toBeUndefined();
  });

  it("still applies the site-wide security headers to assets and pages alike", async () => {
    const rules = await getHeaderRules();
    const security = rules[0];

    expect(security.source).toBe("/(.*)");
    expect(security.headers.map((header) => header.key)).toContain(
      "X-Frame-Options",
    );
    expect(
      matcherFor(security.source)("/_next/static/chunks/main-abc123.js"),
    ).not.toBe(false);
    expect(matcherFor(security.source)("/dashboard")).not.toBe(false);
    // The broad rule must never carry Cache-Control, otherwise it competes with
    // the specific rules above again.
    expect(
      security.headers.some((header) => header.key === "Cache-Control"),
    ).toBe(false);
  });
});
