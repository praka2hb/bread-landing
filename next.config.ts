import type { NextConfig } from "next";

// PostHog ingestion, proxied under our own domain so ad blockers don't drop
// the events. Swap `us` for `eu` in both hosts if the project moves to
// PostHog EU cloud.
const POSTHOG_ASSET_HOST = "https://us-assets.i.posthog.com";
const POSTHOG_INGEST_HOST = "https://us.i.posthog.com";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't walk up into the parent
  // `bread/` folder and pick up a stray lockfile there.
  turbopack: {
    root: __dirname,
  },
  // PostHog's API expects trailing slashes to survive untouched.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/deck",
        destination: "/deck/index.html",
      },
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSET_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_INGEST_HOST}/:path*`,
      },
    ];
  },
};

export default nextConfig;
