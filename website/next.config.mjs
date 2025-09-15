import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to support API routes
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // Set the workspace root to avoid lockfile conflicts
  outputFileTracingRoot: __dirname,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname + '/src',
    };
    return config;
  },
}

export default nextConfig
