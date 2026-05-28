import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: '2.25.131.139', port: '8080', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://2.25.131.139:8080/api/:path*',
      },
      {
        source: '/ws/:path*',
        destination: 'http://2.25.131.139:8080/ws/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://2.25.131.139:8080/uploads/:path*',
      }
    ];
  },
};

export default nextConfig;
