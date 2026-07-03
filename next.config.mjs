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
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
  },
};
export default config;
