import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://showreels.id";

export default function robots(): MetadataRoute.Robots {
  let host: string | undefined;
  try {
    host = new URL(BASE.startsWith("http") ? BASE : `https://${BASE}`).host;
  } catch {
    host = undefined;
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/admin/", "/auth/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    ...(host ? { host } : {}),
  };
}
