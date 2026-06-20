/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'dwell.bd' },
    ],
  },
  allowedDevOrigins: ['dwell.bd', 'admin.dwell.bd', '192.168.0.177'],
};

export default nextConfig;
