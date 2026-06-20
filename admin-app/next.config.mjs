/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'admin.dwell.bd' },
    ],
  },
  allowedDevOrigins: ['dwell.bd', 'admin.dwell.bd'],
};

export default nextConfig;
