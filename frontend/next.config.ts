import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: '2.25.131.139', port: '8080', pathname: '/**' },
    ],
  },
};

export default nextConfig;
