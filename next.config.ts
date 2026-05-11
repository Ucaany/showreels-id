import type { NextConfig } from "next";

const PUBLIC_HTML_CACHE_HEADERS = [
  {
    key: "Cache-Control",
    value: "public, max-age=60, s-maxage=60, stale-while-revalidate=86400",
  },
];

const RESERVED_PUBLIC_SEGMENTS = [
  "dashboard",
  "login",
  "register",
  "pricing",
  "settings",
  "admin",
  "api",
  "show",
  "help",
  "terms",
  "privacy",
  "billing",
  "creator",
  "profile",
  "auth",
  "about",
  "legal",
  "videos",
  "v",
  "customer-service",
  "onboarding",
  "payment",
  "favicon\\.ico",
  "robots\\.txt",
  "sitemap\\.xml",
  "site\\.webmanifest",
  "favicon\\.svg",
  "favicon-96x96\\.png",
  "apple-touch-icon\\.png",
].join("|");

const PUBLIC_SLUG_SOURCE = `/:slug((?!${RESERVED_PUBLIC_SEGMENTS}$)[^/]+)`;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "vumbnail.com" },
      { protocol: "https", hostname: "www.instagram.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "**.mux.com" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "swr",
      "react-loading-skeleton",
    ],
  },
  compress: true,
  poweredByHeader: false,

  // Enable Turbopack (default in Next.js 16) with empty config to silence webpack warning
  turbopack: {},

  // Cache headers untuk static assets
  async headers() {
    return [
      {
        source: PUBLIC_SLUG_SOURCE,
        headers: PUBLIC_HTML_CACHE_HEADERS,
      },
      {
        source: `${PUBLIC_SLUG_SOURCE}/show`,
        headers: PUBLIC_HTML_CACHE_HEADERS,
      },
      {
        source: "/v/:slug",
        headers: PUBLIC_HTML_CACHE_HEADERS,
      },
      {
        source: "/creator/:username/portfolio",
        headers: PUBLIC_HTML_CACHE_HEADERS,
      },
      {
        source: "/:path*.(svg|jpg|jpeg|png|gif|ico|webp|avif|mp4|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/thumbnails/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Preconnect headers untuk external domains
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: [
              "<https://fonts.googleapis.com>; rel=preconnect",
              "<https://accounts.google.com>; rel=preconnect",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
