import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Supabase storage images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Security headers for all routes
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send origin as referrer to third-party sites
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable unused browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Force HTTPS (respected by browsers after first visit)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Allow framing only from same origin (needed for dashboard iframe previews)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
