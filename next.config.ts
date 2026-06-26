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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://lh3.googleusercontent.com https://drive.google.com https://vumbnail.com https://avatars.githubusercontent.com https://*.supabase.co https://res.cloudinary.com https://*.cloudinary.com https://ik.imagekit.io https://*.mux.com",
              "media-src 'self' https://*.mux.com blob:",
              "connect-src 'self' https://*.supabase.co https://accounts.google.com https://www.google-analytics.com https://*.mux.com wss://*.supabase.co https://cloudflareinsights.com",
              "frame-src https://accounts.google.com https://www.youtube.com https://player.vimeo.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          {
            key: "Link",
            value: [
              "<https://fonts.googleapis.com>; rel=preconnect",
              "<https://accounts.google.com>; rel=preconnect",
            ].join(", "),
          },
        ],
      },
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
    ];
  },
};

export default nextConfig;
