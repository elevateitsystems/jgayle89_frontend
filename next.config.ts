import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is intentionally off: the Phase 1 demo keeps its state in
  // localStorage and uses client-only maps, which are simpler without it.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
