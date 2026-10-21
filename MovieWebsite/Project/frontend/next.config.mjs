/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true, // Bật Gzip/Brotli compression cho mọi Next.js static assets và SSR responses
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Proxy to Backend
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Ưu tiên định dạng AVIF siêu nhẹ, fallback WebP
    minimumCacheTTL: 86400, // Cache ảnh đã tối ưu hóa trong 24 giờ để tăng tốc độ tải lại
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
