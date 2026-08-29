import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["async_hooks"],

  // Code-splitting optimization for heavy libraries
  experimental: {
    optimizePackageImports: [
      "@monaco-editor/react",
      "video.js",
      "ethers",
      "recharts",
      "framer-motion",
      "date-fns",
    ],
  },

  modularizeImports: {
    lodash: {
      transform: "lodash/{{member}}",
    },
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },
  eslint: {
    // Many legacy files do not match Prettier; keep type checking without blocking production builds.
    ignoreDuringBuilds: true,
  },

  // ── Asset Versioning & Cache Headers (#326) ──────────────────────────────
  // Next.js already content-hashes JS/CSS chunks in /_next/static/.
  // We add long-lived cache headers for those immutable assets and a
  // short revalidation window for HTML pages so users never see stale UI.
  async headers() {
    // Next applies *every* matching header rule in array order (later rules win
    // for the same key), so a catch-all `source` on the HTML rule overlapped the
    // hashed-asset rules below and clobbered their `Cache-Control`.
    //
    // `htmlSource` scopes the HTML rule with a negative lookahead so it can never
    // match Next's own internal/immutable routes (`/_next/…`, which covers
    // `/_next/static/…`, `/_next/image` and `/_next/data`) or the public
    // `static/` asset prefix. Anything that is not those prefixes is a page and
    // still gets `max-age=0, must-revalidate`.
    //
    // The `(?:/|$)` tails matter: they make each exclusion cover the whole
    // prefix *and* every path under it, while never excluding look-alike routes
    // that merely start with the same letters (`/static-assets`, `/_nextjs`),
    // which must keep revalidating.
    //
    // NOTE: the lookahead sits right after the `/` the `source` prefix supplies,
    // so excluded segments are written *without* their leading slash.
    const htmlExcludedPrefixes = ["_next(?:/|$)", "static(?:/|$)"];
    const htmlSource = `/((?!${htmlExcludedPrefixes.join("|")}).*)`;

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      {
        // Immutable hashed static assets – cache for 1 year
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Public folder assets (images, fonts, etc.) – cache for 7 days
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // HTML pages – always revalidate so deployments are picked up quickly.
        // `htmlSource` is what makes this rule safe: it is scoped to everything
        // that is *not* a hashed/asset prefix, so it can no longer overlap (and,
        // because it was last in the array, override) the immutable and 7-day
        // rules above.
        source: htmlSource,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "thumbs.dreamstime.com",
      },
      {
        protocol: "https",
        hostname: "static.vecteezy.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };

    // Optimize chunk splitting for heavy libraries
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            monaco: {
              test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
              name: "monaco-editor",
              chunks: "async",
              priority: 30,
            },
            videojs: {
              test: /[\\/]node_modules[\\/](video\.js|videojs-)[\\/]/,
              name: "video-player",
              chunks: "async",
              priority: 30,
            },
            ethers: {
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              name: "ethers",
              chunks: "async",
              priority: 30,
            },
          },
        },
      };
    }

    // Enable bundle analysis when ANALYZE=true
    if (process.env.ANALYZE === "true") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic require for optional bundle analyzer
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: isServer
            ? "../analyze/server.html"
            : "./analyze/client.html",
          openAnalyzer: false,
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
