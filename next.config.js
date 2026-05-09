/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Strict Mode in development to prevent Leaflet double-initialization
  // Strict Mode is still enabled in production for better error detection
  reactStrictMode: process.env.NODE_ENV === 'production',
};

module.exports = nextConfig;
