/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Proxy to Backend
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phim.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'img.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'phim.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;