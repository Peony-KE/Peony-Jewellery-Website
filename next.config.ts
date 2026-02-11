import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow any external image URL - avoids private IP resolution errors with Supabase CDN
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
