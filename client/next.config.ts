import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configure output file tracing root to silence workspace warning
  outputFileTracingRoot: path.join(__dirname),
  
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Proxy API requests to backend server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // Turbopack handles module resolution differently than webpack
    // The workspace setup should work without explicit module path configuration
  },
  
  // Configure webpack to resolve modules from the client directory
  webpack: (config, { isServer }) => {
    // Ensure modules are resolved from client/node_modules first, not workspace root
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    // Prepend client node_modules to the resolve path
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...config.resolve.modules,
    ];
    return config;
  },
};

export default nextConfig;
