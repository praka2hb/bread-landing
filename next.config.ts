import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't walk up into the parent
  // `bread/` folder and pick up a stray lockfile there.
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/deck",
        destination: "/deck/index.html",
      },
    ];
  },
};

export default nextConfig;
