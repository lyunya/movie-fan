// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));


/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  images: {
    domains: [
      'image.tmdb.org',
      'resizing.flixster.com',
      'flxt.tmsimg.com',
      'images.fandango.com',
      'prd-rteditorial.s3.us-west-2.amazonaws.com',
      'lh3.googleusercontent.com',
    ],
  },
}
export default config;
