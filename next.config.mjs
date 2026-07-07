// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

const imageHosts = [
  'image.tmdb.org',
  'prd-rteditorial.s3.us-west-2.amazonaws.com',
  'lh3.googleusercontent.com',
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com',
  // News RSS feed image hosts (see src/server/news.ts FEEDS)
  'variety.com',
  'www.hollywoodreporter.com',
  'deadline.com',
];

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  // Pin the workspace root so a stray lockfile elsewhere doesn't confuse tracing
  outputFileTracingRoot: process.cwd(),
  images: {
    // Serve remote images directly instead of through /_next/image. Every
    // optimized image is a metered Vercel edge request + transformation, and
    // with ~20 posters per page that multiplier was the main driver of blowing
    // the free tier's edge-request quota. TMDB already serves size-appropriate
    // renditions (w342/w500/w780), so on-the-fly optimization buys little here.
    // Trade-off: no AVIF/WebP re-encoding and no responsive srcset.
    unoptimized: true,
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
  },
};
export default config;
