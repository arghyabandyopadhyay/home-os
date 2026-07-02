import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "http",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "http",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // Document thumbnails served from Supabase Storage
      // Pattern: <project-ref>.supabase.co/storage/v1/object/...
      // TODO: Replace with specific project hostname if a tighter pattern is preferred
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};
export default nextConfig;
