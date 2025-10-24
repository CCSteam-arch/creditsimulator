import { NextConfig } from 'next'; // Import the type

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = { // Add the type annotation
  // Add this line to force a static export:
  output: 'export',
  // Recommended: Disable image optimization for static export if not using a compatible loader
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
