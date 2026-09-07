import type { NextConfig } from "next";

// Static export into the existing S3 + CloudFront pipeline. BASE_PATH is only
// used for the /next/ preview build; production builds with it empty.
const config: NextConfig = {
  output: "export",
  basePath: process.env.BASE_PATH || "",
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || "",
    NEXT_PUBLIC_SITE_URL: process.env.SITE_URL || "https://elyoxe.com",
    NEXT_PUBLIC_PREVIEW: process.env.PREVIEW || "",
  },
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["three"],
  reactStrictMode: true,
  // one fewer render-blocking request on the LCP path: the (small) CSS ships in the HTML
  experimental: { inlineCss: true },
};

export default config;
