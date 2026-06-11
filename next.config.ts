import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // Playwright E2E uses 127.0.0.1; without this, client JS fails to load in dev
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
