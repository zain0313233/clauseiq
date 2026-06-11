import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright E2E uses 127.0.0.1; without this, client JS fails to load in dev
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
